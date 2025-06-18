
function doGet() {
  console.log("doGet called");
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Variable configurable pour l'URL de l'API
var API_URL = "https://your-api-endpoint.com/api";

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
      message: "Aucun fichier sélectionné" 
    };
  }
  
  return importXLSX(base64Data, fileName);
}

function importXLSX(base64Data, fileName) {
  console.log("importXLSX called with file:", fileName);
  try {
    console.log("Début de l'import XLSX");
    
    // Validation format .xlsx uniquement
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      return { 
        success: false, 
        message: "❌ ERREUR: Seuls les fichiers .xlsx sont acceptés." 
      };
    }

    // Convert Base64 data back to blob
    const base64Content = base64Data.split(',')[1]; // Remove data:application/... part
    const binaryData = Utilities.base64Decode(base64Content);
    const fileBlob = Utilities.newBlob(binaryData, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName);
    
    // Créer le Google Sheets PERMANENT (pas temporaire)
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const convertedFile = Drive.Files.insert({
      title: `XLSX_Import_${timestamp}`,
      mimeType: 'application/vnd.google-apps.spreadsheet'
    }, fileBlob);
    
    const permanentSheetId = convertedFile.id;
    console.log("✅ Google Sheets PERMANENT créé - ID:", permanentSheetId);
    
    // Stocker l'ID du Google Sheets permanent
    setPermanentSheetId(permanentSheetId);
    
    // Ouvrir et lire les données
    const spreadsheet = SpreadsheetApp.openById(permanentSheetId);
    const sheet = spreadsheet.getSheets()[0];
    
    if (!sheet) {
      throw new Error("Aucune feuille trouvée dans le fichier XLSX");
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

    // Sauvegarder les 11 premières lignes avec PropertiesService
    const headerLines = sanitizedData.slice(0, 11);
    setHeaderLinesCache(headerLines);
    
    // Compteurs pour les lignes valides et ignorées
    var validRows = 0;
    var skippedRows = 0;
    
    // Traitement TOUTES les lignes après la ligne 11 (pas d'arrêt)
    var processedData = [];
    
    for (let i = 11; i < sanitizedData.length; i++) {
      const row = sanitizedData[i];
      console.log("Traitement ligne", i + 1, ":", row);
      
      // Vérifie si A à L sont vides ou espaces
      const isEmpty = row.slice(0, 12).every(cell => !cell || cell.toString().trim() === '');
      
      if (isEmpty) {
        console.log("Ligne ignorée (colonnes A-L vides) :", row);
        skippedRows++;
        // Continue à traiter les lignes suivantes (pas de break)
        continue;
      }
      
      if (row.length >= 14) {
        // Champs requis dans une ligne
        if (!row[3] || !row[6] || !row[7] || !row[8] || !row[9] || !row[10] || !row[11] || !row[12] || !row[13]) {
          console.log("Ligne ignorée car un champ est vide :", row);
          skippedRows++;
          continue; // Continue au lieu de return null
        }
        
        // Amélioration du parsing des IPs pour gérer virgules ET retours à la ligne
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

        console.log("Nombre de combinaisons générées:", combinations.length);
        validRows += combinations.length;
        processedData.push(...combinations);
      } else {
        console.log("Ligne ignorée - pas assez de colonnes");
        skippedRows++;
      }
    }

    console.log("Nombre total de lignes après traitement:", processedData.length);
    
    if (processedData.length === 0) {
      throw new Error("Aucune donnée valide trouvée dans le XLSX");
    }

    return { 
      success: true, 
      data: processedData,
      headerLines: headerLines,
      message: validRows + " lignes valides importées, " + skippedRows + " lignes ignorées (champs manquants ou colonnes A-L vides)",
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

// Function to generate Python scripts with authentication
function generatePythonScripts(options) {
  try {
    console.log("generatePythonScripts called with options:", JSON.stringify(options));
    
    const csvRows = options.csvRows || [];
    const username = options.username || "";
    const password = options.password || "";
    
    if (csvRows.length === 0) {
      return {
        success: false,
        message: "Aucune donnée à traiter"
      };
    }
    
    if (!username || !password) {
      return {
        success: false,
        message: "Username et password requis"
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
          
          const pythonScript = `import requests
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
    Envoie une requête à l'API et retourne le contenu de la réponse.
    """
    try:
        response = requests.get(API_URL, params=params, verify=False, auth=(USERNAME, PASSWORD))
        response.raise_for_status() # Lève une exception pour les codes d'état HTTP d'erreur (4xx ou 5xx)
        content = response.content
        return content
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la requête : {e}")
        return None

def is_traffic_allowed(xml_content):
    """
    Parse le contenu XML et vérifie si le trafic est autorisé.
    Retourne True si 'traffic_allowed' est 'true', False sinon, ou None en cas d'erreur.
    """
    if xml_content is None:
        # print("Contenu XML vide. Impossible de vérifier le trafic.") # Décommenter si tu veux voir ce message en cas de None
        return None

    try:
        root = ET.fromstring(xml_content.decode('utf-8'))
        traffic_allowed_element = root.find('traffic_allowed')

        if traffic_allowed_element is not None:
            return traffic_allowed_element.text.lower() == 'true'
        else:
            # print("Balise <traffic_allowed> non trouvée dans la réponse XML.") # Décommenter si tu veux voir ce message
            return False
    except ET.ParseError as e:
        print(f"Erreur de parsing XML : {e}")
        return None
    except Exception as e:
        print(f"Une erreur inattendue est survenue lors du parsing : {e}")
        return None

def main():
    # Définition des paramètres de la requête
    src_ip = "${srcIP.trim().split('/')[0]}"
    dst_ip = "${dstIP.trim()}"
    service_port = "${servicePort}"

    params = {'dst': dst_ip, 'src': src_ip, 'service': service_port}
    xml_response_content = search_tickets(params)

    allowed = is_traffic_allowed(xml_response_content)

    print("\\n--- Résultat du Trafic ---")
    if allowed is True:
        print(f"Trafic AUTORISÉ de {src_ip} vers {dst_ip} avec le service {service_port}.")
    elif allowed is False:
        print(f"Trafic REFUSÉ de {src_ip} vers {dst_ip} avec le service {service_port}.")
    else:
        print(f"Impossible de déterminer si le trafic est autorisé pour {src_ip} vers {dst_ip} avec le service {service_port} (erreur ou information manquante).")

if __name__ == "__main__":
    main()`;
          
          scripts.push(pythonScript);
        });
      });
    });
    
    return {
      success: true,
      data: scripts,
      message: scripts.length + " script(s) Python généré(s) avec succès"
    };
  } catch (e) {
    console.error("Erreur generatePythonScripts:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la génération des scripts Python: " + e.toString()
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
        message: "Données incomplètes"
      };
    }
    
    // Récupérer l'ID du Google Sheets permanent
    const permanentSheetId = getPermanentSheetId();
    
    if (!permanentSheetId) {
      return {
        success: false,
        message: "Aucun Google Sheets permanent trouvé. Veuillez d'abord importer un fichier XLSX."
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
        message: "Impossible d'ouvrir le Google Sheets permanent. Il a peut-être été supprimé."
      };
    }
    
    const sheet = spreadsheet.getActiveSheet();
    
    // Mettre à jour les métadonnées dans les en-têtes (C5, J5, J6)
    sheet.getRange(5, 3).setValue(formData.department);  // C5
    sheet.getRange(5, 10).setValue(formData.projectCode); // J5
    sheet.getRange(6, 10).setValue(formData.email);       // J6
    
    console.log("✅ Métadonnées mises à jour:", {
      department: formData.department,
      projectCode: formData.projectCode,
      email: formData.email
    });
    
    // Effacer toutes les lignes après la ligne 11
    const lastRow = sheet.getLastRow();
    if (lastRow > 11) {
      const rangeToDelete = sheet.getRange(12, 1, lastRow - 11, sheet.getLastColumn());
      rangeToDelete.clear();
      console.log("✅ Lignes après la ligne 11 effacées (lignes 12 à " + lastRow + ")");
    }
    
    // Ajouter les nouvelles règles à partir de la ligne 12
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
    
    console.log("✅ Nouvelles règles ajoutées:", formData.rules.length, "règles, lignes créées:", rowIndex - 12);
    
    const spreadsheetUrl = spreadsheet.getUrl();
    
    console.log("✅ NES mis à jour avec succès dans le Google Sheets permanent - URL:", spreadsheetUrl);
    
    // Retourner l'URL pour ouvrir le Google Sheets
    return {
      success: true,
      url: spreadsheetUrl,
      spreadsheetId: permanentSheetId,
      message: "NES mis à jour avec succès dans le Google Sheets permanent"
    };
  } catch (e) {
    console.error("Erreur saveNES:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la mise à jour du NES: " + e.toString()
    };
  }
}

// Function to delete form data (missing function)
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
      message: "Formulaire supprimé avec succès"
    };
  } catch (e) {
    console.error("Error deleting form:", e.toString());
    return {
      success: false,
      message: "Erreur lors de la suppression du formulaire: " + e.toString()
    };
  }
}

// Function to show credentials dialog message
function showCredentialsDialog() {
  return {
    success: true,
    message: "Please enter your credentials TA-I0034"
  };
}
