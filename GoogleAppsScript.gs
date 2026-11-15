
const SHEET_NAME = "Messages";

const HEADERS = [
  "Timestamp",
  "Name",
  "Email",
  "Subject",
  "Message"
];

// GET CONFIGURATION
function getConfig_() {
  const props = PropertiesService.getScriptProperties();

  const spreadsheetId = props.getProperty("SPREADSHEET_ID");
  const adminPassword = props.getProperty("ADMIN_PASSWORD");

  if (!spreadsheetId || !adminPassword) {
    throw new Error("Configure SPREADSHEET_ID and ADMIN_PASSWORD.");
  }

  return { spreadsheetId, adminPassword };
}

// GET OR CREATE SHEET
function getSheet_() {
  const config = getConfig_();

  const spreadsheet =
    SpreadsheetApp.openById(config.spreadsheetId);

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// RUN THIS FUNCTION ONCE
function setupSheet() {
  const sheet = getSheet_();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  sheet.setFrozenRows(1);

  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold");

  return "Google Sheet is ready!";
}

// RECEIVE CONTACT FORM DATA
function doPost(e) {
  try {

    const data = JSON.parse(
      e.postData.contents || "{}"
    );

    if (data.action !== "submit") {
      return json_({
        ok: false,
        error: "Unknown action."
      });
    }

    const name = clean_(data.name, 80);
    const email = clean_(data.email, 120);
    const subject = clean_(data.subject, 120);
    const message = clean_(data.message, 2000);

    if (!name || !email || !subject || !message) {
      return json_({
        ok: false,
        error: "Please complete all fields."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json_({
        ok: false,
        error: "Invalid email address."
      });
    }

    const sheet = getSheet_();

    sheet.appendRow([
      new Date(),
      sheetText_(name),
      sheetText_(email),
      sheetText_(subject),
      sheetText_(message)
    ]);

    return json_({
      ok: true,
      message: "Message saved successfully."
    });

  } catch (error) {

    return json_({
      ok: false,
      error: error.message
    });
  }
}

// ADMIN LOGIN AND RESPONSE RETRIEVAL
function doGet(e) {

  const params = e.parameter || {};
  const callback = String(params.callback || "");

  let result;

  try {

    const config = getConfig_();

    if (
      params.action !== "admin" &&
      params.action !== "responses"
    ) {
      throw new Error("Unknown action.");
    }

    if (!safeEquals_(
      String(params.password || ""),
      config.adminPassword
    )) {
      throw new Error("Incorrect admin password.");
    }

    if (params.action === "admin") {

      result = { ok: true };

    } else {

      const sheet = getSheet_();
      const rows = sheet.getDataRange().getValues();

      const responses = rows.slice(1)
        .filter(row => row.length >= 5)
        .map(row => ({
          timestamp: row[0] instanceof Date
            ? Utilities.formatDate(
                row[0],
                Session.getScriptTimeZone(),
                "dd MMM yyyy, hh:mm a"
              )
            : String(row[0] || ""),

          name: String(row[1] || ""),
          email: String(row[2] || ""),
          subject: String(row[3] || ""),
          message: String(row[4] || "")
        }));

      result = {
        ok: true,
        responses: responses
      };
    }

  } catch (error) {

    result = {
      ok: false,
      error: error.message
    };
  }

  // JSONP RESPONSE FOR BROWSER ADMIN DASHBOARD
  if (
    callback &&
    /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)
  ) {
    return ContentService
      .createTextOutput(
        callback + "(" + JSON.stringify(result) + ");"
      )
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return json_(result);
}

// CLEAN USER INPUT
function clean_(value, maxLength) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

// Keep visitor text from being evaluated as a spreadsheet formula.
function sheetText_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

// PASSWORD COMPARISON
function safeEquals_(a, b) {

  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// JSON RESPONSE
function json_(value) {

  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
