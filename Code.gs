// Configuration de l'API - Modifiez cette variable selon vos besoins
const API_URL = "https://your-api-server.com/api/endpoint"; // Remplacez par votre URL API

function doGet() {
  console.log("doGet called");
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Function to get the API URL
function getApiUrl() {
  return API_URL;
}

// Functions to manage header lines cache with PropertiesService
function setHeaderLinesCache(headerLines) {
  try {
    const props = PropertiesService.getUserProperties();
    props.setProperty("headerLinesCache", JSON.stringify(headerLines));
    console.log("Header lines cached successfully:", headerLines.length, "lines");
  } catch (e) {
    console.error("Error caching header lines:", e.toString());
  }
}

function getHeaderLinesCache() {
  try {
    const props = PropertiesService.getUserProperties();
    const json = props.getProperty("headerLinesCache");
    const result = json ? JSON.parse(json) : [];
    console.log("Retrieved header lines from cache:", result.length, "lines");
    return result;
  } catch (e) {
    console.error("Error retrieving header lines from cache:", e.toString());
    return [];
  }
}

// Functions to manage the permanent Google Sheets ID
function setPermanentSheetId(sheetId) {
  try {
    const props = PropertiesService.getUserProperties();
    props.setProperty("permanentSheetId", sheetId);
    console.log("Permanent sheet ID stored:", sheetId);
  } catch (e) {
    console.error("Error storing permanent sheet ID:", e.toString());
  }
}

function getPermanentSheetId() {
  try {
    const props = PropertiesService.getUserProperties();
    const sheetId = props.getProperty("permanentSheetId");
    console.log("Retrieved permanent sheet ID:", sheetId);
    return sheetId;
  } catch (e) {
    console.error("Error retrieving permanent sheet ID:", e.toString());
    return null;
  }
}

// Function to sanitize data for JSON serialization
function sanitizeData(data) {
  return data.map(row => 
    row.map(cell => {
      if (cell === null || cell === undefined) return "";
      if (typeof cell === 'object' && cell instanceof Date) {
        return cell.toISOString();
      }
      return String(cell);
    })
  );
}

function handleXLSXFileSelect(base64Data, fileName) {
  console.log("handleXLSXFileSelect called with file:", fileName);
  if (!base64Data) {
    return { 
      success: false, 
      message: "Aucun fichier selectionne" 
    };
  }
  
  return importXLSX(base64Data, fileName);
}

function importXLSX(base64Data, fileName) {
  console.log("importXLSX called with file:", fileName);
  try {
    console.log("Debut de l'import XLSX");
    
    // Validation format .xlsx uniquement
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      return { 
        success: false, 
        message: "❌ ERREUR: Seuls les fichiers .xlsx sont acceptes." 
      };
    }

    // Convert Base64 data back to blob
    const base64Content = base64Data.split(',')[1]; // Remove data:application/... part
    const binaryData = Utilities.base64Decode(base64Content);
    const fileBlob = Utilities.newBlob(binaryData, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName);
    
    // Creer le Google Sheets PERMANENT (pas temporaire)
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const convertedFile = Drive.Files.insert({
      title: `XLSX_Import_${timestamp}`,
      mimeType: 'application/vnd.google-apps.spreadsheet'
    }, fileBlob);
    
    const permanentSheetId = convertedFile.id;
    console.log("✅ Google Sheets PERMANENT cree - ID:", permanentSheetId);
    
    // Stocker l'ID du Google Sheets permanent
    setPermanentSheetId(permanentSheetId);
    
    // Ouvrir et lire les donnees
    const spreadsheet = SpreadsheetApp.openById(permanentSheetId);
    const sheet = spreadsheet.getSheets()[0];
    
    if (!sheet) {
      throw new Error("Aucune feuille trouvee dans le fichier XLSX");
    }
    
    const data = sheet.getDataRange().getValues();
    console.log("Nombre total de lignes extraites:", data.length);

    if (data.length < 12) {
      throw new Error("Le fichier XLSX doit contenir au moins 12 lignes");
    }

    // Sanitize data before processing
    const sanitizedData = sanitizeData(data);

    // Extract department (C5), projectCode (J5), and requesterEmail (J6)
    var department = sanitizedData[4]?.[2] || "";      // Ligne 5, colonne 3 → C5
    var projectCode = sanitizedData[4]?.[9] || "";     // Ligne 5, colonne 10 → J5
    var requesterEmail = sanitizedData[5]?.[9] || "";  // Ligne 6, colonne 10 → J6
    
    console.log("Extracted department:", department);
    console.log("Extracted projectCode:", projectCode);
    console.log("Extracted requesterEmail:", requesterEmail);

    // Sauvegarder les 11 premieres lignes avec PropertiesService
    const headerLines = sanitizedData.slice(0, 11);
    setHeaderLinesCache(headerLines);
    
    // Compteurs pour les lignes valides et ignorees
    var validRows = 0;
    var skippedRows = 0;
    
    // Traitement TOUTES les lignes apres la ligne 11 (pas d'arret)
    var processedData = [];
    
    for (let i = 11; i < sanitizedData.length; i++) {
      const row = sanitizedData[i];
      console.log("Traitement ligne", i + 1, ":", row);
      
      // Verifie si A à L sont vides ou espaces
      const isEmpty = row.slice(0, 12).every(cell => !cell || cell.toString().trim() === '');
      
      if (isEmpty) {
        console.log("Ligne ignoree (colonnes A-L vides) :", row);
        skippedRows++;
        // Continue à traiter les lignes suivantes (pas de break)
        continue;
      }
      
      if (row.length >= 14) {
        // Champs requis dans une ligne
        if (!row[3] || !row[6] || !row[7] || !row[8] || !row[9] || !row[10] || !row[11] || !row[12] || !row[13]) {
          console.log("Ligne ignoree car un champ est vide :", row);
          skippedRows++;
          continue; // Continue au lieu de return null
        }
        
        // Amelioration du parsing des IPs pour gerer virgules ET retours à la ligne
        var sourceIPs = (row[3] || '')
          .split(/[\n,]+/)
          .map(ip => ip.trim())
          .filter(ip => ip);
          
        var destIPs = (row[6] || '')
          .split(/[\n,]+/)
          .map(ip => ip.trim())
          .filter(ip => ip);
          
        var combinations = [];

        if (sourceIPs.length === 0) sourceIPs = [''];
        if (destIPs.length === 0) destIPs = [''];

        sourceIPs.forEach(function(srcIP) {
          destIPs.forEach(function(dstIP) {
            combinations.push({
              sourceIP: srcIP,
              destIP: dstIP,
              protocol: row[7] || 'TCP',
              service: row[8] || '',
              port: row[9] || '',
              authentication: row[10]?.toLowerCase() === 'yes' ? 'Yes' : 'No',
              flowEncryption: row[11]?.toLowerCase() === 'yes' ? 'Yes' : 'No',
              classification: row[12]?.toLowerCase() === 'yellow' ? 'Yellow' : 
                            row[12]?.toLowerCase() === 'amber' ? 'Amber' : 
                            row[12]?.toLowerCase() === 'red' ? 'Red' : 'Yellow',
              appCode: row[13] || ''
            });
          });
        });

        console.log("Nombre de combinaisons generees:", combinations.length);
        validRows += combinations.length;
        processedData.push(...combinations);
      } else {
        console.log("Ligne ignoree - pas assez de colonnes");
        skippedRows++;
      }
    }

    console.log("Nombre total de lignes apres traitement:", processedData.length);
    
    if (processedData.length === 0) {
      throw new Error("Aucune donnee valide trouvee dans le XLSX");
    }

    return { 
      success: true, 
      data: processedData,
      headerLines: headerLines,
      message: validRows + " lignes valides importees, " + skippedRows + " lignes ignorees (champs manquants ou colonnes A-L vides)",
      department: department,
      projectCode: projectCode,
      requesterEmail: requesterEmail,
      permanentSheetId: permanentSheetId,
      permanentSheetUrl: spreadsheet.getUrl()
    };
  } catch(e) {
    console.error("Erreur lors de l'import XLSX:", e.toString());
    return { 
      success: false, 
      message: "Erreur lors de l'import XLSX: " + e.toString() 
    };
  }
}

