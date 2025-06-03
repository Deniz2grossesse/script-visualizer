
function doGet() {
  console.log("doGet called");
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Functions to manage header lines cache with PropertiesService
function setHeaderLinesCache(headerLines) {
  try {
    const props = PropertiesService.getUserProperties();
    props.setProperty("headerLinesCache", JSON.stringify(headerLines));
    console.log("Header lines cached successfully:", headerLines.length, "lines");
  } catch (e) {
    console.error("Error caching header lines:", e.toString());
  }
}

function getHeaderLinesCache() {
  try {
    const props = PropertiesService.getUserProperties();
    const json = props.getProperty("headerLinesCache");
    const result = json ? JSON.parse(json) : [];
    console.log("Retrieved header lines from cache:", result.length, "lines");
    return result;
  } catch (e) {
    console.error("Error retrieving header lines from cache:", e.toString());
    return [];
  }
}

// Function to sanitize data for JSON serialization
function sanitizeData(data) {
  return data.map(row => 
    row.map(cell => {
      if (cell === null || cell === undefined) return "";
      if (typeof cell === 'object' && cell instanceof Date) {
        return cell.toISOString();
      }
      return String(cell);
    })
  );
}

function handleXLSXFileSelect(base64Data, fileName) {
  console.log("handleXLSXFileSelect called with file:", fileName);
  if (!base64Data) {
    return { 
      success: false, 
      message: "Aucun fichier sélectionné" 
    };
  }
  
  return importXLSX(base64Data, fileName);
}

function importXLSX(base64Data, fileName) {
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

    // Convert Base64 data back to blob
    const base64Content = base64Data.split(',')[1]; // Remove data:application/... part
    const binaryData = Utilities.base64Decode(base64Content);
    const fileBlob = Utilities.newBlob(binaryData, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName);
    
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

    // Sanitize data before processing
    const sanitizedData = sanitizeData(data);

    // Extract department (C5), projectCode (J5), and requesterEmail (J6)
    var department = sanitizedData[4]?.[2] || "";      // Ligne 5, colonne 3 → C5
    var projectCode = sanitizedData[4]?.[9] || "";     // Ligne 5, colonne 10 → J5
    var requesterEmail = sanitizedData[5]?.[9] || "";  // Ligne 6, colonne 10 → J6
    
    console.log("Extracted department:", department);
    console.log("Extracted projectCode:", projectCode);
    console.log("Extracted requesterEmail:", requesterEmail);

    // Sauvegarder les 11 premières lignes avec PropertiesService
    const headerLines = sanitizedData.slice(0, 11);
    setHeaderLinesCache(headerLines);
    
    // Compteurs pour les lignes valides et ignorées
    var validRows = 0;
    var skippedRows = 0;
    
    // Traitement TOUTES les lignes après la ligne 11 (pas d'arrêt)
    var processedData = [];
    
    for (let i = 11; i < sanitizedData.length; i++) {
      const row = sanitizedData[i];
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
      headerLines: headerLines,
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

// Function to save the Network Equipment Sheet and return Google Sheets URL
function saveNES(formData) {
  try {
    console.log("saveNES called with data:", JSON.stringify(formData));
    
    if (!formData.department || !formData.projectCode || !formData.email || !formData.rules || formData.rules.length === 0) {
      return {
        success: false,
        message: "Données incomplètes"
      };
    }
    
    // Récupérer les en-têtes depuis PropertiesService
    const headerLines = getHeaderLinesCache();
    
    if (!headerLines || headerLines.length < 11) {
      console.log("⚠️ En-têtes manquants ou insuffisants dans le cache");
      return {
        success: false,
        message: "En-têtes manquants. Veuillez d'abord importer un fichier XLSX."
      };
    }
    
    // Créer un nouveau Spreadsheet complètement vide
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const spreadsheet = SpreadsheetApp.create(`NES_${formData.department}_${formData.projectCode}_${timestamp}`);
    const sheet = spreadsheet.getActiveSheet();
    
    console.log("✅ Nouveau Spreadsheet créé - ID:", spreadsheet.getId());
    
    // Ajouter les 11 lignes d'en-tête depuis le cache
    for (let i = 0; i < 11; i++) {
      if (headerLines[i] && headerLines[i].length > 0) {
        sheet.getRange(i + 1, 1, 1, headerLines[i].length).setValues([headerLines[i]]);
      }
    }
    console.log("✅ 11 lignes d'en-tête ajoutées depuis le cache");
    
    // Mettre à jour les métadonnées dans les en-têtes
    sheet.getRange(5, 3).setValue(formData.department);  // C5
    sheet.getRange(5, 10).setValue(formData.projectCode); // J5
    sheet.getRange(6, 10).setValue(formData.email);       // J6
    
    console.log("✅ Métadonnées mises à jour:", {
      department: formData.department,
      projectCode: formData.projectCode,
      email: formData.email
    });
    
    // Ajouter les règles à partir de la ligne 12
    let rowIndex = 12;
    formData.rules.forEach(rule => {
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
    
    console.log("✅ Règles ajoutées:", formData.rules.length, "règles, lignes créées:", rowIndex - 12);
    
    const spreadsheetUrl = spreadsheet.getUrl();
    
    console.log("✅ NES Google Sheets créé avec succès - URL:", spreadsheetUrl);
    
    // Retourner l'URL pour ouvrir le Google Sheets
    return {
      success: true,
      url: spreadsheetUrl,
      spreadsheetId: spreadsheet.getId(),
      message: "NES créé avec succès dans Google Sheets"
    };
  } catch (e) {
    console.error("Erreur saveNES:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la sauvegarde du NES: " + e.toString()
    };
  }
}
