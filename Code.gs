
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fonction d'import CSV - ne s'exécute que sur appel explicite
function importCSV(csvData) {
  if (!csvData) {
    return { 
      success: false, 
      message: "Aucune donnée CSV fournie" 
    };
  }

  try {
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
          authentication: 'No',
          flowEncryption: 'No',
          classification: 'Yellow',
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

    // Retourne les données sans les charger automatiquement
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

// Fonction de génération des scripts - ne s'exécute que sur appel explicite
function generateScripts(formData) {
  if (!formData) {
    return {
      success: false,
      message: "Aucune donnée fournie"
    };
  }

  try {
    if (typeof formData !== 'object') {
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

    // Validation des longueurs
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

    // Génération des scripts uniquement après validation
    var networkRulesContent = [
      '# Network rules for ' + formData.department + '/' + formData.projectCode,
      'allow_access:',
      '  - department: ' + formData.department,
      '  - project: ' + formData.projectCode,
      '  - requester: ' + formData.email
    ].join('\n');

    var accessRulesContent = [
      '# Access rules for ' + formData.department + '/' + formData.projectCode,
      'grant_access:',
      '  - level: standard',
      '  - department: ' + formData.department,
      '  - project: ' + formData.projectCode
    ].join('\n');

    var securityPoliciesContent = [
      '# Security policies for ' + formData.department + '/' + formData.projectCode,
      'security_level: standard',
      'monitoring: enabled',
      'logging: enabled',
      'department: ' + formData.department,
      'project: ' + formData.projectCode
    ].join('\n');

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
