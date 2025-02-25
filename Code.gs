
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

function generateScripts(formData) {
  console.log("generateScripts called with data:", JSON.stringify(formData));
  if (!formData) {
    return {
      success: false,
      message: "Données manquantes pour la génération des scripts"
    };
  }

  try {
    var scripts = {
      networkRules: generateNetworkRules(formData),
      accessRules: generateAccessRules(formData),
      securityPolicies: generateSecurityPolicies(formData)
    };

    return {
      success: true,
      data: scripts,
      message: "Scripts générés avec succès"
    };
  } catch(e) {
    console.error("Erreur generateScripts:", e.toString());
    return { 
      success: false, 
      message: "Erreur lors de la génération: " + e.toString() 
    };
  }
}

function generateNetworkRules(data) {
  return `# Network rules for ${data.department}/${data.projectCode}
allow_access:
  - department: ${data.department}
  - project: ${data.projectCode}
  - requester: ${data.email}`;
}

function generateAccessRules(data) {
  return `# Access rules for ${data.department}/${data.projectCode}
grant_access:
  - level: standard
  - department: ${data.department}
  - project: ${data.projectCode}`;
}

function generateSecurityPolicies(data) {
  return `# Security policies for ${data.department}/${data.projectCode}
security_level: standard
monitoring: enabled
logging: enabled
department: ${data.department}
project: ${data.projectCode}`;
}
