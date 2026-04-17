// ============================================================
//  NOERWY AQUA FARM — Document Approval Backend (CORRECTED)
//  Google Apps Script
//  
//  SETUP CHECKLIST:
//  1. Fill in the 4 constants below
//  2. Deploy → New deployment → Web app → Anyone
//  3. Copy the deployment URL into your HTML file
// ============================================================

const SHEET_ID       = '1Nyurv3GTK28uRghmMh6WpEK8uWbqmjlmN9PoqkzAciM';
const FONNTE_TOKEN   = 'LF4fV1VLN25q7a4zviHct';
const APP_URL        = 'https://naf-doc-approval.vercel.app';
const DRIVE_FOLDER   = '1emqluWBGTp6HezvTde2exWhW-bsJxKNJ';


// ============================================================
//  ROUTER
// ============================================================

function doGet(e) {
  var action = e.parameter.action;
  var result;
  try {
    if (action === 'loadDocuments') result = loadDocuments();
    else result = { error: 'Unknown action: ' + action };
  } catch(err) {
    result = { error: err.message };
  }
  return respond(result);
}

function doOptions(e) {
  return respond({});
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {
    return respond({ error: 'Invalid JSON' });
  }

  var result;
  try {
    if      (data.action === 'submitDocument') result = submitDocument(data);
    else if (data.action === 'decide')         result = decide(data);
    else if (data.action === 'sendReminder')   result = sendReminder(data);
    else if (data.action === 'uploadFile')     result = uploadFile(data);
    else if (data.action === 'getUploadToken') result = getUploadToken(data);
    else if (data.action === 'finalizeUpload') result = finalizeUpload(data);
    else result = { error: 'Unknown action: ' + data.action };
  } catch(err) {
    result = { error: err.message };
  }
  return respond(result);
}

function respond(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function loadDocuments() {
  var sheet = getSheet();
  var rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  rows.shift();
  return rows
    .filter(function(r) { return r[0] !== ''; })
    .map(rowToDoc)
    .reverse();
}

function submitDocument(data) {
  var sheet = getSheet();
  var id    = 'doc-' + Date.now();
  var now   = formatDate(new Date());
  var hasA2 = data.a2 && data.a2.name;
  
  sheet.appendRow([
    id, data.title, data.type || 'general', now, data.desc || '', data.driveId || '',
    data.a1.name, normalizeWA(data.a1.wa), 'pending', '',
    hasA2 ? data.a2.name : '', hasA2 ? normalizeWA(data.a2.wa) : '', hasA2 ? 'pending' : 'n/a', '',
    new Date().toISOString()
  ]);

  sendApprovalRequest(data.a1.wa, data.a1.name, data.title, id, 'a1');
  if (hasA2) sendApprovalRequest(data.a2.wa, data.a2.name, data.title, id, 'a2');

  return { success: true, id: id };
}

function decide(data) {
  var sheet = getSheet();
  var rows  = sheet.getDataRange().getValues();
  // Using data.decision instead of data.action to avoid conflicts
  var decision = data.decision; 

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] !== data.docId) continue;
    var row = rows[i];
    var statusCol  = data.approverKey === 'a1' ? 9  : 13;
    var commentCol = data.approverKey === 'a1' ? 10 : 14;

    sheet.getRange(i + 1, statusCol).setValue(decision);
    sheet.getRange(i + 1, commentCol).setValue(data.comment || '');

    var decidedByName = data.approverKey === 'a1' ? row[6]  : row[10];
    var otherWA       = data.approverKey === 'a1' ? row[11] : row[7];
    var otherKey      = data.approverKey === 'a1' ? 'a2' : 'a1';

    var actionWord = decision === 'approved' ? 'menyetujui ✅' : 'menolak ❌';
    var msg = '📋 *Update Persetujuan Dokumen*\n\n'
            + decidedByName + ' telah ' + actionWord + ' dokumen: *' + row[1] + '*';
    if (data.comment) msg += '\n\nKomentar: _"' + data.comment + '"_';
    msg += '\n\nBuka: ' + buildLink(row[0], otherKey);

    sendWA(otherWA, msg);
    return { success: true };
  }
  return { success: false, error: 'Not found' };
}

function sendApprovalRequest(waNumber, name, docTitle, docId, approverKey) {
  var link = buildLink(docId, approverKey);
  var msg  = '📋 *Permintaan Persetujuan*\nHalo *' + name + '*,\n📄 *' + docTitle + '*\n\nLink: ' + link;
  sendWA(waNumber, msg);
}

function sendWA(waNumber, message) {
  var url = 'https://api.fonnte.com/send';
  var payload = { target: normalizeWA(waNumber), message: message };
  UrlFetchApp.fetch(url, { method: 'post', headers: { 'Authorization': FONNTE_TOKEN }, payload: payload });
}

function sendReminder(data) {
  var sheet = getSheet();
  var rows  = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] !== data.docId) continue;
    var row = rows[i];
    
    // Send to whichever is still pending
    if (row[8] === 'pending') {
      sendApprovalRequest(row[7], row[6], row[1], row[0], 'a1');
    }
    if (row[12] === 'pending') {
      sendApprovalRequest(row[11], row[10], row[1], row[0], 'a2');
    }
    return { success: true };
  }
  return { success: false, error: 'Document not found' };
}

function getUploadToken(data) {
  return {
    token: ScriptApp.getOAuthToken(),
    folderId: DRIVE_FOLDER
  };
}

function finalizeUpload(data) {
  var file = DriveApp.getFileById(data.fileId);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { success: true, driveId: data.fileId, filename: data.filename };
}

function uploadFile(data) {
  var folder = DriveApp.getFolderById(DRIVE_FOLDER);
  var blob = Utilities.newBlob(Utilities.base64Decode(data.base64), data.mimeType, data.filename);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { success: true, driveId: file.getId(), filename: data.filename };
}

function getSheet() { 
  var ss;
  try {
    ss = SpreadsheetApp.openById(SHEET_ID);
  } catch(e) {
    throw new Error('Spreadsheet ID invalid or not accessible.');
  }
  var sheet = ss.getSheetByName('Documents'); 
  if (!sheet) {
    sheet = ss.insertSheet('Documents');
    sheet.appendRow(['ID', 'Title', 'Type', 'Date', 'Description', 'DriveID', 'A1 Name', 'A1 WA', 'A1 Status', 'A1 Comment', 'A2 Name', 'A2 WA', 'A2 Status', 'A2 Comment', 'CreatedISO']);
  }
  return sheet;
}
function rowToDoc(r) { return { id: r[0], title: r[1], type: r[2], date: r[3], desc: r[4], driveId: r[5], a1: { name: r[6], wa: r[7], status: r[8], comment: r[9] }, a2: { name: r[10], wa: r[11], status: r[12], comment: r[13] } }; }
function buildLink(docId, approverKey) { return APP_URL + '?doc=' + docId + '&approver=' + approverKey; }
function normalizeWA(n) { n = String(n).replace(/[\s\-\+]/g, ''); if (n.charAt(0) === '0') n = '62' + n.slice(1); return n; }
function formatDate(d) { return d.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }); }
