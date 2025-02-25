
function doGet() {
  console.log("doGet called");
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

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

    var processedData = data.slice(11).map(function(row, index) {
      console.log("Traitement ligne", index + 12, ":", row);
      
      if (row.length >= 14) {
        var processedRow = {
          sourceIP: row[3] || '',
          destIP: row[6] || '',
          protocol: row[7] || 'TCP',
          service: row[8] || '',
          port: row[9] || '',
          authentication: row[10] || 'No',
          flowEncryption: row[11] || 'No',
          classification: row[12] || 'Yellow',
          appCode: row[13] || ''
        };
        console.log("Ligne traitée:", processedRow);
        return processedRow;
      }
      console.log("Ligne ignorée - pas assez de colonnes");
      return null;
    }).filter(function(row) {
      return row !== null;
    });

    console.log("Nombre de lignes traitées:", processedData.length);
    
    if (processedData.length === 0) {
      throw new Error("Aucune donnée valide trouvée dans le CSV");
    }

    return { 
      success: true, 
      data: processedData,
      message: processedData.length + " lignes importées avec succès"
    };
  } catch(e) {
    console.error("Erreur lors de l'import:", e.toString());
    return { 
      success: false, 
      message: "Erreur lors de l'import: " + e.toString() 
    };
  }
}

function generateScripts(rows) {
  console.log("generateScripts called with rows:", JSON.stringify(rows));
  if (!rows || !Array.isArray(rows)) {
    return {
      success: false,
      message: "Format de données invalide"
    };
  }

  try {
    var scripts = rows.map(function(row) {
      return generateScriptForRow(row);
    });

    return {
      success: true,
      data: scripts,
      message: scripts.length + " scripts générés avec succès"
    };
  } catch(e) {
    console.error("Erreur lors de la génération:", e.toString());
    return { 
      success: false, 
      message: "Erreur lors de la génération: " + e.toString() 
    };
  }
}

function generateScriptForRow(row) {
  return `curl -X POST "https://<securetrack-url>/api/query" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your_api_token>" \\
  -d '{
    "source": "${row.sourceIP}",
    "destination": "${row.destIP}",
    "protocol": "${row.protocol.toUpperCase()}",
    "port": "${row.port}",
    "service": "${row.service}"
  }'`;
}

function saveDraft(formData) {
  console.log("saveDraft called with data:", JSON.stringify(formData));
  if (!formData) {
    return {
      success: false,
      message: "Données manquantes"
    };
  }
  
  try {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('draft', JSON.stringify(formData));
    return { success: true, message: "Brouillon sauvegardé" };
  } catch(e) {
    console.error("Erreur saveDraft:", e.toString());
    return { success: false, message: "Erreur lors de la sauvegarde: " + e.toString() };
  }
}

function getDraft() {
  console.log("getDraft called");
  try {
    var userProperties = PropertiesService.getUserProperties();
    var draft = userProperties.getProperty('draft');
    if (!draft) {
      console.log("Aucun brouillon trouvé");
      return { success: false, message: "Aucun brouillon trouvé" };
    }
    console.log("Brouillon récupéré:", draft);
    return { success: true, data: JSON.parse(draft) };
  } catch(e) {
    console.error("Erreur getDraft:", e.toString());
    return { success: false, message: "Erreur lors de la récupération: " + e.toString() };
  }
}

function deleteForm() {
  console.log("deleteForm called");
  try {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('draft');
    return { success: true, message: "Formulaire supprimé" };
  } catch(e) {
    console.error("Erreur deleteForm:", e.toString());
    return { success: false, message: "Erreur lors de la suppression: " + e.toString() };
  }
}
