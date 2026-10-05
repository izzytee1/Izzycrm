const emailTemplates = {
  intro: { name: "Initial Outreach", body: "Hi {{first}}, this is {{rep}} at Forge. We reviewed {{company}} and can share funding options." },
  follow: { name: "Application Follow-up", body: "Hi {{first}}, checking on the {{company}} application. Reply here or call {{repPhone}}." },
  docs: { name: "Document Request", body: "{{first}}, we still need the latest statements for {{company}}. Send them to {{repEmail}}." },
  approval: { name: "Approval Follow-up", body: "Hi {{first}}, the {{company}} approval is ready. {{rep}} can walk it today." }
};
const smsTemplates = {
  intro: { name: "Initial Introduction", body: "Hi {{first}}, {{rep}} at Forge. Quick note on funding for {{company}}." },
  follow: { name: "Follow-up", body: "{{first}}, following up on {{company}}. Call {{repPhone}} when free." },
  docs: { name: "Document Reminder", body: "{{first}}, still need statements for {{company}}." },
  callback: { name: "Callback Request", body: "{{first}}, {{rep}} tried you about {{company}}. Call {{repPhone}}." }
};
const emailSenders = ["cole@forgecapital.com", "sam@forgecapital.com", "deals@forgecapital.com"];
const smsPhones = ["(917) 555-0101", "(917) 555-0108", "(646) 555-0144"];
const campaignReps = activityReps.slice();
const extraAudience = [
  { id: "jx", company: "Juniper Studio", contact: "June Park", rep: "Jordan Hale", email: "june@juniperstudio.com", mobile: "(718) 555-0199", state: "NY", city: "Brooklyn", status: "New", revenue: 72000, whatsapp: true, contacted: false },
  { id: "ax", company: "Alden Print", contact: "Alex Rivera", rep: "Alex Nguyen", email: "alex@aldenprint.com", mobile: "(201) 555-0166", state: "NJ", city: "Hoboken", status: "Attempted", revenue: 99000, whatsapp: false, contacted: true }
];
const campaignHistory = [
  { name: "NY Follow-up", channel: "SMS", by: "Cole Brennan", date: "Thu", recipients: 18, sent: 18, replies: 4, status: "Completed" },
  { name: "Sam Re-engagement", channel: "Email", by: "Sam Ortiz", date: "Wed", recipients: 12, sent: 11, replies: 2, status: "Completed" },
  { name: "Application Reminder", channel: "Email", by: "Jordan Hale", date: "Tue", recipients: 9, sent: 6, replies: 1, status: "Stopped" }
];
const campaign = {
  email: blankSide("email", "October New Leads"),
  sms: blankSide("sms", "NY Follow-up")
};
function blankSide(channel, name) {
  return { name, reps: campaignReps.slice(), status: "all", state: "all", city: "", revenue: 0, hasDest: true, contacted: "all", template: "intro", senders: channel === "email" ? [emailSenders[0]] : [smsPhones[0]], mode: "individual", channel: channel === "email" ? "Email" : "SMS", delay: 2, batch: 10, when: "now", date: "", time: "", run: "draft", queue: [], index: 0, sent: 0, delivered: 0, opened: 0, replies: 0, failed: 0, unsub: 0, elapsed: 0, feed: [], timer: 0, adv: false };
}
