
function doGet() {
  console.log("doGet called");
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Global variable to store header lines
var headerLinesCache = [];

function handleFileSelect(fileData) {
  console.log("handleFileSelect called with file data length:", fileData ? fileData.length : 0);
  if (!fileData) {
    return { 
      success: false, 
      message: "Aucun fichier sélectionné" 
    };
  }
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

    // Sauvegarder les 11 premières lignes
    headerLinesCache = data.slice(0, 11);
    var processedData = data.slice(11).map(function(row, index) {
      console.log("Traitement ligne", index + 12, ":", row);
      
      if (row.length >= 14) {
        var sourceIPs = (row[3] || '').split(',').map(ip => ip.trim()).filter(ip => ip);
        var destIPs = (row[6] || '').split(',').map(ip => ip.trim()).filter(ip => ip);
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
        return combinations;
      }
      console.log("Ligne ignorée - pas assez de colonnes");
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
      message: allProcessedRows.length + " lignes importées avec succès"
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
    modifiedLines.forEach(rule => {
      csvData.push([
        '', '', '', rule.sourceIP, '', '', rule.destIP, rule.protocol,
        rule.service, rule.port, rule.authentication, rule.flowEncryption,
        rule.classification, rule.appCode
      ]);
    });
    const csvString = csvData.map(row => row.join(',')).join('\r\n');
    return csvString;
  } catch (e) {
    console.error('Erreur exportCSV:', e.toString());
    throw new Error('Erreur lors de la génération CSV');
  }
}

// Function to generate scripts from the rules
function generateScripts(rulesData) {
  try {
    console.log("generateScripts called with:", rulesData);
    const rules = rulesData.csvRows || [];
    
    if (!rules || rules.length === 0) {
      return { 
        success: false, 
        message: "Aucune règle valide à traiter" 
      };
    }
    
    const scripts = rules.map(rule => {
      return `curl -k -X POST "https://<TUFIN_SERVER>/securetrack/api/path-analysis" \\
  -H "Authorization: Bearer <TON_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": {
      "ip": "${rule.sourceIP.split('/')[0]}"
    },
    "destination": {
      "ip": "${rule.destIP}"
    },
    "service": {
      "protocol": "${rule.protocol.toUpperCase()}",
      "port": ${rule.port}
    }
  }'`;
    });
    
    return {
      success: true,
      data: scripts,
      message: scripts.length + " scripts générés avec succès"
    };
  } catch (e) {
    console.error("Erreur generateScripts:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la génération des scripts: " + e.toString()
    };
  }
}

// Function to delete form data
function deleteForm() {
  try {
    // Clear any stored data if needed
    headerLinesCache = [];
    return { success: true, message: "Formulaire supprimé avec succès" };
  } catch (e) {
    console.error("Erreur deleteForm:", e.toString());
    return { success: false, message: "Erreur lors de la suppression: " + e.toString() };
  }
}

// Function to get draft data if available
function getDraft() {
  try {
    // Implement draft retrieval logic here
    return { 
      success: false, 
      message: "Fonction non implémentée" 
    };
  } catch (e) {
    console.error("Erreur getDraft:", e.toString());
    return { success: false, message: "Erreur: " + e.toString() };
  }
}
