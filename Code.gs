
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
          authentication: row[10]?.toLowerCase() === 'yes' ? 'Yes' : 'No',
          flowEncryption: row[11]?.toLowerCase() === 'yes' ? 'Yes' : 'No',
          classification: row[12]?.toLowerCase() === 'yellow' ? 'Yellow' : 
                        row[12]?.toLowerCase() === 'amber' ? 'Amber' : 
                        row[12]?.toLowerCase() === 'red' ? 'Red' : 'Yellow',
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