// New function to generate Python scripts for network rules
function generatePythonScripts(data) {
  try {
    console.log("generatePythonScripts called with data:", JSON.stringify(data));
    
    const csvRows = data.csvRows || [];
    const username = data.username || '';
    const password = data.password || '';
    
    if (csvRows.length === 0) {
      return {
        success: false,
        message: "Aucune donnee à traiter"
      };
    }
    
    if (!username || !password) {
      return {
        success: false,
        message: "Identifiants manquants"
      };
    }
    
    const scripts = [];
    
    csvRows.forEach((row, index) => {
      // Handle multiple IPs in source and destination
      const sourceIPs = row.sourceIP.split('\n').filter(ip => ip.trim());
      const destIPs = row.destIP.split('\n').filter(ip => ip.trim());
      
      sourceIPs.forEach(srcIP => {
        destIPs.forEach(dstIP => {
          const servicePort = `${row.protocol.toLowerCase()}:${row.port}`;
          
          const script = `import requests
import sys
import xml.etree.ElementTree as ET
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_URL = "${API_URL}"
USERNAME = "${username}"
PASSWORD = "${password}"

def search_tickets(params):
    """
    Envoie une requete à l'API et retourne le contenu de la reponse.
    """
    try:
        response = requests.get(API_URL, params=params, verify=False, auth=(USERNAME, PASSWORD))
        response.raise_for_status()
        content = response.content
        return content
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la requete : {e}")
        return None

def is_traffic_allowed(xml_content):
    """
    Parse le contenu XML et verifie si le trafic est autorise.
    Retourne True si 'traffic_allowed' est 'true', False sinon, ou None en cas d'erreur.
    """
    if xml_content is None:
        return None
    try:
        root = ET.fromstring(xml_content.decode('utf-8'))
        traffic_allowed_element = root.find('traffic_allowed')
        if traffic_allowed_element is not None:
            return traffic_allowed_element.text.lower() == 'true'
        else:
            return False
    except ET.ParseError as e:
        print(f"Erreur de parsing XML : {e}")
        return None
    except Exception as e:
        print(f"Une erreur inattendue est survenue lors du parsing : {e}")
        return None

def main():
    # Definition des parametres de la requete
    src_ip = "${srcIP.trim()}"
    dst_ip = "${dstIP.trim()}"
    service_port = "${servicePort}"
    params = {'dst': dst_ip, 'src': src_ip, 'service': service_port}
    
    xml_response_content = search_tickets(params)
    allowed = is_traffic_allowed(xml_response_content)
    
    print("\\n--- Resultat du Trafic ---")
    if allowed is True:
        print(f"Trafic AUTORISe de {src_ip} vers {dst_ip} avec le service {service_port}.")
    elif allowed is False:
        print(f"Trafic REFUSe de {src_ip} vers {dst_ip} avec le service {service_port}.")
    else:
        print(f"Impossible de determiner si le trafic est autorise pour {src_ip} vers {dst_ip} avec le service {service_port} (erreur ou information manquante).")

if __name__ == "__main__":
    main()`;
          
          scripts.push({
            script: script,
            sourceIP: srcIP.trim(),
            destIP: dstIP.trim(),
            service: servicePort
          });
        });
      });
    });
    
    return {
      success: true,
      data: scripts,
      message: scripts.length + " script(s) Python genere(s) avec succes"
    };
  } catch (e) {
    console.error("Erreur generatePythonScripts:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la generation des scripts: " + e.toString()
    };
  }
}

