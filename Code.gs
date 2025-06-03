
function doGet() {
  console.log("doGet called");
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Global variables to store header lines and XLSX content
var headerLinesCache = [];
var rawXLSXContent = "";  // Contains the raw XLSX file
var originalGoogleSheetId = null;  // To store the Google Sheet ID
var userDraft = null;   // To store the draft for a user

function handleXLSXUpload(fileBlob, fileName) {
  console.log("handleXLSXUpload called with file:", fileName);
  try {
    // Create temporary XLSX file in Drive
    var blob = Utilities.newBlob(
      Utilities.base64Decode(fileBlob), 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      fileName
    );
    
    var tempFile = DriveApp.createFile(blob);
    console.log("Temporary XLSX file created:", tempFile.getId());
    
    // Convert XLSX to Google Sheet
    var convertedFile = Drive.Files.copy({
      title: fileName.replace('.xlsx', '') + '_converted',
      mimeType: MimeType.GOOGLE_SHEETS
    }, tempFile.getId());
    
    console.log("Converted to Google Sheet:", convertedFile.id);
    
    // Store the Google Sheet ID
    originalGoogleSheetId = convertedFile.id;
    
    // Clean up temporary XLSX file
    tempFile.setTrashed(true);
    
    // Import data from the Google Sheet
    return importXLSX(convertedFile.id);
    
  } catch(e) {
    console.error("Error in handleXLSXUpload:", e.toString());
    return { 
      success: false, 
      message: "Erreur lors du traitement du fichier XLSX: " + e.toString() 
    };
  }
}

function importXLSX(sheetId) {
  console.log("importXLSX called with sheetId:", sheetId);
  try {
    var spreadsheet = SpreadsheetApp.openById(sheetId);
    var sheet = spreadsheet.getSheets()[0];
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    
    if (lastRow < 12) {
      throw new Error("Le fichier XLSX doit contenir au moins 12 lignes");
    }
    
    var data = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
    console.log("Nombre de lignes lues:", data.length);
    console.log("Première ligne:", data[0]);

    // Extract department (C5), projectCode (J5), and requesterEmail (J6)
    var department = data[4]?.[2] || "";      // Ligne 5, colonne 3 → C5
    var projectCode = data[4]?.[9] || "";     // Ligne 5, colonne 10 → J5
    var requesterEmail = data[5]?.[9] || "";  // Ligne 6, colonne 10 → J6
    
    console.log("Extracted department:", department);
    console.log("Extracted projectCode:", projectCode);
    console.log("Extracted requesterEmail:", requesterEmail);

    // Sauvegarder les 11 premières lignes
    headerLinesCache = data.slice(0, 11);
    
    // Compteurs pour les lignes valides et ignorées
    var validRows = 0;
    var skippedRows = 0;
    
    var processedData = data.slice(11).map(function(row, index) {
      console.log("Traitement ligne", index + 12, ":", row);
      
      if (row.length >= 14) {
        // Champs requis dans une ligne
        if (!row[3] || !row[6] || !row[7] || !row[8] || !row[9] || !row[10] || !row[11] || !row[12] || !row[13]) {
          console.log("Ligne ignorée car un champ est vide :", row);
          skippedRows++;
          return null; // Ligne ignorée si un champ est manquant
        }
        
        // Amélioration du parsing des IPs pour gérer virgules ET retours à la ligne
        var sourceIPs = (row[3] || '')
          .toString()
          .split(/[\n,]+/)
          .map(ip => ip.trim())
          .filter(ip => ip);
          
        var destIPs = (row[6] || '')
          .toString()
          .split(/[\n,]+/)
          .map(ip => ip.trim())
          .filter(ip => ip);
          
        var combinations = [];

        if (sourceIPs.length === 0) sourceIPs = [''];
        if (destIPs.length === 0) destIPs = [''];

        sourceIPs.forEach(function(srcIP) {
          destIPs.forEach(function(dstIP) {
            combinations.push({
              sourceIP: srcIP,
              destIP: dstIP,
              protocol: (row[7] || 'TCP').toString(),
              service: (row[8] || '').toString(),
              port: (row[9] || '').toString(),
              authentication: (row[10] || '').toString().toLowerCase() === 'yes' ? 'Yes' : 'No',
              flowEncryption: (row[11] || '').toString().toLowerCase() === 'yes' ? 'Yes' : 'No',
              classification: (row[12] || '').toString().toLowerCase() === 'yellow' ? 'Yellow' : 
                            (row[12] || '').toString().toLowerCase() === 'amber' ? 'Amber' : 
                            (row[12] || '').toString().toLowerCase() === 'red' ? 'Red' : 'Yellow',
              appCode: (row[13] || '').toString()
            });
          });
        });

        console.log("Nombre de combinaisons générées:", combinations.length);
        validRows += combinations.length;
        return combinations;
      }
      console.log("Ligne ignorée - pas assez de colonnes");
      skippedRows++;
      return null;
    }).filter(function(row) {
      return row !== null;
    });

    // Aplatir toutes les combinaisons
    var allProcessedRows = processedData.flat();
    console.log("Nombre total de lignes après aplatissement:", allProcessedRows.length);
    
    if (allProcessedRows.length === 0) {
      throw new Error("Aucune donnée valide trouvée dans le fichier XLSX");
    }

    return { 
      success: true, 
      data: allProcessedRows,
      headerLines: headerLinesCache,
      message: validRows + " lignes valides importées, " + skippedRows + " lignes ignorées (champs manquants)",
      department: department,
      projectCode: projectCode,
      requesterEmail: requesterEmail
    };
  } catch(e) {
    console.error("Erreur lors de l'import XLSX:", e.toString());
    return { 
      success: false, 
      message: "Erreur lors de l'import XLSX: " + e.toString() 
    };
  }
}

// Function to export XLSX with header lines and modified data
function exportXLSX(modifiedLines) {
  try {
    if (!originalGoogleSheetId) {
      throw new Error("Aucun Google Sheet source disponible");
    }
    
    var spreadsheet = SpreadsheetApp.openById(originalGoogleSheetId);
    var sheet = spreadsheet.getSheets()[0];
    
    // Clear existing data from row 12 onwards
    var lastRow = sheet.getLastRow();
    if (lastRow > 11) {
      sheet.deleteRows(12, lastRow - 11);
    }
    
    // Add new data
    var newData = [];
    modifiedLines.forEach(rule => {
      // Handle multiple IPs by splitting and creating separate rows for each combination
      const sourceIPs = rule.sourceIP.split('\n').filter(ip => ip.trim());
      const destIPs = rule.destIP.split('\n').filter(ip => ip.trim());
      
      sourceIPs.forEach(srcIP => {
        destIPs.forEach(dstIP => {
          newData.push([
            '', '', '', srcIP.trim(), '', '', dstIP.trim(), rule.protocol,
            rule.service, rule.port, rule.authentication, rule.flowEncryption,
            rule.classification, rule.appCode
          ]);
        });
      });
    });
    
    if (newData.length > 0) {
      sheet.getRange(12, 1, newData.length, 14).setValues(newData);
    }
    
    // Export as XLSX while preserving formats and colors
    var xlsxBlob = spreadsheet.getAs('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    console.log("XLSX exporté avec succès");
    return xlsxBlob;
  } catch (e) {
    console.error('Erreur exportXLSX:', e.toString());
    throw new Error('Erreur lors de la génération XLSX: ' + e.toString());
  }
}

// Function to generate scripts for network rules
function generateScripts(options) {
  try {
    console.log("generateScripts called with options:", JSON.stringify(options));
    
    const csvRows = options.csvRows || [];
    if (csvRows.length === 0) {
      return {
        success: false,
        message: "Aucune donnée à traiter"
      };
    }
    
    const scripts = [];
    
    csvRows.forEach((row, index) => {
      // Handle multiple IPs in source and destination
      const sourceIPs = row.sourceIP.split('\n').filter(ip => ip.trim());
      const destIPs = row.destIP.split('\n').filter(ip => ip.trim());
      
      sourceIPs.forEach(srcIP => {
        destIPs.forEach(dstIP => {
          scripts.push(`curl -k -X POST "https://<TUFIN_SERVER>/securetrack/api/path-analysis" \\
  -H "Authorization: Bearer <TON_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": {
      "ip": "${srcIP.trim().split('/')[0]}"
    },
    "destination": {
      "ip": "${dstIP.trim()}"
    },
    "service": {
      "protocol": "${row.protocol.toUpperCase()}",
      "port": ${row.port}
    }
  }'`);
        });
      });
    });
    
    return {
      success: true,
      data: scripts,
      message: scripts.length + " script(s) généré(s) avec succès"
    };
  } catch (e) {
    console.error("Erreur generateScripts:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la génération des scripts: " + e.toString()
    };
  }
}

// Function to delete the form data
function deleteForm() {
  try {
    console.log("deleteForm called");
    headerLinesCache = [];
    rawXLSXContent = "";
    originalGoogleSheetId = null;
    userDraft = null;
    
    return {
      success: true,
      message: "Formulaire supprimé avec succès"
    };
  } catch (e) {
    console.error("Erreur deleteForm:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la suppression: " + e.toString()
    };
  }
}

// Function to save the Network Equipment Sheet - VERSION XLSX
function saveNES(formData) {
  try {
    console.log("saveNES called with data:", JSON.stringify(formData));

    // Vérification des champs obligatoires
    if (!formData.department || !formData.projectCode || !formData.email || !formData.rules || formData.rules.length === 0) {
      return {
        success: false,
        message: "Données incomplètes"
      };
    }

    if (!originalGoogleSheetId) {
      // Si pas de Google Sheet existant, créer un nouveau document
      var spreadsheet = SpreadsheetApp.create('NES_' + formData.projectCode + '_' + new Date().getTime());
      originalGoogleSheetId = spreadsheet.getId();
      var sheet = spreadsheet.getSheets()[0];
      
      // Ajouter les en-têtes basiques si pas de headerLinesCache
      if (headerLinesCache.length === 0) {
        var basicHeaders = [
          ['', '', '', 'Source IP', '', '', 'Destination IP', 'Protocol', 'Service', 'Port', 'Authentication', 'Flow Encryption', 'Classification', 'APP Code'],
          // Add more basic header rows as needed
        ];
        headerLinesCache = basicHeaders;
      }
      
      // Écrire les en-têtes
      sheet.getRange(1, 1, headerLinesCache.length, 14).setValues(headerLinesCache);
    } else {
      var spreadsheet = SpreadsheetApp.openById(originalGoogleSheetId);
      var sheet = spreadsheet.getSheets()[0];
    }

    // Clear existing data from row 12 onwards
    var lastRow = sheet.getLastRow();
    if (lastRow > 11) {
      sheet.deleteRows(12, lastRow - 11);
    }

    // Pour chaque règle, on prépare une ligne au format correct
    var newData = [];
    formData.rules.forEach(rule => {
      const sourceIPs = (rule.sourceIP || '')
        .split(/[\n,]+/)
        .map(ip => ip.trim())
        .filter(ip => ip)
        .join(',');

      const destIPs = (rule.destIP || '')
        .split(/[\n,]+/)
        .map(ip => ip.trim())
        .filter(ip => ip)
        .join(',');

      newData.push([
        '', '', '', sourceIPs, '', '', destIPs,
        rule.protocol,
        rule.service,
        rule.port,
        rule.authentication,
        rule.flowEncryption,
        rule.classification,
        rule.appCode
      ]);
    });

    // Écrire les nouvelles données
    if (newData.length > 0) {
      sheet.getRange(12, 1, newData.length, 14).setValues(newData);
    }

    // On sauvegarde aussi le draft (utile pour recharger)
    userDraft = formData;

    console.log("Google Sheet mis à jour avec succès");
    console.log("Nombre total de lignes :", newData.length + 11);

    return {
      success: true,
      message: "NES sauvegardé avec succès dans Google Sheet"
    };
  } catch (e) {
    console.error("Erreur saveNES:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la sauvegarde du NES: " + e.toString()
    };
  }
}

// Legacy function kept for compatibility - redirects to XLSX
function handleFileSelect(fileData) {
  console.log("handleFileSelect called - redirecting to XLSX handling");
  return {
    success: false,
    message: "Veuillez utiliser l'import XLSX uniquement"
  };
}

// Legacy function kept for compatibility - redirects to XLSX
function importCSV(csvData) {
  console.log("importCSV called - redirecting to XLSX handling");
  return {
    success: false,
    message: "L'import CSV n'est plus supporté. Veuillez utiliser XLSX."
  };
}

// Legacy function kept for compatibility - redirects to XLSX
function exportCSV(modifiedLines) {
  console.log("exportCSV called - redirecting to XLSX export");
  return exportXLSX(modifiedLines);
}
