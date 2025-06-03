
function doGet() {
  console.log("doGet called");
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Global variables to store header lines and raw CSV content
var headerLinesCache = [];
var rawCSVContent = "";  // Contains the raw CSV file
var userDraft = null;   // To store the draft for a user

function handleFileSelect(fileData) {
  console.log("handleFileSelect called with file data length:", fileData ? fileData.length : 0);
  if (!fileData) {
    return { 
      success: false, 
      message: "Aucun fichier sélectionné" 
    };
  }
  
  // Store the raw CSV content
  rawCSVContent = fileData;
  
  return importCSV(fileData);
}

function importCSV(csvData) {
  console.log("importCSV called");
  try {
    console.log("Début de l'import CSV");
    console.log("Type des données reçues:", typeof csvData);
    console.log("Longueur des données:", csvData.length);

    var data = Utilities.parseCsv(csvData);
    console.log("Nombre de lignes parsées:", data.length);
    console.log("Première ligne:", data[0]);

    if (data.length < 12) {
      throw new Error("Le fichier CSV doit contenir au moins 12 lignes");
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
      throw new Error("Aucune donnée valide trouvée dans le CSV");
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
    console.error("Erreur lors de l'import:", e.toString());
    return { 
      success: false, 
      message: "Erreur lors de l'import: " + e.toString() 
    };
  }
}

// Function to export CSV with header lines and modified data
function exportCSV(modifiedLines) {
  try {
    const csvData = headerLinesCache.slice(); // Clone headers
    
    console.log("CSV Header Lines (originales, non modifiées):", JSON.stringify(headerLinesCache));
    
    modifiedLines.forEach(rule => {
      // Handle multiple IPs by splitting and creating separate rows for each combination
      const sourceIPs = rule.sourceIP.split('\n').filter(ip => ip.trim());
      const destIPs = rule.destIP.split('\n').filter(ip => ip.trim());
      
      sourceIPs.forEach(srcIP => {
        destIPs.forEach(dstIP => {
          csvData.push([
            '', '', '', srcIP.trim(), '', '', dstIP.trim(), rule.protocol,
            rule.service, rule.port, rule.authentication, rule.flowEncryption,
            rule.classification, rule.appCode
          ]);
        });
      });
    });
    
    console.log("CSV Data exportée (11 premières lignes + lignes modifiées):", 
                "Nombre total de lignes: " + csvData.length,
                "Premières lignes: " + JSON.stringify(csvData.slice(0, 5)));
    
    const csvString = csvData.map(row => row.join(',')).join('\r\n');
    return csvString;
  } catch (e) {
    console.error('Erreur exportCSV:', e.toString());
    throw new Error('Erreur lors de la génération CSV');
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
    rawCSVContent = "";
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

// Function to save the Network Equipment Sheet - VERSION AMÉLIORÉE
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

    // Cloner les 11 premières lignes du tableau (headerLinesCache)
    const csvData = headerLinesCache.slice();

    // Pour chaque règle, on prépare une ligne CSV au format correct
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

      csvData.push([
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

    // Générer le contenu CSV final
    const csvString = csvData.map(row => row.join(',')).join('\r\n');
    rawCSVContent = csvString;

    // On sauvegarde aussi le draft (utile pour recharger)
    userDraft = formData;

    console.log("CSV final généré avec succès");
    console.log("Nombre total de lignes :", csvData.length);

    return {
      success: true,
      message: "NES sauvegardé avec succès"
    };
  } catch (e) {
    console.error("Erreur saveNES:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la sauvegarde du NES: " + e.toString()
    };
  }
}
