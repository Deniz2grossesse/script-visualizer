
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Network Rules Generator')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function generateScript(formObject) {
  var scriptTemplate = `curl -k -X POST "https://<TUFIN_SERVER>/securetrack/api/path-analysis" \\
-H "Authorization: Bearer <YOUR_TOKEN>" \\
-H "Content-Type: application/json" \\
-d '{
  "source": {
    "ip": "${formObject.sourceIP}"
  },
  "destination": {
    "ip": "${formObject.destIP}"
  },
  "service": {
    "protocol": "${formObject.protocol.toUpperCase()}",
    "port": ${formObject.port},
    "name": "${formObject.service}"
  },
  "authentication": "${formObject.authentication}",
  "encryption": "${formObject.encryption}",
  "classification": "${formObject.classification}",
  "appCode": "${formObject.appCode}"
}'`;

  return scriptTemplate;
}

function saveToSheet(data) {
  var ss = SpreadsheetSheet.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var newRow = lastRow + 1;
  
  // Sauvegarde dans la feuille de calcul
  sheet.getRange(newRow, 1).setValue(newRow);  // ID
  sheet.getRange(newRow, 2).setValue(data.department); // Department
  sheet.getRange(newRow, 3).setValue(data.projectCode); // Project Code
  sheet.getRange(newRow, 4).setValue(data.email); // Email
  sheet.getRange(newRow, 5).setValue(data.script); // Script généré
  
  return {success: true, message: "Sauvegardé avec succès", rowId: newRow};
}
