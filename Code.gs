
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

    // Sauvegarder les 11 premières lignes
    var headerLines = data.slice(0, 11);
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
      headerLines: headerLines,
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

function saveToCSV(data, headerLines) {
  console.log("saveToCSV called with data:", data);
  try {
    // D'abord, ajouter les 11 premières lignes
    var csvContent = '';
    
    if (headerLines && headerLines.length > 0) {
      csvContent = headerLines.map(function(row) {
        return row.join(',');
      }).join('\n') + '\n';
    }

    // Puis ajouter les données modifiées
    data.forEach(function(row) {
      var csvRow = [
        '', '', '', // colonnes vides pour les 3 premières colonnes
        row.sourceIP,
        '', '', // colonnes vides pour les colonnes 5 et 6
        row.destIP,
        row.protocol,
        row.service,
        row.port,
        row.authentication,
        row.flowEncryption,
        row.classification,
        row.appCode
      ].join(",");
      csvContent += csvRow + "\n";
    });

    console.log("CSV content generated:", csvContent);
    
    return {
      success: true,
      data: csvContent,
      message: "Données sauvegardées avec succès"
    };
  } catch(e) {
    console.error("Erreur lors de la sauvegarde:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la sauvegarde: " + e.toString()
    };
  }
}

function generateScripts(formData) {
  console.log("generateScripts appelé avec:", formData);
  try {
    var results = [];
    if (formData && formData.rules && formData.rules.length > 0) {
      formData.rules.forEach(function(rule, index) {
        var script = generateScriptForRule(rule, index);
        results.push({
          id: index + 1,
          script: script
        });
      });
      
      return {
        success: true,
        data: results,
        message: results.length + " script(s) généré(s)"
      };
    } else {
      return {
        success: false,
        message: "Aucune règle à traiter"
      };
    }
  } catch(e) {
    console.error("Erreur:", e.toString());
    return {
      success: false,
      message: "Erreur: " + e.toString()
    };
  }
}

function generateScriptForRule(rule, index) {
  return 'curl -k -X POST "https://<TUFIN_SERVER>/securetrack/api/path-analysis" \\\n' +
    '  -H "Authorization: Bearer <TON_TOKEN>" \\\n' +
    '  -H "Content-Type: application/json" \\\n' +
    '  -d \'{\n' +
    '    "source": {\n' +
    '      "ip": "' + rule.sourceIP.split('/')[0] + '"\n' +
    '    },\n' +
    '    "destination": {\n' +
    '      "ip": "' + rule.destIP + '"\n' +
    '    },\n' +
    '    "service": {\n' +
    '      "protocol": "' + rule.protocol.toUpperCase() + '",\n' +
    '      "port": ' + rule.port + '\n' +
    '    }\n' +
    '  }\'';
}
