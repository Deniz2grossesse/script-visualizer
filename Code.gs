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
      message: "No file selected" 
    };
  }
  
  return importXLSX(base64Data, fileName);
}

function importXLSX(base64Data, fileName) {
  console.log("importXLSX called with file:", fileName);
  try {
    console.log("Starting XLSX import");
    
    // Validation format .xlsx only
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      return { 
        success: false, 
        message: "❌ ERROR: Only .xlsx files are accepted." 
      };
    }

    // Convert Base64 data back to blob
    const base64Content = base64Data.split(',')[1]; // Remove data:application/... part
    const binaryData = Utilities.base64Decode(base64Content);
    const fileBlob = Utilities.newBlob(binaryData, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName);
    
    // Create PERMANENT Google Sheets (not temporary)
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const convertedFile = Drive.Files.insert({
      title: `XLSX_Import_${timestamp}`,
      mimeType: 'application/vnd.google-apps.spreadsheet'
    }, fileBlob);
    
    const permanentSheetId = convertedFile.id;
    console.log("✅ PERMANENT Google Sheets created - ID:", permanentSheetId);
    
    // Store permanent Google Sheets ID
    setPermanentSheetId(permanentSheetId);
    
    // Open and read data
    const spreadsheet = SpreadsheetApp.openById(permanentSheetId);
    const sheet = spreadsheet.getSheets()[0];
    
    if (!sheet) {
      throw new Error("No sheet found in XLSX file");
    }
    
    const data = sheet.getDataRange().getValues();
    console.log("Total rows extracted:", data.length);

    if (data.length < 12) {
      throw new Error("XLSX file must contain at least 12 rows");
    }

    // Sanitize data before processing
    const sanitizedData = sanitizeData(data);

    // Extract department (C5), projectCode (J5), and requesterEmail (J6)
    var department = sanitizedData[4]?.[2] || "";      // Row 5, column 3 → C5
    var projectCode = sanitizedData[4]?.[9] || "";     // Row 5, column 10 → J5
    var requesterEmail = sanitizedData[5]?.[9] || "";  // Row 6, column 10 → J6
    
    console.log("Extracted department:", department);
    console.log("Extracted projectCode:", projectCode);
    console.log("Extracted requesterEmail:", requesterEmail);

    // Save first 11 rows with PropertiesService
    const headerLines = sanitizedData.slice(0, 11);
    setHeaderLinesCache(headerLines);
    
    // Counters for valid and skipped rows
    var validRows = 0;
    var skippedRows = 0;
    
    // Process ALL rows after row 11 (no stopping)
    var processedData = [];
    
    for (let i = 11; i < sanitizedData.length; i++) {
      const row = sanitizedData[i];
      console.log("Processing row", i + 1, ":", row);
      
      // Check if A to L are empty or spaces
      const isEmpty = row.slice(0, 12).every(cell => !cell || cell.toString().trim() === '');
      
      if (isEmpty) {
        console.log("Row ignored (columns A-L empty):", row);
        skippedRows++;
        // Continue processing next rows (no break)
        continue;
      }
      
      if (row.length >= 14) {
        // Required fields in a row
        if (!row[3] || !row[6] || !row[7] || !row[8] || !row[9] || !row[10] || !row[11] || !row[12] || !row[13]) {
          console.log("Row ignored because a field is empty:", row);
          skippedRows++;
          continue; // Continue instead of return null
        }
        
        // Improved IP parsing to handle commas AND line breaks
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

        console.log("Number of combinations generated:", combinations.length);
        validRows += combinations.length;
        processedData.push(...combinations);
      } else {
        console.log("Row ignored - not enough columns");
        skippedRows++;
      }
    }

    console.log("Total rows after processing:", processedData.length);
    
    if (processedData.length === 0) {
      throw new Error("No valid data found in XLSX");
    }

    return { 
      success: true, 
      data: processedData,
      headerLines: headerLines,
      message: validRows + " valid rows imported, " + skippedRows + " rows ignored (missing fields or columns A-L empty)",
      department: department,
      projectCode: projectCode,
      requesterEmail: requesterEmail,
      permanentSheetId: permanentSheetId,
      permanentSheetUrl: spreadsheet.getUrl()
    };
  } catch(e) {
    console.error("Error during XLSX import:", e.toString());
    return { 
      success: false, 
      message: "Error during XLSX import: " + e.toString() 
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
        message: "No data to process"
      };
    }
    
    if (!username || !password) {
      return {
        success: false,
        message: "Missing credentials"
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
    Sends a request to the API and returns the response content.
    """
    try:
        response = requests.get(API_URL, params=params, verify=False, auth=(USERNAME, PASSWORD))
        response.raise_for_status()
        content = response.content
        return content
    except requests.exceptions.RequestException as e:
        print(f"Error during request: {e}")
        return None

def is_traffic_allowed(xml_content):
    """
    Parses XML content and checks if traffic is allowed.
    Returns True if 'traffic_allowed' is 'true', False otherwise, or None on error.
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
        print(f"XML parsing error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error during parsing: {e}")
        return None

def main():
    # Define request parameters
    src_ip = "${srcIP.trim()}"
    dst_ip = "${dstIP.trim()}"
    service_port = "${servicePort}"
    params = {'dst': dst_ip, 'src': src_ip, 'service': service_port}
    
    xml_response_content = search_tickets(params)
    allowed = is_traffic_allowed(xml_response_content)
    
    print("\\n--- Traffic Result ---")
    if allowed is True:
        print(f"Traffic ALLOWED from {src_ip} to {dst_ip} with service {service_port}.")
    elif allowed is False:
        print(f"Traffic DENIED from {src_ip} to {dst_ip} with service {service_port}.")
    else:
        print(f"Unable to determine if traffic is allowed from {src_ip} to {dst_ip} with service {service_port} (error or missing information).")

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
      message: scripts.length + " Python script(s) generated successfully"
    };
  } catch (e) {
    console.error("Error generatePythonScripts:", e.toString());
    return {
      success: false,
      message: "Error generating scripts: " + e.toString()
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
        message: "No data to process"
      };
    }
    
    if (!username || !password) {
      return {
        success: false,
        message: "Missing credentials"
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
    Sends a request to the API and returns the response content.
    """
    try:
        response = requests.get(API_URL, params=params, verify=False, auth=(USERNAME, PASSWORD))
        response.raise_for_status()  # Raises exception for HTTP error status codes (4xx or 5xx)
        content = response.content
        return content
    except requests.exceptions.RequestException as e:
        print(f"Error during request for {params.get('src')} -> {params.get('dst')} on {params.get('service')}: {e}")
        return None

def is_traffic_allowed(xml_content):
    """
    Parses XML content and checks if traffic is allowed.
    Returns True if 'traffic_allowed' is 'true', False otherwise, or None on error.
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
        print(f"XML parsing error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error during parsing: {e}")
        return None

def main():
    # Define different traffic combinations to test
    # Each dictionary represents a set of parameters for a request
    test_cases = [
${testCasesString}
    ]
    
    print("--- Starting NES traffic tests ---")
    print(f"Total tests to perform: {len(test_cases)}")
    
    # Counters for statistics
    allowed_count = 0
    refused_count = 0
    error_count = 0
    
    # Loop through each defined test case
    for i, test_case in enumerate(test_cases):
        src_ip = test_case['src']
        dst_ip = test_case['dst']
        service_port = test_case['service']
        
        print(f"\\n--- Test #{i+1}/{len(test_cases)}: {src_ip} -> {dst_ip} on {service_port} ---")
        
        # Execute request for current test case
        xml_response_content = search_tickets(test_case)
        
        # Check if traffic is allowed
        allowed = is_traffic_allowed(xml_response_content)
        
        # Display result and update counters
        if allowed is True:
            print(f"✅ Traffic ALLOWED from {src_ip} to {dst_ip} with service {service_port}.")
            allowed_count += 1
        elif allowed is False:
            print(f"❌ Traffic DENIED from {src_ip} to {dst_ip} with service {service_port}.")
            refused_count += 1
        else:
            print(f"⚠️  Unable to determine if traffic is allowed from {src_ip} to {dst_ip} with service {service_port} (error or missing information).")
            error_count += 1
    
    # Display test summary
    print("\\n" + "="*60)
    print("=== NES TEST SUMMARY ===")
    print("="*60)
    print(f"Total tests performed : {len(test_cases)}")
    print(f"✅ Traffic allowed    : {allowed_count}")
    print(f"❌ Traffic denied     : {refused_count}")
    print(f"⚠️  Errors/Unknown    : {error_count}")
    print("="*60)

if __name__ == "__main__":
    main()`;
    
    return {
      success: true,
      script: testScript,
      testCasesCount: testCases.length,
      message: `NES test script generated successfully (${testCases.length} test cases)`
    };
  } catch (e) {
    console.error("Error generateNESTestScript:", e.toString());
    return {
      success: false,
      message: "Error generating NES test script: " + e.toString()
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
        message: "Incomplete data"
      };
    }
    
    // Get permanent Google Sheets ID
    const permanentSheetId = getPermanentSheetId();
    
    if (!permanentSheetId) {
      return {
        success: false,
        message: "No permanent Google Sheets found. Please import an XLSX file first."
      };
    }
    
    console.log("✅ Using permanent Google Sheets - ID:", permanentSheetId);
    
    // Open existing permanent Google Sheets
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(permanentSheetId);
    } catch (e) {
      console.error("Error opening permanent Google Sheets:", e.toString());
      return {
        success: false,
        message: "Unable to open permanent Google Sheets. It may have been deleted."
      };
    }
    
    const sheet = spreadsheet.getActiveSheet();
    
    // Update metadata in headers (C5, J5, J6)
    sheet.getRange(5, 3).setValue(formData.department);  // C5
    sheet.getRange(5, 10).setValue(formData.projectCode); // J5
    sheet.getRange(6, 10).setValue(formData.email);       // J6
    
    console.log("✅ Metadata updated:", {
      department: formData.department,
      projectCode: formData.projectCode,
      email: formData.email
    });
    
    // Clear all rows after row 11
    const lastRow = sheet.getLastRow();
    if (lastRow > 11) {
      const rangeToDelete = sheet.getRange(12, 1, lastRow - 11, sheet.getLastColumn());
      rangeToDelete.clear();
      console.log("✅ Rows after row 11 cleared (rows 12 to " + lastRow + ")");
    }
    
    // Add new rules starting from row 12
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
    
    console.log("✅ New rules added:", formData.rules.length, "rules, rows created:", rowIndex - 12);
    
    const spreadsheetUrl = spreadsheet.getUrl();
    
    console.log("✅ NES successfully updated in permanent Google Sheets - URL:", spreadsheetUrl);
    
    // Return URL to open Google Sheets
    return {
      success: true,
      url: spreadsheetUrl,
      spreadsheetId: permanentSheetId,
      message: "NES successfully updated in permanent Google Sheets"
    };
  } catch (e) {
    console.error("Error saveNES:", e.toString());
    return {
      success: false,
      message: "Error updating NES: " + e.toString()
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
      message: "Form deleted successfully"
    };
  } catch (e) {
    console.error("Error deleting form:", e.toString());
    return {
      success: false,
      message: "Error deleting form: " + e.toString()
    };
  }
}
