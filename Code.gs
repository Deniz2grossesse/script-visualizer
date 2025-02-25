
// Point d'entrée - ne fait que charger la page, RIEN d'autre
function doGet() {
  console.log("Chargement initial");  // Pour tracer l'exécution
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fonction d'import CSV - UNIQUEMENT appelée par le bouton d'import
function importCSV(csvData) {
  console.log("Import CSV appelé manuellement"); // Pour tracer l'exécution
  
  // Vérification que la fonction est bien appelée avec des données
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

    // Retourne les données SANS les charger automatiquement
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

// Fonction pour générer les scripts - UNIQUEMENT sur demande explicite
function generateScripts(formData) {
  console.log("Génération de scripts appelée manuellement"); // Pour tracer l'exécution
  
  // On ne fait rien si la fonction est appelée sans données
  if (!formData || typeof formData !== 'object') {
    return {
      success: false,
      message: "Données invalides"
    };
  }

  return {
    success: true,
    data: {
      message: "Fonction désactivée temporairement"
    }
  };
}

// Fonction de vérification - UNIQUEMENT sur demande explicite
function verifyRules(rules) {
  console.log("Vérification appelée manuellement"); // Pour tracer l'exécution
  
  // On ne fait rien si la fonction est appelée sans données
  if (!rules || !Array.isArray(rules)) {
    return {
      success: false,
      message: "Données invalides"
    };
  }

  return {
    success: true,
    data: {
      message: "Fonction désactivée temporairement"
    }
  };
}

// Fonction pour supprimer - UNIQUEMENT sur demande explicite
function deleteRules() {
  console.log("Suppression appelée manuellement"); // Pour tracer l'exécution
  
  return {
    success: true,
    message: "Fonction désactivée temporairement"
  };
}