// New function to generate NES test script
function generateNESTestScript(data) {
  try {
    console.log("generateNESTestScript called with data:", JSON.stringify(data));
    
    const csvRows = data.csvRows || [];
    const username = data.username || '';
    const password = data.password || '';
    
    if (csvRows.length === 0) {
      return {
        success: false,
        message: "Aucune donnee à traiter"
      };
    }
    
    if (!username || !password) {
      return {
        success: false,
        message: "Identifiants manquants"
      };
    }
    
    // Collect all test cases
    const testCases = [];
    
    csvRows.forEach((row) => {
      // Handle multiple IPs in source and destination
      const sourceIPs = row.sourceIP.split('\n').filter(ip => ip.trim());
      const destIPs = row.destIP.split('\n').filter(ip => ip.trim());
      
      sourceIPs.forEach(srcIP => {
        destIPs.forEach(dstIP => {
          const servicePort = `${row.protocol.toLowerCase()}:${row.port}`;
          testCases.push({
            src: srcIP.trim(),
            dst: dstIP.trim(),
            service: servicePort
          });
        });
      });
    });
    
    // Generate test cases string
    const testCasesString = testCases.map(tc => 
      `        {'src': "${tc.src}", 'dst': "${tc.dst}", 'service': "${tc.service}"},`
    ).join('\n');
    
    // Generate the complete test script
    const testScript = `import requests
import sys
import xml.etree.ElementTree as ET
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_URL = "${API_URL}"
USERNAME = "${username}"
PASSWORD = "${password}"

def search_tickets(params):
    """
    Envoie une requete à l'API et retourne le contenu de la reponse.
    """
    try:
        response = requests.get(API_URL, params=params, verify=False, auth=(USERNAME, PASSWORD))
        response.raise_for_status()  # Leve une exception pour les codes d'etat HTTP d'erreur (4xx ou 5xx)
        content = response.content
        return content
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la requete pour {params.get('src')} -> {params.get('dst')} sur {params.get('service')} : {e}")
        return None

def is_traffic_allowed(xml_content):
    """
    Parse le contenu XML et verifie si le trafic est autorise.
    Retourne True si 'traffic_allowed' est 'true', False sinon, ou None en cas d'erreur.
    """
    if xml_content is None:
        return None
    try:
        root = ET.fromstring(xml_content.decode('utf-8'))
        traffic_allowed_element = root.find('traffic_allowed')
        if traffic_allowed_element is not None:
            return traffic_allowed_element.text.lower() == 'true'
        else:
            return False
    except ET.ParseError as e:
        print(f"Erreur de parsing XML : {e}")
        return None
    except Exception as e:
        print(f"Une erreur inattendue est survenue lors du parsing : {e}")
        return None

def main():
    # Definition des differentes combinaisons de trafic à tester
    # Chaque dictionnaire represente un jeu de parametres pour une requete
    test_cases = [
${testCasesString}
    ]
    
    print("--- Debut des tests de trafic NES ---")
    print(f"Nombre total de tests à effectuer: {len(test_cases)}")
    
    # Compteurs pour les statistiques
    allowed_count = 0
    refused_count = 0
    error_count = 0
    
    # Boucle sur chaque cas de test defini
    for i, test_case in enumerate(test_cases):
        src_ip = test_case['src']
        dst_ip = test_case['dst']
        service_port = test_case['service']
        
        print(f"\\n--- Test #{i+1}/{len(test_cases)}: {src_ip} -> {dst_ip} sur {service_port} ---")
        
        # Execute la requete pour le cas de test actuel
        xml_response_content = search_tickets(test_case)
        
        # Verifie si le trafic est autorise
        allowed = is_traffic_allowed(xml_response_content)
        
        # Affiche le resultat et met à jour les compteurs
        if allowed is True:
            print(f"✅ Trafic AUTORISe de {src_ip} vers {dst_ip} avec le service {service_port}.")
            allowed_count += 1
        elif allowed is False:
            print(f"❌ Trafic REFUSe de {src_ip} vers {dst_ip} avec le service {service_port}.")
            refused_count += 1
        else:
            print(f"⚠️  Impossible de determiner si le trafic est autorise pour {src_ip} vers {dst_ip} avec le service {service_port} (erreur ou information manquante).")
            error_count += 1
    
    # Affiche le resume des tests
    print("\\n" + "="*60)
    print("=== ReSUMe DES TESTS NES ===")
    print("="*60)
    print(f"Total des tests effectues : {len(test_cases)}")
    print(f"✅ Trafics autorises      : {allowed_count}")
    print(f"❌ Trafics refuses        : {refused_count}")
    print(f"⚠️  Erreurs/Indetermines  : {error_count}")
    print("="*60)

if __name__ == "__main__":
    main()`;
    
    return {
      success: true,
      script: testScript,
      testCasesCount: testCases.length,
      message: `Script de test NES genere avec succes (${testCases.length} cas de test)`
    };
  } catch (e) {
    console.error("Erreur generateNESTestScript:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la generation du script de test NES: " + e.toString()
    };
  }
}

