/**
 * Receive LeadPilot leads in a Google Sheet.
 *
 * 1. Create a Google Sheet, then Extensions > Apps Script, and paste this file.
 * 2. Change TOKEN below to a long random string.
 * 3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 * 4. Set LeadPilot's WEBHOOK_URL to the web app URL plus ?token=<your TOKEN>.
 *
 * Apps Script can't read request headers, so it can't check X-LeadPilot-Signature.
 * The token in the URL plays that role instead: keep the URL private.
 */
const TOKEN = "change-me-to-a-long-random-string";

const COLUMNS = [
  "created_at", "score", "name", "email", "company", "category", "urgency",
  "language", "budget_estimate", "summary", "suggested_reply", "next_action", "engine",
];

function doPost(e) {
  if (e.parameter.token !== TOKEN) {
    return ContentService.createTextOutput("forbidden");
  }
  const payload = JSON.parse(e.postData.contents);
  if (payload.event !== "lead.created") {
    return ContentService.createTextOutput("ignored");
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
  }
  const lead = payload.lead;
  sheet.appendRow(COLUMNS.map((key) => lead[key] ?? ""));
  return ContentService.createTextOutput("ok");
}
