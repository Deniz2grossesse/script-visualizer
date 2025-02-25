
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
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var lastRow = sheet.getLastRow();
    var newRow = lastRow + 1;
    
    sheet.getRange(newRow, 1).setValue(newRow);  // ID
    sheet.getRange(newRow, 2).setValue(data.department);
    sheet.getRange(newRow, 3).setValue(data.projectCode);
    sheet.getRange(newRow, 4).setValue(data.email);
    sheet.getRange(newRow, 5).setValue(data.script);
    
    return {success: true, message: "Sauvegardé avec succès", rowId: newRow};
  } catch(e) {
    return {success: false, message: "Erreur: " + e.toString()};
  }
}

function getDraftRules() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Drafts");
    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    return {success: true, data: data};
  } catch(e) {
    return {success: false, message: "Erreur: " + e.toString()};
  }
}

function saveDraft(rules) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Drafts");
    if (!sheet) {
      sheet = ss.insertSheet("Drafts");
      // Ajouter les en-têtes
      sheet.getRange(1, 1, 1, 9).setValues([["Department", "ProjectCode", "Email", "SourceIP", "DestIP", "Protocol", "Service", "Port", "AppCode"]]);
    }
    
    // Sauvegarder les règles
    var rowData = rules.map(rule => [
      rule.department,
      rule.projectCode,
      rule.email,
      rule.sourceIP,
      rule.destIP,
      rule.protocol,
      rule.service,
      rule.port,
      rule.appCode
    ]);
    
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rowData.length, 9).setValues(rowData);
    
    return {success: true, message: "Brouillon sauvegardé"};
  } catch(e) {
    return {success: false, message: "Erreur: " + e.toString()};
  }
}

function importCSV(csvData) {
  try {
    var data = Utilities.parseCsv(csvData);
    // Vérifier le format des données
    if (data[0].length < 9) {
      throw new Error("Format CSV invalide");
    }
    
    // Traiter les données
    var rules = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      rules.push({
        department: row[0],
        projectCode: row[1],
        email: row[2],
        sourceIP: row[3],
        destIP: row[4],
        protocol: row[5],
        service: row[6],
        port: row[7],
        appCode: row[8]
      });
    }
    
    return {success: true, rules: rules};
  } catch(e) {
    return {success: false, message: "Erreur: " + e.toString()};
  }
}

function verifyRules(rules) {
  var results = rules.map(function(rule, index) {
    var errors = [];
    
    // Vérifier IP source
    if (!validateIP(rule.sourceIP)) {
      errors.push("IP source invalide");
    }
    
    // Vérifier IP destination
    if (!validateIP(rule.destIP)) {
      errors.push("IP destination invalide");
    }
    
    // Vérifier port
    if (rule.port < 1 || rule.port > 65535) {
      errors.push("Port invalide (doit être entre 1 et 65535)");
    }
    
    return {
      ruleIndex: index,
      isValid: errors.length === 0,
      errors: errors
    };
  });
  
  return results;
}

function validateIP(ip) {
  var parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  for (var i = 0; i < parts.length; i++) {
    var num = parseInt(parts[i]);
    if (isNaN(num) || num < 0 || num > 255) return false;
  }
  
  return true;
}
