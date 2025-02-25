
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('One Click Onboarding')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

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

function importCSV(csvData) {
  try {
    var data = Utilities.parseCsv(csvData);
    if (data[0].length < 3) {
      throw new Error("Format CSV invalide");
    }
    return { success: true, data: data };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}