// Function to save the Network Equipment Sheet by updating the permanent Google Sheets
function saveNES(formData) {
  try {
    console.log("saveNES called with data:", JSON.stringify(formData));
    
    if (!formData.department || !formData.projectCode || !formData.email || !formData.rules || formData.rules.length === 0) {
      return {
        success: false,
        message: "Donnees incompletes"
      };
    }
    
    // Recuperer l'ID du Google Sheets permanent
    const permanentSheetId = getPermanentSheetId();
    
    if (!permanentSheetId) {
      return {
        success: false,
        message: "Aucun Google Sheets permanent trouve. Veuillez d'abord importer un fichier XLSX."
      };
    }
    
    console.log("✅ Utilisation du Google Sheets permanent - ID:", permanentSheetId);
    
    // Ouvrir le Google Sheets permanent existant
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(permanentSheetId);
    } catch (e) {
      console.error("Erreur lors de l'ouverture du Google Sheets permanent:", e.toString());
      return {
        success: false,
        message: "Impossible d'ouvrir le Google Sheets permanent. Il a peut-etre ete supprime."
      };
    }
    
    const sheet = spreadsheet.getActiveSheet();
    
    // Mettre à jour les metadonnees dans les en-tetes (C5, J5, J6)
    sheet.getRange(5, 3).setValue(formData.department);  // C5
    sheet.getRange(5, 10).setValue(formData.projectCode); // J5
    sheet.getRange(6, 10).setValue(formData.email);       // J6
    
    console.log("✅ Metadonnees mises à jour:", {
      department: formData.department,
      projectCode: formData.projectCode,
      email: formData.email
    });
    
    // Effacer toutes les lignes apres la ligne 11
    const lastRow = sheet.getLastRow();
    if (lastRow > 11) {
      const rangeToDelete = sheet.getRange(12, 1, lastRow - 11, sheet.getLastColumn());
      rangeToDelete.clear();
      console.log("✅ Lignes apres la ligne 11 effacees (lignes 12 à " + lastRow + ")");
    }
    
    // Ajouter les nouvelles regles à partir de la ligne 12
    let rowIndex = 12;
    formData.rules.forEach(rule => {
      // Handle multiple IPs by splitting and creating separate rows for each combination
      const sourceIPs = rule.sourceIP.split('\n').filter(ip => ip.trim());
      const destIPs = rule.destIP.split('\n').filter(ip => ip.trim());
      
      sourceIPs.forEach(srcIP => {
        destIPs.forEach(dstIP => {
          const rowData = [
            '', '', '', srcIP.trim(), '', '', dstIP.trim(), rule.protocol,
            rule.service, rule.port, rule.authentication, rule.flowEncryption,
            rule.classification, rule.appCode
          ];
          
          sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
          rowIndex++;
        });
      });
    });
    
    console.log("✅ Nouvelles regles ajoutees:", formData.rules.length, "regles, lignes creees:", rowIndex - 12);
    
    const spreadsheetUrl = spreadsheet.getUrl();
    
    console.log("✅ NES mis à jour avec succes dans le Google Sheets permanent - URL:", spreadsheetUrl);
    
    // Retourner l'URL pour ouvrir le Google Sheets
    return {
      success: true,
      url: spreadsheetUrl,
      spreadsheetId: permanentSheetId,
      message: "NES mis à jour avec succes dans le Google Sheets permanent"
    };
  } catch (e) {
    console.error("Erreur saveNES:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la mise à jour du NES: " + e.toString()
    };
  }
}

// Function to delete form data
function deleteForm() {
  try {
    console.log("deleteForm called - clearing all data");
    
    // Clear the permanent sheet ID and header lines cache
    const props = PropertiesService.getUserProperties();
    props.deleteProperty("permanentSheetId");
    props.deleteProperty("headerLinesCache");
    
    console.log("Form data cleared successfully");
    
    return {
      success: true,
      message: "Formulaire supprime avec succes"
    };
  } catch (e) {
    console.error("Error deleting form:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la suppression du formulaire: " + e.toString()
    };
  }
}
