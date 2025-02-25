
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fonction pour valider les entrées
function validateInput(data) {
  // Validation des champs obligatoires
  if (!data.department || !data.projectCode || !data.email) {
    return { success: false, message: "Tous les champs sont obligatoires" };
  }
  
  // Validation du département (1-4 caractères)
  if (data.department.length > 4) {
    return { success: false, message: "Le département doit faire entre 1 et 4 caractères" };
  }
  
  // Validation du code projet (1-4 caractères)
  if (data.projectCode.length > 4) {
    return { success: false, message: "Le code projet doit faire entre 1 et 4 caractères" };
  }
  
  // Validation de l'email
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, message: "Email invalide" };
  }
  
  return { success: true };
}

// Fonction pour importer un CSV
function importCSV(csvData) {
  try {
    var data = Utilities.parseCsv(csvData);
    // Vérifie que le CSV a le bon format
    if (data[0].length < 3) {
      throw new Error("Format CSV invalide");
    }
    return { success: true, data: data };
  } catch(e) {
    return { success: false, message: e.toString() };
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
    // Validation des données
    var validation = validateInput(formData);
    if (!validation.success) {
      return validation;
    }

    // Création des scripts (exemple)
    var scripts = {
      networkRules: generateNetworkRules(formData),
      accessRules: generateAccessRules(formData),
      securityPolicies: generateSecurityPolicies(formData)
    };

    // Sauvegarde dans une feuille de calcul pour suivi
    logToSpreadsheet(formData, scripts);

    return {
      success: true,
      data: scripts,
      message: "Scripts générés avec succès"
    };
  } catch(e) {
    return { success: false, message: "Erreur lors de la génération: " + e.toString() };
  }
}

// Fonctions utilitaires pour la génération des scripts
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

// Fonction pour logger les générations dans une feuille de calcul
function logToSpreadsheet(formData, scripts) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet() || 
             SpreadsheetApp.create('Network Rules Generator Logs');
    var sheet = ss.getSheetByName('Logs') || ss.insertSheet('Logs');
    
    // Si la feuille est vide, ajout des en-têtes
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Date', 'Department', 'Project Code', 'Requester Email', 
        'Network Rules', 'Access Rules', 'Security Policies'
      ]);
    }
    
    // Ajout de la nouvelle entrée
    sheet.appendRow([
      new Date(),
      formData.department,
      formData.projectCode,
      formData.email,
      scripts.networkRules,
      scripts.accessRules,
      scripts.securityPolicies
    ]);
    
  } catch(e) {
    console.error('Erreur de logging:', e.toString());
  }
}
