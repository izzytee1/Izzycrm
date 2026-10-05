const scannerSettings = { regularPages: 8, ocrPages: 2 };
const scannerSession = {
  status: "idle",
  files: [],
  rows: [],
  audit: [],
  stats: blankStats(),
  started: false,
  elapsed: 0,
  remaining: null,
  progress: 0,
  doneFiles: 0,
  totalFiles: 0,
  activity: [],
  sort: "original",
  auditOpen: true,
  storageBytes: 0,
  resultBytes: 0,
  ocr: { required: 0, processing: 0, completed: 0, failed: 0 }
};
let scanTimer = 0;
let scanToken = 0;
let scanPaused = false;
let scanStopped = false;
let scanIndex = 0;
let scanSteps = [];
let scannerMounted = false;
const SETTINGS_KEY = "forge.scanner.settings";
const CACHE_KEY = "forge.scanner.cache";

function blankStats() {
  return { files: null, applications: null, statements: null, ocr: null, completed: null, failed: null };
}
function companyKey(name) {
  return String(name || "").toLowerCase().replace(/\b(llc|inc|corp|llp|lp|pc|co)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function money(n) {
  if (n == null || n === "") return "";
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function joinList(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(" · ");
  return v == null ? "" : String(v);
}
function statText(v) { return v == null ? "—" : String(v); }
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (saved && Number(saved.regularPages) > 0) scannerSettings.regularPages = Number(saved.regularPages);
    if (saved && Number(saved.ocrPages) > 0) scannerSettings.ocrPages = Number(saved.ocrPages);
  } catch (err) { /* settings stay at defaults */ }
}
function saveSettings() {
  const reg = Number($("#regularPages").value);
  const ocr = Number($("#ocrPages").value);
  if (!reg || !ocr) { toast("Enter page limits"); return; }
  scannerSettings.regularPages = reg;
  scannerSettings.ocrPages = ocr;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(scannerSettings));
  toast("Settings saved");
}
function shortLabel(name) {
  const base = String(name || "").replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
  const month = base.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i);
  const kind = /\bapp\b/i.test(base) ? "APP" : month ? month[1].slice(0, 3).toUpperCase() : "FILE";
  const company = base.replace(/\b(app|application|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|statement)\b/ig, "").replace(/\s+/g, " ").trim();
  return (company || "File") + " " + kind;
}
function fixtureFor(label) {
  const key = companyKey(label);
  const skip = new Set(["app", "file", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]);
  const tokens = key.split(" ").filter((t) => t.length > 2 && !skip.has(t));
  return Object.values(MOCK_SCANNER_FIXTURES).find((f) => {
    const fk = companyKey(f.company);
    if (key.includes(fk) || fk.includes(key)) return true;
    const ft = fk.split(" ").filter((t) => t.length > 2);
    const hit = tokens.filter((t) => ft.includes(t));
    return hit.length >= Math.min(2, ft.length) && hit.length > 0;
  }) || null;
}
async function listZipNames(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);
  let eocd = -1;
  const start = Math.max(0, bytes.length - 22 - 65535);
  for (let i = bytes.length - 22; i >= start; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Not a readable ZIP");
  const count = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const names = [];
  for (let n = 0; n < count; n++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const len = view.getUint16(ptr + 28, true);
    const extra = view.getUint16(ptr + 30, true);
    const comment = view.getUint16(ptr + 32, true);
    const name = new TextDecoder().decode(bytes.slice(ptr + 46, ptr + 46 + len));
    if (/\.pdf$/i.test(name) && !name.endsWith("/")) names.push(name.split("/").pop());
    ptr += 46 + len + extra + comment;
  }
  return names;
}
function ensureRow(label) {
  const fix = fixtureFor(label);
  const company = fix ? fix.company : label.replace(/\b(APP|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|FILE)\b/g, "").trim();
  const key = companyKey(company);
  let row = scannerSession.rows.find((r) => companyKey(r.company || r.label || r.fields.company) === key);
  if (!row) {
    row = { id: "r" + scannerSession.rows.length, order: scannerSession.rows.length, label: company, company: "", fields: {}, statements: [] };
    scannerSession.rows.push(row);
    appendScanRow(row);
  }
  return row;
}
function buildSteps(files) {
  const steps = [];
  const seen = new Set();
  files.forEach((file) => {
    const label = shortLabel(file.name);
    const fix = fixtureFor(label);
    const failed = /red oak/i.test(file.name) && /feb/i.test(file.name);
    if (failed) {
      steps.push({ file, label, phase: "Failed", fail: "Statement unreadable", delay: 140 });
      return;
    }
    const rowLabel = fix ? fix.company : label.replace(/\b(APP|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|FILE)\b/g, "").trim();
    const fields = fix ? [
      ["company", fix.company], ["dba", fix.dba], ["address", fix.address], ["city", fix.city], ["state", fix.state], ["zip", fix.zip],
      ["phone", fix.phone], ["mobile", fix.mobile], ["email", fix.email], ["owners", fix.owners], ["ssn", fix.ssn], ["ein", fix.ein],
      ["startDate", fix.startDate], ["appDate", fix.appDate], ["bank", fix.bank], ["account", fix.account], ["routing", fix.routing],
      ["revenue", fix.revenue], ["approval", fix.approval], ["monthlyDeposits", fix.monthlyDeposits], ["endingBalance", fix.endingBalance],
      ["mcaAmount", fix.mcaAmount], ["dailyPayment", fix.dailyPayment], ["months", fix.months]
    ] : [["company", rowLabel], ["notes", "No extraction engine connected"]];
    const ocrFile = !!(fix && fix.ocr && /mar/i.test(label));
    if (ocrFile) steps.push({ file, label, phase: "OCR", ocr: true, delay: 160 });
    fields.forEach((pair) => {
      const id = companyKey(rowLabel) + ":" + pair[0];
      if (seen.has(id)) return;
      seen.add(id);
      steps.push({ file, label, phase: ocrFile ? "OCR" : "Scanning", field: pair[0], value: pair[1], delay: 70 });
    });
    const month = label.match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/);
    if (month) steps.push({ file, label, phase: ocrFile ? "OCR" : "Scanning", field: "statements", value: month[1], delay: 60 });
    steps.push({ file, label, phase: "Completed", done: true, ocrFile, delay: 40 });
  });
  return steps;
}
const scannerAdapter = {
  async ingest(fileList) {
    const incoming = Array.from(fileList || []);
    for (const file of incoming) {
      scannerSession.activity.unshift({ label: file.name, phase: "Accepted" });
      if (/\.zip$/i.test(file.name)) {
        scannerSession.activity.unshift({ label: file.name, phase: "Unzipping" });
        try {
          const names = await listZipNames(file);
          names.forEach((name) => scannerSession.files.push({ name, size: 0, source: file.name }));
          if (!names.length) scannerSession.audit.push({ kind: "ZIP", text: file.name + " had no PDFs" });
        } catch (err) {
          scannerSession.audit.push({ kind: "Failed", text: file.name + " could not be read" });
          scannerSession.stats.failed = (scannerSession.stats.failed || 0) + 1;
        }
      } else if (/\.pdf$/i.test(file.name)) {
        scannerSession.files.push({ name: file.name, size: file.size || 0, source: "" });
      } else {
        scannerSession.audit.push({ kind: "Skipped", text: file.name + " is not a PDF or ZIP" });
      }
      scannerSession.storageBytes += file.size || 0;
    }
    scannerSession.status = scannerSession.files.length ? "queued" : scannerSession.status;
    scannerSession.activity.unshift({ label: scannerSession.files.length + " files", phase: "Queued" });
    paintScanner();
  },
  start() {
    if (!scannerSession.files.length) { toast("Add files first"); return; }
    if (scannerSession.status === "running") { toast("Scan already running"); return; }
    scanPaused = false;
    scanStopped = false;
    scanToken += 1;
    const token = scanToken;
    if (scannerSession.status === "idle" || scannerSession.status === "done" || scannerSession.status === "queued") {
      scannerSession.started = true;
      scannerSession.elapsed = 0;
      scannerSession.progress = 0;
      scannerSession.doneFiles = 0;
      scannerSession.rows = [];
      scannerSession.audit = [];
      scannerSession.ocr = { required: 0, processing: 0, completed: 0, failed: 0 };
      scannerSession.stats = { files: scannerSession.files.length, applications: 0, statements: 0, ocr: 0, completed: 0, failed: 0 };
      scannerSession.totalFiles = scannerSession.files.length;
      const body = $("#scanBody");
      if (body) body.innerHTML = "";
      scanSteps = buildSteps(scannerSession.files);
      scanIndex = 0;
    }
    scannerSession.status = "running";
    clearInterval(scanTimer);
    scanTimer = setInterval(() => {
      if (scannerSession.status === "running") {
        scannerSession.elapsed += 1;
        const pct = scanSteps.length ? scanIndex / scanSteps.length : 0;
        scannerSession.remaining = pct > 0 ? Math.max(0, Math.round(scannerSession.elapsed * (1 - pct) / pct)) : null;
        paintScanner();
      }
    }, 1000);
    paintScanner();
    runSteps(token);
  },
  pause() {
    if (scannerSession.status !== "running") { toast("Nothing to pause"); return; }
    scanPaused = true;
    scannerSession.status = "paused";
    paintScanner();
  },
  resume() {
    if (scannerSession.status !== "paused" && !(scannerSession.status === "stopped" && scanIndex < scanSteps.length)) { toast("Nothing to continue"); return; }
    scanPaused = false;
    scanStopped = false;
    scannerSession.status = "running";
    const token = scanToken;
    paintScanner();
    runSteps(token);
  },
  stop() {
    if (scannerSession.status !== "running" && scannerSession.status !== "paused") { toast("Nothing to stop"); return; }
    scanStopped = true;
    scanPaused = false;
    scannerSession.status = "stopped";
    paintScanner();
  },
  exportXlsx() {
    const rows = sortedRows();
    if (!rows.length) { toast("No results to export"); return; }
    const header = SCAN_COLS.map((c) => c[1]);
    const data = rows.map((r) => SCAN_COLS.map((c) => displayCell(r, c[0])));
    downloadXlsx("scanner-results.xlsx", header, data);
    toast("Exported");
  },
  clearStorage() {
    scanToken += 1;
    scanPaused = false;
    scanStopped = true;
    clearInterval(scanTimer);
    scannerSession.status = "idle";
    scannerSession.files = [];
    scannerSession.rows = [];
    scannerSession.audit = [];
    scannerSession.stats = blankStats();
    scannerSession.started = false;
    scannerSession.elapsed = 0;
    scannerSession.remaining = null;
    scannerSession.progress = 0;
    scannerSession.doneFiles = 0;
    scannerSession.totalFiles = 0;
    scannerSession.activity = [];
    scannerSession.storageBytes = 0;
    scannerSession.resultBytes = 0;
    scannerSession.ocr = { required: 0, processing: 0, completed: 0, failed: 0 };
    localStorage.removeItem(CACHE_KEY);
    const body = $("#scanBody");
    if (body) body.innerHTML = "";
    const file = $("#scanFile");
    if (file) file.value = "";
    paintScanner();
    toast("Scanner storage cleared");
  }
};
async function runSteps(token) {
  while (scanIndex < scanSteps.length) {
    if (token !== scanToken || scanStopped) return;
    if (scanPaused) return;
    const step = scanSteps[scanIndex];
    scanIndex += 1;
    scannerSession.activity.unshift({ label: step.label, phase: step.phase });
    scannerSession.activity = scannerSession.activity.slice(0, 8);
    if (step.ocr) {
      scannerSession.ocr.required += 1;
      scannerSession.ocr.processing += 1;
      scannerSession.stats.ocr = scannerSession.ocr.required;
      scannerSession.audit.push({ kind: "OCR", text: step.label + " sent to OCR" });
    }
    paintScanner();
    await new Promise((resolve) => setTimeout(resolve, step.delay));
    if (token !== scanToken || scanStopped || scanPaused) {
      if (scanPaused) scanIndex -= 1;
      return;
    }
    if (step.fail) {
      scannerSession.stats.failed = (scannerSession.stats.failed || 0) + 1;
      scannerSession.audit.push({ kind: "Failed", text: step.label + " · " + step.fail });
      const row = ensureRow(step.label);
      row.fields.company = row.fields.company || row.label;
      row.fields.notes = step.fail;
      paintCell(row, "company");
      paintCell(row, "notes");
    } else if (step.field) {
      const row = ensureRow(step.label);
      if (!row.company && step.field === "company") row.company = step.value;
      if (step.field === "statements") {
        if (!row.statements.includes(step.value)) row.statements.push(step.value);
        row.fields.statements = row.statements.join(" · ");
        scannerSession.stats.statements = (scannerSession.stats.statements || 0) + 1;
      } else if (Array.isArray(step.value)) {
        const prev = Array.isArray(row.fields[step.field]) ? row.fields[step.field] : [];
        row.fields[step.field] = Array.from(new Set(prev.concat(step.value)));
      } else row.fields[step.field] = step.value;
      if (step.field === "company" && /\bAPP\b/.test(step.label)) scannerSession.stats.applications = (scannerSession.stats.applications || 0) + 1;
      paintCell(row, step.field === "statements" ? "statements" : step.field);
      if (step.field === "company") paintCell(row, "n");
    }
    if (step.done) {
      scannerSession.doneFiles += 1;
      scannerSession.stats.completed = scannerSession.doneFiles;
      if (step.ocrFile) {
        scannerSession.ocr.completed += 1;
        scannerSession.ocr.processing = Math.max(0, scannerSession.ocr.processing - 1);
      }
    }
    scannerSession.progress = scanSteps.length ? Math.round(scanIndex / scanSteps.length * 100) : 0;
    paintScanner();
  }
  if (token !== scanToken || scanStopped) return;
  scannerSession.status = "done";
  scannerSession.progress = 100;
  scannerSession.remaining = 0;
  scannerSession.resultBytes = JSON.stringify(scannerSession.rows).length;
  scannerSession.storageBytes = scannerSession.resultBytes;
  scannerSession.files = scannerSession.files.map((f) => ({ name: f.name, size: 0, source: f.source }));
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ rows: scannerSession.rows.length, bytes: scannerSession.resultBytes })); } catch (err) { /* cache is optional */ }
  clearInterval(scanTimer);
  paintScanner();
}
function displayCell(row, key) {
  if (key === "n") return String(row.order + 1);
  if (key === "statements") return row.fields.statements || "";
  const value = row.fields[key];
  if (value == null || value === "") return "";
  if (["revenue", "approval", "monthlyDeposits", "endingBalance", "mcaAmount", "dailyPayment"].includes(key)) return money(value);
  return joinList(value);
}
function sortedRows() {
  const rows = scannerSession.rows.slice();
  const num = (r, k) => Number(r.fields[k] || 0);
  if (scannerSession.sort === "revenue-desc") rows.sort((a, b) => num(b, "revenue") - num(a, "revenue"));
  else if (scannerSession.sort === "revenue-asc") rows.sort((a, b) => num(a, "revenue") - num(b, "revenue"));
  else if (scannerSession.sort === "balance-desc") rows.sort((a, b) => num(b, "endingBalance") - num(a, "endingBalance"));
  else if (scannerSession.sort === "deposits-desc") rows.sort((a, b) => num(b, "monthlyDeposits") - num(a, "monthlyDeposits"));
  else if (scannerSession.sort === "company") rows.sort((a, b) => String(a.fields.company || a.label).localeCompare(String(b.fields.company || b.label)));
  else rows.sort((a, b) => a.order - b.order);
  return rows;
}
function appendScanRow(row) {
  const body = $("#scanBody");
  if (!body) return;
  body.querySelectorAll(".blank-row").forEach((n) => n.remove());
  const tr = document.createElement("tr");
  tr.dataset.row = row.id;
  tr.innerHTML = SCAN_COLS.map((c) => `<td class="${c[3] === "cen" ? "cen" : ""} ${c[3] === "num" ? "num-detail" : ""}" data-k="${c[0]}"></td>`).join("");
  body.appendChild(tr);
}
function paintCell(row, key) {
  const tr = document.querySelector(`#scanBody tr[data-row="${row.id}"]`);
  if (!tr) return;
  const td = tr.querySelector(`[data-k="${key}"]`);
  if (td) td.textContent = displayCell(row, key);
}
function paintScanner() {
  if (!$("#scannerView") || $("#scannerView").classList.contains("hidden")) return;
  const s = scannerSession;
  const map = { files: s.stats.files, applications: s.stats.applications, statements: s.stats.statements, ocr: s.stats.ocr, completed: s.stats.completed, failed: s.stats.failed };
  Object.keys(map).forEach((k) => { const el = document.querySelector(`[data-stat="${k}"]`); if (el) el.textContent = statText(map[k]); });
  const store = document.querySelector("[data-stat='storage']");
  if (store) store.textContent = s.started || s.storageBytes ? formatBytes(s.storageBytes) : "—";
  const bar = $("#scanBar");
  if (bar) bar.style.width = (s.started ? s.progress : 0) + "%";
  const elap = $("#scanElapsed");
  if (elap) elap.textContent = s.started ? "Elapsed " + s.elapsed + "s" : "Elapsed —";
  const rem = $("#scanRemain");
  if (rem) rem.textContent = s.remaining == null ? "Remaining —" : "Remaining " + s.remaining + "s";
  const files = $("#scanFileCount");
  if (files) files.textContent = s.started ? s.doneFiles + " / " + s.totalFiles + " files" : "";
  const live = $("#scanLive");
  if (live) live.innerHTML = s.activity.slice(0, 6).map((a) => `<span class="live-item">${esc(a.label)}<em>${esc(a.phase)}</em></span>`).join("");
  const ocr = $("#scanOcr");
  if (ocr) ocr.textContent = s.started ? `OCR required ${s.ocr.required} · processing ${s.ocr.processing} · completed ${s.ocr.completed} · failed ${s.ocr.failed}` : "";
  const audit = $("#auditBody");
  if (audit) {
    audit.classList.toggle("open", s.auditOpen);
    const auditRows = $("#auditRows");
    if (auditRows) auditRows.innerHTML = (s.audit.length ? s.audit.map((a) => `<tr><td>${esc(a.kind)}</td><td>${esc(a.text)}</td></tr>`).join("") : Array.from({ length: 6 }, () => "<tr><td></td><td></td></tr>").join(""));
  }
  reorderRows();
}
function reorderRows() {
  const body = $("#scanBody");
  if (!body) return;
  const q = state.q.trim().toLowerCase();
  sortedRows().forEach((r) => {
    const tr = body.querySelector(`tr[data-row="${r.id}"]`);
    if (!tr) return;
    const text = Object.values(r.fields).join(" ").toLowerCase();
    tr.style.display = !q || text.includes(q) ? "" : "none";
    body.appendChild(tr);
  });
}
function formatBytes(n) {
  if (!n) return "0 KB";
  if (n < 1024) return n + " B";
  if (n < 1048576) return Math.max(1, Math.round(n / 1024)) + " KB";
  return (n / 1048576).toFixed(1) + " MB";
}

