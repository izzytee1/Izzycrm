const SCAN_COLS = [
  ["n", "#", 42, "cen"],
  ["company", "Company", 168],
  ["dba", "DBA", 110],
  ["address", "Address", 188],
  ["city", "City", 100],
  ["state", "State", 56],
  ["zip", "Zip", 68],
  ["phone", "Phone", 128],
  ["mobile", "Mobile", 128],
  ["email", "Email", 188],
  ["owners", "Owner(s)", 140],
  ["ssn", "SSN", 108],
  ["ein", "EIN", 100],
  ["startDate", "Start Date", 92],
  ["appDate", "App Date", 92],
  ["bank", "Bank", 130],
  ["account", "Account #", 118],
  ["routing", "Routing #", 100],
  ["revenue", "Revenue", 100, "num"],
  ["approval", "Approval", 100, "num"],
  ["monthlyDeposits", "Monthly Deposits", 128, "num"],
  ["endingBalance", "Ending Balance", 120, "num"],
  ["mcaAmount", "MCA Amount", 110, "num"],
  ["dailyPayment", "Daily Payment", 110, "num"],
  ["months", "Months", 64, "num"],
  ["statements", "Statements", 132],
  ["notes", "Notes", 180]
];

const MOCK_SCANNER_FIXTURES = {
  northstar: {
    company: "Northstar Catering Co.", dba: "Northstar", address: "412 W 37th St", city: "New York", state: "NY", zip: "10018",
    phone: ["(212) 555-0188", "(212) 555-0160"], mobile: ["(917) 555-0142"], email: ["elena@northstarcatering.com", "ops@northstarcatering.com"],
    owners: ["Elena Voss"], ssn: "123-45-4412", ein: "82-4419441", startDate: "2019", appDate: "2026-09-12",
    bank: "Chase", account: "441944190812", routing: "021000021", revenue: 186420, approval: 125000,
    monthlyDeposits: 186420, endingBalance: 41280, mcaAmount: 88000, dailyPayment: 312, months: 9, statements: ["JAN", "FEB", "MAR"]
  },
  harborline: {
    company: "Harborline Logistics", dba: "Harborline", address: "88 Ferry St", city: "Newark", state: "NJ", zip: "07105",
    phone: ["(973) 555-0144"], mobile: ["(862) 555-0190"], email: ["marcus@harborlinelogistics.com"],
    owners: ["Marcus Chen", "Lina Chen"], ssn: "145-28-2281", ein: "22-1902190", startDate: "2016", appDate: "2026-09-18",
    bank: "Bank of America", account: "902144018833", routing: "021200339", revenue: 142000, approval: 90000,
    monthlyDeposits: 138400, endingBalance: 22110, mcaAmount: 0, dailyPayment: 0, months: 8, statements: ["JAN", "FEB"]
  },
  brightwell: {
    company: "Brightwell Dental Group", dba: "Brightwell Dental", address: "14 Maple Ave", city: "White Plains", state: "NY", zip: "10601",
    phone: ["(914) 555-0177"], mobile: ["(914) 555-0104"], email: ["priya@brightwelldental.com"],
    owners: ["Dr. Priya Shah"], ssn: "062-77-7730", ein: "13-1760440", startDate: "2014", appDate: "2026-09-02",
    bank: "Citibank", account: "176044019204", routing: "021000089", revenue: 221000, approval: 160000,
    monthlyDeposits: 214800, endingBalance: 60340, mcaAmount: 45000, dailyPayment: 210, months: 11, statements: ["JAN", "FEB", "MAR"]
  },
  lumen: {
    company: "Lumen & Co. Interiors", dba: "Lumen", address: "220 Franklin St", city: "Brooklyn", state: "NY", zip: "11222",
    phone: ["(718) 555-0166"], mobile: [], email: ["sable@lumeninteriors.com"],
    owners: ["Sable Whitaker"], ssn: "134-65-6504", ein: "46-2011448", startDate: "2021", appDate: "2026-09-28",
    bank: "TD Bank", account: "201144880315", routing: "026013673", revenue: 84000, approval: 40000,
    monthlyDeposits: 79200, endingBalance: 9800, mcaAmount: 0, dailyPayment: 0, months: 4, statements: ["FEB", "MAR"], ocr: true
  }
};

