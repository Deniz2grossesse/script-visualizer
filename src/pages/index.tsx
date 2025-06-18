import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, FileCode, AlertTriangle, Check, X, Upload, Trash2, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FieldError {
  error: boolean;
  message: string;
}

interface FormErrors {
  email: FieldError;
  department: FieldError;
  projectCode: FieldError;
}

interface CSVRow {
  sourceIP: string;
  destIP: string;
  protocol: string;
  service: string;
  port: string;
  authentication: string;
  flowEncryption: string;
  classification: string;
  appCode: string;
  isValid?: boolean;
  errors?: string[];
}

const Index = () => {
  console.log('Index component rendered');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatedScripts, setGeneratedScripts] = useState<{ id: number; script: string }[]>([]);
  const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
  
  // États pour les métadonnées
  const [department, setDepartment] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [email, setEmail] = useState('');
  
  // Flag pour vérifier qu'un fichier XLSX a été importé
  const [dataHasBeenImported, setDataHasBeenImported] = useState(false);
  
  // État pour stocker l'URL du Google Sheets permanent
  const [permanentSheetUrl, setPermanentSheetUrl] = useState('');
  
  const [errors, setErrors] = useState<FormErrors>({
    email: { error: false, message: '' },
    department: { error: false, message: '' },
    projectCode: { error: false, message: '' },
  });

  useEffect(() => {
    console.log('Index component mounted');
  }, []);

  const validateEmail = (email: string): boolean => {
    console.log('validateEmail called with:', email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setErrors(prev => ({
      ...prev,
      email: {
        error: !isValid,
        message: isValid ? '' : 'Veuillez entrer un email valide'
      }
    }));
    return isValid;
  };

  const validateDepartment = (value: string): boolean => {
    const isValid = value.length >= 1 && value.length <= 4;
    setErrors(prev => ({
      ...prev,
      department: {
        error: !isValid,
        message: isValid ? '' : 'Entre 1 et 4 caractères requis'
      }
    }));
    return isValid;
  };

  const validateProjectCode = (value: string): boolean => {
    const isValid = value.length >= 1 && value.length <= 4;
    setErrors(prev => ({
      ...prev,
      projectCode: {
        error: !isValid,
        message: isValid ? '' : 'Entre 1 et 4 caractères requis'
      }
    }));
    return isValid;
  };

  const validateIP = (ip: string): boolean => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(ip) && ip.split('.').every(num => parseInt(num) >= 0 && parseInt(num) <= 255);
  };

  const validatePort = (port: string): boolean => {
    const portNum = parseInt(port);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  };

  const validateRow = (row: CSVRow): { isValid: boolean; errors: string[] } => {
    console.log('validateRow called with:', row);
    const errors: string[] = [];
    
    if (!validateIP(row.sourceIP)) {
      errors.push("IP source invalide");
    }
    if (!validateIP(row.destIP)) {
      errors.push("IP destination invalide");
    }
    if (!validatePort(row.port)) {
      errors.push("Port invalide");
    }
    if (!['tcp', 'udp', 'icmp'].includes(row.protocol.toLowerCase())) {
      errors.push("Protocole invalide");
    }
    if (!['yes', 'no'].includes(row.authentication.toLowerCase())) {
      errors.push("Authentication doit être 'yes' ou 'no'");
    }
    if (!['yes', 'no'].includes(row.flowEncryption.toLowerCase())) {
      errors.push("Flow encryption doit être 'yes' ou 'no'");
    }
    if (!['yellow', 'amber', 'red'].includes(row.classification.toLowerCase())) {
      errors.push("Classification invalide");
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleDeleteForm = () => {
    console.log('handleDeleteForm called - confirming deletion');
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les données du formulaire ? Cette action est irréversible.')) {
      return;
    }

    google.script.run
      .withSuccessHandler((response) => {
        console.log('Response from deleteForm:', response);
        if (response.success) {
          // Réinitialiser tous les états
          setCsvRows([]);
          setGeneratedScripts([]);
          setDepartment('');
          setProjectCode('');
          setEmail('');
          setDataHasBeenImported(false);
          setPermanentSheetUrl('');
          setErrors({
            email: { error: false, message: '' },
            department: { error: false, message: '' },
            projectCode: { error: false, message: '' },
          });
          
          toast({
            title: "Formulaire supprimé",
            description: response.message || "Toutes les données ont été supprimées avec succès."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: response.message || "Erreur lors de la suppression du formulaire"
          });
        }
      })
      .withFailureHandler((error) => {
        console.error('Error in deleteForm:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Erreur lors de la suppression du formulaire"
        });
      })
      .deleteForm();
  };

  const handleFileUploadClick = () => {
    console.log('handleFileUploadClick called - user initiated action');
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileUpload called", { hasFile: !!event.target.files?.length });
    const file = event.target.files?.[0];
    
    if (!file) {
      console.log("Pas de fichier sélectionné");
      return;
    }

    console.log("Type du fichier:", file.type);
    console.log("Nom du fichier:", file.name);

    // Validation XLSX uniquement
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Seuls les fichiers .xlsx sont acceptés."
      });
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      google.script.run
        .withSuccessHandler((response) => {
          if (response.success) {
            setCsvRows(response.data);
            setDataHasBeenImported(true);
            setPermanentSheetUrl(response.permanentSheetUrl || '');
            // Mettre à jour les métadonnées depuis la réponse
            setDepartment(response.department || '');
            setProjectCode(response.projectCode || '');
            setEmail(response.requesterEmail || '');
            toast({
              title: "Import réussi",
              description: `${response.message}. Le Google Sheets permanent a été créé.`
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erreur",
              description: response.message
            });
          }
        })
        .withFailureHandler((error) => {
          console.error("Erreur lors de l'import:", error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Une erreur est survenue lors de l'import du fichier"
          });
        })
        .handleXLSXFileSelect(base64Data, file.name);
    };
    
    reader.onerror = (error) => {
      console.error("Erreur lors de la lecture du fichier:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la lecture du fichier"
      });
    };

    reader.readAsDataURL(file);
  };

  const addEmptyRow = () => {
    console.log('addEmptyRow called');
    const emptyRow: CSVRow = {
      sourceIP: '',
      destIP: '',
      protocol: '',
      service: '',
      port: '',
      authentication: '',
      flowEncryption: '',
      classification: '',
      appCode: '',
      isValid: false,
      errors: []
    };
    setCsvRows([...csvRows, emptyRow]);
  };

  const deleteRow = (index: number) => {
    console.log('deleteRow called for index:', index);
    const newRows = [...csvRows];
    newRows.splice(index, 1);
    setCsvRows(newRows);
    toast({
      title: "Ligne supprimée",
      description: "La ligne a été supprimée avec succès."
    });
  };

  const duplicateRow = (index: number) => {
    console.log('duplicateRow called for index:', index);
    const newRows = [...csvRows];
    const duplicatedRow = { ...newRows[index] };
    newRows.splice(index + 1, 0, duplicatedRow);
    setCsvRows(newRows);
    toast({
      title: "Ligne dupliquée",
      description: "La ligne a été dupliquée avec succès."
    });
  };

  const updateRow = (index: number, field: keyof CSVRow, value: string) => {
    console.log('updateRow called', { index, field, value });
    const newRows = [...csvRows];
    newRows[index] = {
      ...newRows[index],
      [field]: value
    };
    const validation = validateRow(newRows[index]);
    newRows[index].isValid = validation.isValid;
    newRows[index].errors = validation.errors;
    setCsvRows(newRows);
  };

  const handleDeleteAll = () => {
    console.log('handleDeleteAll called');
    setCsvRows([]);
    setGeneratedScripts([]);
    setDataHasBeenImported(false);
    setPermanentSheetUrl('');
    toast({
      title: "Données supprimées",
      description: "Toutes les données ont été supprimées avec succès."
    });
  };

  const handleGenerateScript = () => {
    console.log('handleGenerateScript called with csvRows:', csvRows);
    const validRows = csvRows.filter(row => {
      const validation = validateRow(row);
      return validation.isValid;
    });

    if (validRows.length === 0) {
      console.log('Aucune ligne valide trouvée');
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune ligne valide trouvée"
      });
      return;
    }

    google.script.run
      .withSuccessHandler((response) => {
        console.log('Response from generateScripts:', response);
        if (response.success) {
          setGeneratedScripts(response.data.map((script, index) => ({
            id: index + 1,
            script: script
          })));
          
          toast({
            title: "Succès",
            description: `${response.data.length} script(s) généré(s) avec succès`
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: response.message || "Erreur lors de la génération des scripts"
          });
        }
      })
      .withFailureHandler((error) => {
        console.error('Error in generateScripts:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Erreur lors de la génération des scripts"
        });
      })
      .generateScripts({ csvRows: validRows });
  };

  const handleSaveNES = () => {
    console.log('handleSaveNES called - validating fields and data');
    
    // Vérifier qu'un fichier XLSX a été importé
    if (!dataHasBeenImported) {
      toast({
        variant: "destructive",
        title: "Import requis",
        description: "Veuillez d'abord importer un fichier XLSX avant de sauvegarder."
      });
      return;
    }
    
    // Validation des champs obligatoires
    const isDepartmentValid = validateDepartment(department);
    const isProjectCodeValid = validateProjectCode(projectCode);
    const isEmailValid = validateEmail(email);
    
    if (!isDepartmentValid || !isProjectCodeValid || !isEmailValid) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "Veuillez remplir correctement tous les champs obligatoires (Department, Project Code, et Email)."
      });
      return;
    }
    
    if (csvRows.length === 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune ligne à sauvegarder. Veuillez ajouter des données."
      });
      return;
    }

    console.log('Calling saveNES with:', { department, projectCode, email, rules: csvRows });

    google.script.run
      .withSuccessHandler((response) => {
        console.log('Response from saveNES:', response);
        if (response.success) {
          // Ouvrir le Google Sheets dans une nouvelle fenêtre
          window.open(response.url, '_blank');
          toast({
            title: "Succès",
            description: `${response.message}. Le Google Sheets s'ouvre dans une nouvelle fenêtre.`
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: response.message || "Erreur lors de la sauvegarde du NES"
          });
        }
      })
      .withFailureHandler((error) => {
        console.error('Error in saveNES:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Erreur lors de la sauvegarde du NES"
        });
      })
      .saveNES({
        department: department,
        projectCode: projectCode,
        email: email,
        rules: csvRows
      });
  };

  return (
    <div className="min-h-screen bg-[#212121] text-[#BDC3C7] font-sans p-6">
      <div className="w-[1200px] mx-auto bg-[#34495E] rounded-lg p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">One Click Onboarding</h1>
        
        <div className="bg-[#2C3E50] border border-[#BDC3C7]/30 rounded-lg p-4 mb-8">
          <AlertTriangle className="inline-block w-5 h-5 mr-2 text-[#E67E22]" />
          <span className="text-[#BDC3C7]">These three fields are mandatory, you cannot start entering them without having filled them in.</span>
        </div>

        {permanentSheetUrl && (
          <div className="bg-[#2C3E50] border border-green-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Google Sheets permanent créé</span>
            </div>
            <p className="text-[#BDC3C7] mb-3">
              Votre fichier XLSX a été importé dans un Google Sheets permanent. Vous pouvez le consulter à tout moment.
            </p>
            <Button
              onClick={() => window.open(permanentSheetUrl, '_blank')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir le Google Sheets
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-4 mb-6">
          <Button 
            onClick={addEmptyRow}
            className="flex items-center gap-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </Button>
          <Button
            onClick={handleFileUploadClick}
            className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#D35400] text-white"
          >
            <Upload className="w-4 h-4" />
            Importer XLSX
          </Button>
          <Button
            onClick={handleSaveNES}
            className="flex items-center gap-2 bg-[#27ae60] hover:bg-[#219a52] text-white"
          >
            <FileCode className="w-4 h-4" />
            Save NES
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="grid gap-6 max-w-sm mb-10">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Department <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input 
                value={department}
                placeholder="Department (1-4 chars)" 
                maxLength={4}
                className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-white/50 pr-10 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
                onChange={(e) => {
                  setDepartment(e.target.value);
                  validateDepartment(e.target.value);
                }}
              />
              {errors.department.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : department && !errors.department.error ? (
                <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
              ) : null}
            </div>
            {errors.department.error && (
              <p className="text-destructive text-sm mt-1">{errors.department.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Project/Application Code <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input 
                value={projectCode}
                placeholder="Project code (1-4 chars)" 
                maxLength={4}
                className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-[#BDC3C7]/50 pr-10 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
                onChange={(e) => {
                  setProjectCode(e.target.value);
                  validateProjectCode(e.target.value);
                }}
              />
              {errors.projectCode.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : projectCode && !errors.projectCode.error ? (
                <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
              ) : null}
            </div>
            {errors.projectCode.error && (
              <p className="text-destructive text-sm mt-1">{errors.projectCode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Requester's Email <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input 
                value={email}
                type="email" 
                placeholder="Email address"
                className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-[#BDC3C7]/50 pr-10 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
              />
              {errors.email.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : email && !errors.email.error ? (
                <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
              ) : null}
            </div>
            {errors.email.error && (
              <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        {csvRows.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#2C3E50] text-white">
                  <th className="p-2 text-left">Source IP</th>
                  <th className="p-2 text-left">IP Destination</th>
                  <th className="p-2 text-left">Protocole</th>
                  <th className="p-2 text-left">Service</th>
                  <th className="p-2 text-left">Port</th>
                  <th className="p-2 text-left">Authentication</th>
                  <th className="p-2 text-left">Flow Encryption</th>
                  <th className="p-2 text-left">Classification</th>
                  <th className="p-2 text-left">APP Code</th>
                  <th className="p-2 text-right">Manage ligne</th>
                </tr>
              </thead>
              <tbody>
                {csvRows.map((row, index) => (
                  <tr key={index} className={`border-b border-[#2C3E50] hover:bg-[#2C3E50]/50 ${!row.isValid ? 'bg-red-900/20' : ''}`}>
                    <td className="p-2">
                      <Input
                        value={row.sourceIP}
                        onChange={(e) => updateRow(index, 'sourceIP', e.target.value)}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8 w-ip"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.destIP}
                        onChange={(e) => updateRow(index, 'destIP', e.target.value)}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8 w-ip"
                      />
                    </td>
                    <td className="p-2">
                      <Select value={row.protocol} onValueChange={(value) => updateRow(index, 'protocol', value)}>
                        <SelectTrigger className="h-8 w-protocol">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tcp">TCP</SelectItem>
                          <SelectItem value="udp">UDP</SelectItem>
                          <SelectItem value="icmp">ICMP</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.service}
                        onChange={(e) => updateRow(index, 'service', e.target.value)}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8 w-service"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.port}
                        onChange={(e) => updateRow(index, 'port', e.target.value)}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8 w-port"
                      />
                    </td>
                    <td className="p-2">
                      <Select value={row.authentication} onValueChange={(value) => updateRow(index, 'authentication', value)}>
                        <SelectTrigger className="h-8 w-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">YES</SelectItem>
                          <SelectItem value="no">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select value={row.flowEncryption} onValueChange={(value) => updateRow(index, 'flowEncryption', value)}>
                        <SelectTrigger className="h-8 w-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">YES</SelectItem>
                          <SelectItem value="no">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select value={row.classification} onValueChange={(value) => updateRow(index, 'classification', value)}>
                        <SelectTrigger className="h-8 w-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yellow">YELLOW</SelectItem>
                          <SelectItem value="amber">AMBER</SelectItem>
                          <SelectItem value="red">RED</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.appCode}
                        onChange={(e) => updateRow(index, 'appCode', e.target.value)}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8 w-appcode"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end items-center space-x-1">
                        <button 
                          className="h-8 w-8 p-0 flex items-center justify-center text-[#3498db] hover:bg-[#3498db]/20 rounded-md"
                          onClick={() => duplicateRow(index)}
                          title="Duplicate row"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#3498db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                        <Button
                          variant="ghost"
                          onClick={() => deleteRow(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {csvRows.some(row => !row.isValid) && (
              <div className="mt-4 p-4 bg-red-900/20 rounded-md">
                <h3 className="text-red-500 font-semibold mb-2">Erreurs de validation :</h3>
                <ul className="list-disc list-inside space-y-1">
                  {csvRows.map((row, index) => 
                    row.errors && row.errors.length > 0 && (
                      <li key={index} className="text-red-400">
                        Ligne {index + 1}: {row.errors.join(', ')}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button 
            onClick={handleDeleteForm}
            variant="outline" 
            className="text-[#E74C3C] hover:bg-[#E74C3C]/20 border-[#E74C3C] transition-colors"
          >
            Delete
          </Button>
          <Button 
            variant="outline"
            className="text-[#BDC3C7] hover:bg-white/20 border-[#BDC3C7]/30 transition-colors"
          >
            Resume Draft
          </Button>
          <Button 
            variant="outline"
            className="text-[#E67E22] hover:bg-[#E67E22]/20 border-[#E67E22] transition-colors"
          >
            Verify
          </Button>
          <Button 
            onClick={handleGenerateScript}
            className="bg-[#E67E22] hover:bg-[#D35400] text-white border-none transition-colors flex items-center gap-2"
          >
            Generate Scripts
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {generatedScripts.length > 0 && (
          <div className="mt-8 bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Generated Scripts
            </h3>
            <div className="space-y-4">
              {generatedScripts.map(({ id, script }) => (
                <div key={id} className="flex items-start gap-4">
                  <div className="bg-[#2C3E50] rounded-md px-3 py-2 text-white whitespace-nowrap">
                    ID: {id}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={script}
                      readOnly
                      className="w-full h-48 p-4 rounded-md font-mono text-sm bg-[#2C3E50] border border-[#BDC3C7]/30 shadow-input focus:border-primary transition-colors text-white"
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <Button 
                        onClick={() => navigator.clipboard.writeText(script)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                      <Button 
                        onClick={() => {
                          const newScripts = generatedScripts.filter(s => s.id !== id);
                          setGeneratedScripts(newScripts);
                          toast({
                            title: "Script supprimé",
                            description: "Le script a été supprimé avec succès."
                          });
                        }}
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