function renderScanner() {
  if (scannerMounted) { paintScanner(); return; }
  scannerMounted = true;
  $("#scannerView").innerHTML = `<div class="scan">
    <div class="scan-top">
      <div class="drop" id="dropZone"><strong>Drop ZIP or PDF files</strong><span>Click anywhere to browse. Multiple PDFs and ZIP archives.</span><div class="progress-line drop-bar"><div class="bar"><i id="scanBar"></i></div><span class="time-bit" id="scanElapsed">Elapsed —</span><span class="time-bit" id="scanRemain">Remaining —</span></div></div>
      <div class="panel">
        <div class="panel-h">Page limits</div>
        <div class="panel-b page-box">
          <div class="settings" style="margin-top:0">
            <label>Regular scan<input id="regularPages" type="number" min="1" value="${scannerSettings.regularPages}"></label>
            <label>OCR scan<input id="ocrPages" type="number" min="1" value="${scannerSettings.ocrPages}"></label>
            <button class="btn" id="saveSettings" type="button" style="height:30px;padding:0 10px;font-size:12px">Save</button>
          </div>
          <div class="scan-controls">
            <button class="btn solid" id="scanStart" type="button">Start Scan</button>
            <button class="btn" id="scanPause" type="button">Pause</button>
            <button class="btn" id="scanResume" type="button">Continue</button>
            <button class="btn" id="scanStop" type="button">Stop</button>
            <button class="btn" id="scanExport" type="button">Export XLSX</button>
            <button class="btn" id="scanClear" type="button">Clear Storage</button>
          </div>
        </div>
      </div>
    </div>
    <section class="panel" id="scanGridPanel">
      <div class="panel-h">Results <button class="btn" id="gridToggle" type="button" style="height:26px;padding:0 8px;font-size:11px">Close</button><select class="sort-sel" id="scanSort">
        <option value="original">Original scan order</option>
        <option value="revenue-desc">Revenue — high to low</option>
        <option value="revenue-asc">Revenue — low to high</option>
        <option value="balance-desc">Ending Balance — high to low</option>
        <option value="deposits-desc">Monthly Deposits — high to low</option>
        <option value="company">Company — A to Z</option>
      </select></div>
      <div class="grid-wrap" id="gridWrap"><table class="scan-table" id="scanTable"><thead><tr id="scanHead"></tr></thead><tbody id="scanBody"></tbody></table></div>
    </section>
    <section class="panel">
      <div class="panel-h">Scan audit <button class="btn" id="auditToggle" type="button" style="height:26px;padding:0 8px;font-size:11px;margin-left:auto">Hide</button></div>
      <div class="audit-body open" id="auditBody"><table class="scan-table audit-table"><thead><tr><th>Kind</th><th>Detail</th></tr></thead><tbody id="auditRows"></tbody></table></div>
    </section>
    <input class="hidden" id="scanFile" type="file" accept=".pdf,.zip,application/pdf,application/zip" multiple>
  </div>`;
  const head = $("#scanHead");
  head.innerHTML = SCAN_COLS.map((c) => `<th class="${c[3] === "cen" ? "cen" : ""}" style="width:${c[2]}px;min-width:${c[2]}px;position:sticky">${esc(c[1])}<span class="col-resizer" data-col="${c[0]}"></span></th>`).join("");
  const body = $("#scanBody");
  if (body && !scannerSession.rows.length) body.innerHTML = Array.from({ length: 16 }, () => `<tr class="blank-row">${SCAN_COLS.map((c) => `<td class="${c[3] === "cen" ? "cen" : ""}"></td>`).join("")}</tr>`).join("");
  const auditRows = $("#auditRows");
  if (auditRows && !scannerSession.audit.length) auditRows.innerHTML = Array.from({ length: 6 }, () => `<tr><td></td><td></td></tr>`).join("");
  scannerSession.rows.forEach(appendScanRow);
  scannerSession.rows.forEach((r) => SCAN_COLS.forEach((c) => paintCell(r, c[0])));
  paintScanner();
}
