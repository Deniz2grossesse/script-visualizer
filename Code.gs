
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
    
    if (!csvData) {
      return { 
        success: false, 
        message: "Aucune donnée CSV fournie" 
      };
    }

    var data = Utilities.parseCsv(csvData);
    
    // Vérification de la longueur minimale
    if (data.length < 12) {
      return { 
        success: false, 
        message: "Le fichier CSV doit contenir au moins 12 lignes" 
      };
    }

    // On prend les données à partir de la ligne 12
    var processedData = data.slice(11).map(function(row) {
      if (row.length >= 14) {
        return {
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
      }
      return null;
    }).filter(function(row) {
      return row !== null;
    });

    if (processedData.length === 0) {
      return { 
        success: false, 
        message: "Aucune donnée valide trouvée dans le CSV" 
      };
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
  if (!formData) {
    return { 
      success: false, 
      message: "Aucune donnée fournie pour la sauvegarde" 
    };
  }

  try {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('draft', JSON.stringify(formData));
    return { 
      success: true, 
      message: "Brouillon sauvegardé" 
    };
  } catch(e) {
    return { 
      success: false, 
      message: "Erreur lors de la sauvegarde: " + e.toString() 
    };
  }
}

// Fonction pour récupérer un brouillon
function getDraft() {
  try {
    var userProperties = PropertiesService.getUserProperties();
    var draft = userProperties.getProperty('draft');
    
    if (!draft) {
      return { 
        success: false, 
        message: "Aucun brouillon trouvé" 
      };
    }
    
    return { 
      success: true, 
      data: JSON.parse(draft) 
    };
  } catch(e) {
    return { 
      success: false, 
      message: "Erreur lors de la récupération: " + e.toString() 
    };
  }
}

// Fonction pour supprimer le formulaire/brouillon
function deleteForm() {
  try {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('draft');
    return { 
      success: true, 
      message: "Formulaire supprimé" 
    };
  } catch(e) {
    return { 
      success: false, 
      message: "Erreur lors de la suppression: " + e.toString() 
    };
  }
}

// Fonction pour générer les scripts
function generateScripts(formData) {
  if (!formData) {
    return {
      success: false,
      message: "Aucune donnée fournie pour la génération des scripts"
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
    return { 
      success: false, 
      message: "Erreur lors de la génération: " + e.toString() 
    };
  }
}

function generateNetworkRules(data) {
  if (!data || !data.department || !data.projectCode || !data.email) {
    throw new Error("Données manquantes pour la génération des règles réseau");
  }
  
  return `# Network rules for ${data.department}/${data.projectCode}
allow_access:
  - department: ${data.department}
  - project: ${data.projectCode}
  - requester: ${data.email}`;
}

function generateAccessRules(data) {
  if (!data || !data.department || !data.projectCode) {
    throw new Error("Données manquantes pour la génération des règles d'accès");
  }
  
  return `# Access rules for ${data.department}/${data.projectCode}
grant_access:
  - level: standard
  - department: ${data.department}
  - project: ${data.projectCode}`;
}

function generateSecurityPolicies(data) {
  if (!data || !data.department || !data.projectCode) {
    throw new Error("Données manquantes pour la génération des politiques de sécurité");
  }
  
  return `# Security policies for ${data.department}/${data.projectCode}
security_level: standard
monitoring: enabled
logging: enabled
department: ${data.department}
project: ${data.projectCode}`;
}
