
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

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
    
    if (data.length < 12) {
      return { 
        success: false, 
        message: "Le fichier CSV doit contenir au moins 12 lignes" 
      };
    }

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

function generateScripts(formData) {
  try {
    console.log("Début de la génération des scripts");
    console.log("Données reçues:", formData);

    // Validation des données requises
    if (!formData || typeof formData !== 'object') {
      return {
        success: false,
        message: "Format de données invalide"
      };
    }

    // Validation des champs obligatoires
    if (!formData.department || !formData.projectCode || !formData.email) {
      return {
        success: false,
        message: "Champs obligatoires manquants (department, projectCode, email)"
      };
    }

    // Validation du format des données
    if (formData.department.length > 4 || formData.projectCode.length > 4) {
      return {
        success: false,
        message: "Le département et le code projet doivent faire moins de 4 caractères"
      };
    }

    // Validation de l'email
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return {
        success: false,
        message: "Format d'email invalide"
      };
    }

    // Génération des contenus des scripts
    var networkRulesContent = `# Network rules for ${formData.department}/${formData.projectCode}
allow_access:
  - department: ${formData.department}
  - project: ${formData.projectCode}
  - requester: ${formData.email}`;

    var accessRulesContent = `# Access rules for ${formData.department}/${formData.projectCode}
grant_access:
  - level: standard
  - department: ${formData.department}
  - project: ${formData.projectCode}`;

    var securityPoliciesContent = `# Security policies for ${formData.department}/${formData.projectCode}
security_level: standard
monitoring: enabled
logging: enabled
department: ${formData.department}
project: ${formData.projectCode}`;

    // Retourne les scripts générés
    return {
      success: true,
      data: {
        networkRules: networkRulesContent,
        accessRules: accessRulesContent,
        securityPolicies: securityPoliciesContent
      },
      message: "Scripts générés avec succès"
    };

  } catch(e) {
    console.error("Erreur lors de la génération des scripts:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la génération: " + e.toString()
    };
  }
}

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

function saveDraft(formData) {
  try {
    if (!formData) {
      return { 
        success: false, 
        message: "Aucune donnée fournie pour la sauvegarde" 
      };
    }

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
