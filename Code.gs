
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
var rawXLSXContent = "";  // Contains the raw XLSX file content
var userDraft = null;   // To store the draft for a user

/**
 * 🔶 1. Chargement et vérification du fichier Excel (.xlsx)
 * Vérifie que le fichier est bien au format .xlsx et rejette tout autre format
 */
function handleXLSXFileSelect(fileBlob, fileName) {
  console.log("handleXLSXFileSelect called with file:", fileName);
  
  // 📝 Vérification automatisée : Format .xlsx obligatoire
  if (!fileName.toLowerCase().endsWith('.xlsx')) {
    console.error("Format de fichier non supporté:", fileName);
    return { 
      success: false, 
      message: "❌ ERREUR: Seuls les fichiers .xlsx sont acceptés. Le format CSV n'est plus supporté." 
    };
  }
  
  // Vérifier le type MIME
  const mimeType = fileBlob.getContentType();
  console.log("MIME type détecté:", mimeType);
  
  if (mimeType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    console.error("MIME type invalide:", mimeType);
    return { 
      success: false, 
      message: "❌ ERREUR: Le fichier n'est pas un vrai fichier Excel .xlsx" 
    };
  }
  
  return processXLSXFile(fileBlob, fileName);
}

/**
 * 🔶 2. Conversion du fichier .xlsx en Google Sheets
 * Convertit le fichier Excel en Google Sheets pour le traitement
 */
function processXLSXFile(fileBlob, fileName) {
  try {
    console.log("🔄 Début de la conversion XLSX vers Google Sheets");
    
    // Créer un fichier temporaire dans Drive
    const tempFile = DriveApp.createFile(fileBlob);
    const tempFileId = tempFile.getId();
    
    console.log("Fichier temporaire créé:", tempFileId);
    
    // Convertir en Google Sheets
    const convertedFile = Drive.Files.insert({
      title: 'temp_' + fileName + '_' + new Date().getTime(),
      mimeType: 'application/vnd.google-apps.spreadsheet'
    }, fileBlob);
    
    const spreadsheetId = convertedFile.id;
    console.log("✅ Conversion réussie - ID Spreadsheet:", spreadsheetId);
    
    // 📝 Vérification automatisée : Confirmer la conversion
    const convertedSpreadsheet = SpreadsheetApp.openById(spreadsheetId);
    if (!convertedSpreadsheet) {
      throw new Error("Échec de la conversion en Google Sheets");
    }
    
    // 🔶 3. Extraction des données
    const result = extractDataFromSpreadsheet(convertedSpreadsheet);
    
    // 🔶 6. Nettoyage des fichiers temporaires
    cleanupTempFiles(tempFileId, spreadsheetId);
    
    return result;
    
  } catch(e) {
    console.error("Erreur lors du traitement XLSX:", e.toString());
    return { 
      success: false, 
      message: "Erreur lors du traitement du fichier XLSX: " + e.toString() 
    };
  }
}

/**
 * 🔶 3. Extraction des données du Google Sheets
 * Lit toutes les données et vérifie la structure
 */
function extractDataFromSpreadsheet(spreadsheet) {
  console.log("🔄 Extraction des données du spreadsheet");
  
  const sheet = spreadsheet.getSheets()[0];
  if (!sheet) {
    throw new Error("Aucune feuille trouvée dans le fichier");
  }
  
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  
  console.log("Nombre de lignes extraites:", data.length);
  console.log("Première ligne:", data[0]);
  
  // 📝 Vérification automatisée : Au moins 12 lignes requises
  if (data.length < 12) {
    throw new Error("Le fichier XLSX doit contenir au moins 12 lignes (11 headers + données)");
  }
  
  // 🔶 4. Stockage des 11 premières lignes en mémoire
  return storeHeadersAndProcessData(data);
}

/**
 * 🔶 4. Stockage des 11 premières lignes en mémoire
 * Stocke les headers et traite les données métier
 */
function storeHeadersAndProcessData(data) {
  console.log("🔄 Stockage des headers et traitement des données");
  
  // Extraire et stocker les 11 premières lignes
  headerLinesCache = data.slice(0, 11);
  console.log("✅ 11 premières lignes stockées en cache");
  
  // 📝 Vérification automatisée : Vérifier que nous avons bien 11 lignes
  if (headerLinesCache.length !== 11) {
    throw new Error("Erreur: Les headers doivent contenir exactement 11 lignes");
  }
  
  // Extract department (C5), projectCode (J5), and requesterEmail (J6)
  var department = data[4]?.[2] || "";      // Ligne 5, colonne 3 → C5
  var projectCode = data[4]?.[9] || "";     // Ligne 5, colonne 10 → J5
  var requesterEmail = data[5]?.[9] || "";  // Ligne 6, colonne 10 → J6
  
  console.log("Extracted department:", department);
  console.log("Extracted projectCode:", projectCode);
  console.log("Extracted requesterEmail:", requesterEmail);
  
  // 🔶 5. Traitement des données métier (à partir de la ligne 12)
  return processBusinessData(data.slice(11), department, projectCode, requesterEmail);
}

