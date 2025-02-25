
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fonction pour importer un CSV
function importCSV(csvData) {
  try {
    console.log("Début de l'import CSV");
    console.log("Type des données reçues:", typeof csvData);
    console.log("Longueur des données:", csvData.length);

    var data = Utilities.parseCsv(csvData);
    console.log("Nombre de lignes parsées:", data.length);
    console.log("Première ligne:", data[0]);

    // On commence à la ligne 12
    if (data.length < 12) {
      throw new Error("Le fichier CSV doit contenir au moins 12 lignes");
    }

    // On prend les données à partir de la ligne 12
    var processedData = data.slice(11).map(function(row, index) {
      console.log("Traitement ligne", index + 12, ":", row);
      
      if (row.length >= 14) { // Il nous faut au moins 14 colonnes
        var processedRow = {
          sourceIP: row[3] || '',        // Colonne D
          destIP: row[6] || '',          // Colonne G
          protocol: row[7] || 'TCP',     // Colonne H
          service: row[8] || '',         // Colonne I
          port: row[9] || '',            // Colonne J
          authentication: row[10] || 'No',// Colonne K
          flowEncryption: row[11] || 'No',// Colonne L
          classification: row[12] || 'Yellow', // Colonne M
          appCode: row[13] || ''         // Colonne N
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

// Fonction pour sauvegarder un brouillon
function saveDraft(formData) {
  try {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('draft', JSON.stringify(formData));
    return { success: true, message: "Brouillon sauvegardé" };
  } catch(e) {
    return { success: false, message: "Erreur lors de la sauvegarde: " + e.toString() };
  }
}

// Fonction pour récupérer un brouillon
function getDraft() {
  try {
    var userProperties = PropertiesService.getUserProperties();
    var draft = userProperties.getProperty('draft');
    if (!draft) {
      return { success: false, message: "Aucun brouillon trouvé" };
    }
    return { success: true, data: JSON.parse(draft) };
  } catch(e) {
    return { success: false, message: "Erreur lors de la récupération: " + e.toString() };
  }
}

// Fonction pour supprimer le formulaire/brouillon
function deleteForm() {
  try {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('draft');
    return { success: true, message: "Formulaire supprimé" };
  } catch(e) {
    return { success: false, message: "Erreur lors de la suppression: " + e.toString() };
  }
}

// Fonction pour générer les scripts
function generateScripts(formData) {
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
    return { success: false, message: "Erreur lors de la génération: " + e.toString() };
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
