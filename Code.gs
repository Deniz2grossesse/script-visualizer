
function doGet() {
  console.log("doGet called");
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Global variables to store header lines and raw XLSX content
var headerLinesCache = [];
var userDraft = null;   // To store the draft for a user

function handleXLSXFileSelect(fileBlob, fileName) {
  console.log("handleXLSXFileSelect called with file:", fileName);
  if (!fileBlob) {
    return { 
      success: false, 
      message: "Aucun fichier sélectionné" 
    };
  }
  
  return importXLSX(fileBlob, fileName);
}

function importXLSX(fileBlob, fileName) {
  console.log("importXLSX called with file:", fileName);
  try {
    console.log("Début de l'import XLSX");
    
    // Validation format .xlsx uniquement
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      return { 
        success: false, 
        message: "❌ ERREUR: Seuls les fichiers .xlsx sont acceptés." 
      };
    }

    // Créer un fichier temporaire dans Drive
    const tempFile = DriveApp.createFile(fileBlob);
    const tempFileId = tempFile.getId();
    
    console.log("Fichier temporaire créé:", tempFileId);
    
    // Convertir en Google Sheets pour lecture
    const convertedFile = Drive.Files.insert({
      title: 'temp_xlsx_' + new Date().getTime(),
      mimeType: 'application/vnd.google-apps.spreadsheet'
    }, fileBlob);
    
    const spreadsheetId = convertedFile.id;
    console.log("✅ Conversion réussie - ID Spreadsheet:", spreadsheetId);
    
    // Ouvrir et lire les données
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheets()[0];
    
    if (!sheet) {
      throw new Error("Aucune feuille trouvée dans le fichier XLSX");
    }
    
    const data = sheet.getDataRange().getValues();
    console.log("Nombre total de lignes extraites:", data.length);

    if (data.length < 12) {
      throw new Error("Le fichier XLSX doit contenir au moins 12 lignes");
    }

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
    
    // Traitement TOUTES les lignes après la ligne 11 (pas d'arrêt)
    var processedData = [];
    
    for (let i = 11; i < data.length; i++) {
      const row = data[i];
      console.log("Traitement ligne", i + 1, ":", row);
      
      // Vérifie si A à L sont vides ou espaces
      const isEmpty = row.slice(0, 12).every(cell => !cell || cell.toString().trim() === '');
      
      if (isEmpty) {
        console.log("Ligne ignorée (colonnes A-L vides) :", row);
        skippedRows++;
        // Continue à traiter les lignes suivantes (pas de break)
        continue;
      }
      
      if (row.length >= 14) {
        // Champs requis dans une ligne
        if (!row[3] || !row[6] || !row[7] || !row[8] || !row[9] || !row[10] || !row[11] || !row[12] || !row[13]) {
          console.log("Ligne ignorée car un champ est vide :", row);
          skippedRows++;
          continue; // Continue au lieu de return null
        }
        
        // Amélioration du parsing des IPs pour gérer virgules ET retours à la ligne
        var sourceIPs = (row[3] || '')
          .split(/[\n,]+/)
          .map(ip => ip.trim())
          .filter(ip => ip);
          
        var destIPs = (row[6] || '')
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
              protocol: row[7] || 'TCP',
              service: row[8] || '',
              port: row[9] || '',
              authentication: row[10]?.toLowerCase() === 'yes' ? 'Yes' : 'No',
              flowEncryption: row[11]?.toLowerCase() === 'yes' ? 'Yes' : 'No',
              classification: row[12]?.toLowerCase() === 'yellow' ? 'Yellow' : 
                            row[12]?.toLowerCase() === 'amber' ? 'Amber' : 
                            row[12]?.toLowerCase() === 'red' ? 'Red' : 'Yellow',
              appCode: row[13] || ''
            });
          });
        });

        console.log("Nombre de combinaisons générées:", combinations.length);
        validRows += combinations.length;
        processedData.push(...combinations);
      } else {
        console.log("Ligne ignorée - pas assez de colonnes");
        skippedRows++;
      }
    }

    console.log("Nombre total de lignes après traitement:", processedData.length);
    
    // Nettoyage des fichiers temporaires
    DriveApp.getFileById(tempFileId).setTrashed(true);
    DriveApp.getFileById(spreadsheetId).setTrashed(true);
    
    if (processedData.length === 0) {
      throw new Error("Aucune donnée valide trouvée dans le XLSX");
    }

    return { 
      success: true, 
      data: processedData,
      headerLines: headerLinesCache,
      message: validRows + " lignes valides importées, " + skippedRows + " lignes ignorées (champs manquants ou colonnes A-L vides)",
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

// Function to export XLSX with header lines and modified data (remplace exportCSV)
function exportXLSX(modifiedLines) {
  try {
    console.log("Début export XLSX avec", modifiedLines.length, "lignes modifiées");
    
    // Créer un nouveau Spreadsheet
    const spreadsheet = SpreadsheetApp.create('Export_NES_' + new Date().getTime());
    const sheet = spreadsheet.getActiveSheet();
    
    console.log("XLSX Header Lines (originales, non modifiées):", JSON.stringify(headerLinesCache));
    
    // Ajouter les 11 lignes d'en-tête
    for (let i = 0; i < headerLinesCache.length; i++) {
      sheet.getRange(i + 1, 1, 1, headerLinesCache[i].length).setValues([headerLinesCache[i]]);
    }
    
    // Ajouter les données modifiées à partir de la ligne 12
    let rowIndex = 12;
    
    modifiedLines.forEach(rule => {
      // Handle multiple IPs by splitting and creating separate rows for each combination
      const sourceIPs = rule.sourceIP.split('\n').filter(ip => ip.trim());
      const destIPs = rule.destIP.split('\n').filter(ip => ip.trim());
      
      sourceIPs.forEach(srcIP => {
        destIPs.forEach(dstIP => {
          const rowData = [
            '', '', '', srcIP.trim(), '', '', dstIP.trim(), rule.protocol,
            rule.service, rule.port, rule.authentication, rule.flowEncryption,
            rule.classification, rule.appCode
          ];
          
          sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
          rowIndex++;
        });
      });
    });
    
    console.log("XLSX Data exportée (11 premières lignes + lignes modifiées):", 
                "Nombre total de lignes: " + rowIndex,
                "Premières lignes: " + JSON.stringify(headerLinesCache.slice(0, 3)));
    
    // Export XLSX et nettoyage
    const spreadsheetId = spreadsheet.getId();
    const blob = DriveApp.getFileById(spreadsheetId).getBlob();
    DriveApp.getFileById(spreadsheetId).setTrashed(true);
    
    return blob;
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

// Function to save the Network Equipment Sheet (adapté pour XLSX)
function saveNES(formData) {
  try {
    console.log("saveNES called with data:", JSON.stringify(formData));
    
    if (!formData.department || !formData.projectCode || !formData.email || !formData.rules || formData.rules.length === 0) {
      return {
        success: false,
        message: "Données incomplètes"
      };
    }
    
    // Créer un nouveau Spreadsheet pour la sauvegarde NES
    const spreadsheet = SpreadsheetApp.create(`NES_${formData.department}_${formData.projectCode}_${new Date().getTime()}`);
    const sheet = spreadsheet.getActiveSheet();
    
    // Ajouter les 11 lignes d'en-tête
    for (let i = 0; i < headerLinesCache.length; i++) {
      sheet.getRange(i + 1, 1, 1, headerLinesCache[i].length).setValues([headerLinesCache[i]]);
    }
    
    // Mettre à jour les informations dans les headers
    if (headerLinesCache.length >= 6) {
      sheet.getRange(5, 3).setValue(formData.department);  // C5
      sheet.getRange(5, 10).setValue(formData.projectCode); // J5
      sheet.getRange(6, 10).setValue(formData.email);       // J6
    }
    
    // Ajouter les règles à partir de la ligne 12
    let rowIndex = 12;
    formData.rules.forEach(rule => {
      const rowData = [
        '', '', '', rule.sourceIP, '', '', rule.destIP, rule.protocol,
        rule.service, rule.port, rule.authentication, rule.flowEncryption,
        rule.classification, rule.appCode
      ];
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      rowIndex++;
    });
    
    const spreadsheetId = spreadsheet.getId();
    console.log("✅ NES sauvegardé avec succès en XLSX - ID:", spreadsheetId);
    
    return {
      success: true,
      spreadsheetId: spreadsheetId,
      message: "NES sauvegardé avec succès en format XLSX"
    };
  } catch (e) {
    console.error("Erreur saveNES:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la sauvegarde du NES: " + e.toString()
    };
  }
}