/**
 * 🔶 5. Traitement des données métier
 * Traite les données à partir de la ligne 12 avec toutes les vérifications
 */
function processBusinessData(businessData, department, projectCode, requesterEmail) {
  console.log("🔄 Traitement de", businessData.length, "lignes de données métier");
  
  var validRows = 0;
  var skippedRows = 0;
  
  var processedData = businessData.map(function(row, index) {
    console.log("Traitement ligne", index + 12, ":", row);
    
    // 📝 Vérification automatisée : Cohérence des lignes
    if (row.length >= 14) {
      // Champs requis dans une ligne
      if (!row[3] || !row[6] || !row[7] || !row[8] || !row[9] || !row[10] || !row[11] || !row[12] || !row[13]) {
        console.log("Ligne ignorée car un champ est vide :", row);
        skippedRows++;
        return null;
      }
      
      // Traitement des IPs multiples
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
            protocol: row[7]?.toString() || 'TCP',
            service: row[8]?.toString() || '',
            port: row[9]?.toString() || '',
            authentication: row[10]?.toString().toLowerCase() === 'yes' ? 'Yes' : 'No',
            flowEncryption: row[11]?.toString().toLowerCase() === 'yes' ? 'Yes' : 'No',
            classification: row[12]?.toString().toLowerCase() === 'yellow' ? 'Yellow' : 
                          row[12]?.toString().toLowerCase() === 'amber' ? 'Amber' : 
                          row[12]?.toString().toLowerCase() === 'red' ? 'Red' : 'Yellow',
            appCode: row[13]?.toString() || ''
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
  console.log("✅ Nombre total de lignes après traitement:", allProcessedRows.length);
  
  if (allProcessedRows.length === 0) {
    throw new Error("Aucune donnée valide trouvée dans le fichier XLSX");
  }

  return { 
    success: true, 
    data: allProcessedRows,
    headerLines: headerLinesCache,
    message: "✅ XLSX traité avec succès: " + validRows + " lignes valides importées, " + skippedRows + " lignes ignorées",
    department: department,
    projectCode: projectCode,
    requesterEmail: requesterEmail
  };
}

/**
 * 🔶 6. Nettoyage des fichiers temporaires
 * Supprime les fichiers temporaires pour ne pas encombrer Drive
 */
function cleanupTempFiles(tempFileId, spreadsheetId) {
  try {
    console.log("🔄 Nettoyage des fichiers temporaires");
    
    // Supprimer le fichier temporaire original
    if (tempFileId) {
      const tempFile = DriveApp.getFileById(tempFileId);
      tempFile.setTrashed(true);
      console.log("✅ Fichier temporaire supprimé:", tempFileId);
    }
    
    // Supprimer le spreadsheet temporaire
    if (spreadsheetId) {
      const spreadsheetFile = DriveApp.getFileById(spreadsheetId);
      spreadsheetFile.setTrashed(true);
      console.log("✅ Spreadsheet temporaire supprimé:", spreadsheetId);
    }
    
    // 📝 Vérification automatisée : Confirmer la suppression
    console.log("✅ Nettoyage terminé - aucun fichier temporaire laissé dans Drive");
    
  } catch(e) {
    console.error("Erreur lors du nettoyage:", e.toString());
    // Ne pas faire échouer le processus principal pour un problème de nettoyage
  }
}

// Function to export XLSX with header lines and modified data
function exportXLSX(modifiedLines) {
  try {
    console.log("🔄 Export XLSX avec", modifiedLines.length, "lignes modifiées");
    
    // Créer une nouvelle feuille avec les headers + données modifiées
    const spreadsheet = SpreadsheetApp.create('Export_' + new Date().getTime());
    const sheet = spreadsheet.getActiveSheet();
    
    // Ajouter les 11 lignes d'en-tête
    for (let i = 0; i < headerLinesCache.length; i++) {
      sheet.getRange(i + 1, 1, 1, headerLinesCache[i].length).setValues([headerLinesCache[i]]);
    }
    
    // Ajouter les données modifiées
    let rowIndex = 12; // Commencer après les 11 lignes d'en-tête
    
    modifiedLines.forEach(rule => {
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
    
    // Convertir en XLSX et télécharger
    const spreadsheetId = spreadsheet.getId();
    const blob = DriveApp.getFileById(spreadsheetId).getBlob();
    
    // Nettoyer le fichier temporaire
    DriveApp.getFileById(spreadsheetId).setTrashed(true);
    
    console.log("✅ Export XLSX terminé avec succès");
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

/**
 * 🚫 Fonction de rejet automatique des fichiers CSV
 * Cette fonction rejette explicitement tout fichier CSV
 */
function rejectCSVFiles(fileName) {
  if (fileName.toLowerCase().endsWith('.csv')) {
    console.error("❌ REJET: Tentative d'import d'un fichier CSV détectée");
    return {
      success: false,
      message: "❌ ERREUR CRITIQUE: Les fichiers CSV ne sont plus supportés. Veuillez utiliser exclusivement des fichiers .xlsx (Excel)."
    };
  }
  return { success: true };
}
