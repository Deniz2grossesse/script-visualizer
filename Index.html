import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Network, Shield, ArrowRight, Plus, Lock, FileCode, AlertTriangle, Check, X, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FieldError {
  error: boolean;
  message: string;
}

interface FormErrors {
  email: FieldError;
  sourceIP: FieldError;
  destIP: FieldError;
  service: FieldError;
  port: FieldError;
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
  const { toast } = useToast();
  const [generatedScripts, setGeneratedScripts] = useState<{ id: number; script: string }[]>([]);
  const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
  const [currentRow, setCurrentRow] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({
    email: { error: false, message: '' },
    sourceIP: { error: false, message: '' },
    destIP: { error: false, message: '' },
    service: { error: false, message: '' },
    port: { error: false, message: '' },
    department: { error: false, message: '' },
    projectCode: { error: false, message: '' },
  });

  const validateEmail = (email: string): boolean => {
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

  const validateIP = (ip: string): boolean => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(ip) && ip.split('.').every(num => parseInt(num) >= 0 && parseInt(num) <= 255);
  };

  const validatePort = (port: string): boolean => {
    const portNum = parseInt(port);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  };

  const validateRow = (row: CSVRow): { isValid: boolean; errors: string[] } => {
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Début du handleFileUpload");
    const file = event.target.files?.[0];
    
    if (!file) {
      console.log("Pas de fichier sélectionné");
      return;
    }

    console.log("Type du fichier:", file.type);
    console.log("Nom du fichier:", file.name);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log("FileReader onload déclenché");
      const text = e.target?.result as string;
      console.log("Contenu du fichier (premiers caractères):", text.substring(0, 100));
      
      const lines = text.split('\n').slice(11); // On commence à la ligne 12
      console.log("Nombre de lignes après la ligne 11:", lines.length);
      
      let newRows = [...csvRows]; // On garde les lignes existantes
      let errorCount = 0;

      lines.forEach((line, index) => {
        if (line.trim() === '') {
          console.log(`Ligne ${index + 12} vide, ignorée`);
          return;
        }

        console.log(`Traitement de la ligne ${index + 12}:`, line);
        const columns = line.split(',').map(col => col.trim());
        console.log(`Nombre de colonnes trouvées:`, columns.length);
        
        // Vérifier si les colonnes principales contiennent des données
        const hasRequiredData = columns[3] && columns[6] && columns[7] && columns[8] && columns[9];
        
        if (columns.length >= 9 && hasRequiredData) {
          // Normaliser les valeurs de "yes"/"no" et classification
          const authValue = columns[10]?.toLowerCase() === 'yes' ? 'yes' : 'no';
          const encryptValue = columns[11]?.toLowerCase() === 'yes' ? 'yes' : 'no';
          let classificationValue = columns[12]?.toLowerCase() || '';
          
          // Normaliser la classification
          if (!['yellow', 'amber', 'red'].includes(classificationValue)) {
            classificationValue = 'yellow'; // Valeur par défaut
          }

          // Créer une nouvelle ligne avec les données du CSV
          const newRow: CSVRow = {
            sourceIP: columns[3] || '', // Colonne D
            destIP: columns[6] || '', // Colonne G
            protocol: columns[7] || '', // Colonne H
            service: columns[8] || '', // Colonne I
            port: columns[9] || '', // Colonne J
            authentication: authValue, // Colonne K normalisée
            flowEncryption: encryptValue, // Colonne L normalisée
            classification: classificationValue, // Colonne M normalisée
            appCode: columns[13] || '', // Colonne N
            isValid: false,
            errors: []
          };

          console.log(`Données extraites et normalisées pour la nouvelle ligne:`, newRow);

          const validation = validateRow(newRow);
          if (!validation.isValid) {
            errorCount++;
            console.log(`Erreurs de validation pour la ligne ${index + 12}:`, validation.errors);
          }
          
          newRow.isValid = validation.isValid;
          newRow.errors = validation.errors;
          newRows.push(newRow);
        } else {
          console.log(`Ligne ${index + 12} ignorée car pas assez de colonnes ou données manquantes`);
        }
      });

      console.log(`Total des lignes ajoutées:`, newRows.length - csvRows.length);
      console.log(`Nombre d'erreurs trouvées:`, errorCount);

      setCsvRows(newRows);
      toast({
        title: "Import CSV",
        description: `${newRows.length - csvRows.length} nouvelles lignes ajoutées. ${errorCount} lignes contiennent des erreurs.`
      });
    };

    reader.onerror = (error) => {
      console.error("Erreur lors de la lecture du fichier:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la lecture du fichier."
      });
    };

    console.log("Début de la lecture du fichier");
    reader.readAsText(file);
  };

  const addEmptyRow = () => {
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
    const newRows = [...csvRows];
    newRows.splice(index, 1);
    setCsvRows(newRows);
    toast({
      title: "Ligne supprimée",
      description: "La ligne a été supprimée avec succès."
    });
  };

  const updateRow = (index: number, field: keyof CSVRow, value: string) => {
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

  const generateScriptForRow = (row: CSVRow, rowIndex: number): string => {
    return `curl -k -X POST "https://<TUFIN_SERVER>/securetrack/api/path-analysis" \\
  -H "Authorization: Bearer <TON_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": {
      "ip": "${row.sourceIP.split('/')[0]}"
    },
    "destination": {
      "ip": "${row.destIP}"
    },
    "service": {
      "protocol": "${row.protocol.toUpperCase()}",
      "port": ${row.port}
    }
  }'`;
  };

  const handleGenerateScript = () => {
    const validRows = csvRows.filter(row => {
      const validation = validateRow(row);
      return validation.isValid;
    }).slice(0, 5); // Limite à 5 lignes maximum

    if (validRows.length === 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune ligne valide trouvée"
      });
      return;
    }

    const scripts = validRows.map((row, index) => ({
      id: index + 1,
      script: generateScriptForRow(row, index)
    }));

    setGeneratedScripts(scripts);
    
    toast({
      title: "Succès",
      description: `${scripts.length} script(s) généré(s) avec succès`
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

        <div className="flex justify-end gap-4 mb-6">
          <Button 
            onClick={addEmptyRow}
            className="flex items-center gap-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </Button>
          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-[#E67E22] text-white rounded-md hover:bg-[#D35400] transition-colors">
            <Upload className="w-4 h-4" />
            Importer CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid gap-6 max-w-sm mb-10">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Department <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input 
                placeholder="Department (1-4 chars)" 
                maxLength={4}
                className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-white/50 pr-10 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
                onChange={(e) => {
                  const isValid = e.target.value.length >= 1 && e.target.value.length <= 4;
                  setErrors(prev => ({
                    ...prev,
                    department: {
                      error: !isValid,
                      message: isValid ? '' : 'Entre 1 et 4 caractères requis'
                    }
                  }));
                }}
              />
              {errors.department.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : errors.department.message === '' ? (
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
                placeholder="Project code (1-4 chars)" 
                maxLength={4}
                className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-[#BDC3C7]/50 pr-10 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
                onChange={(e) => {
                  const isValid = e.target.value.length >= 1 && e.target.value.length <= 4;
                  setErrors(prev => ({
                    ...prev,
                    projectCode: {
                      error: !isValid,
                      message: isValid ? '' : 'Entre 1 et 4 caractères requis'
                    }
                  }));
                }}
              />
              {errors.projectCode.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : errors.projectCode.message === '' ? (
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
                type="email" 
                placeholder="Email address"
                className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-[#BDC3C7]/50 pr-10 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
                onChange={(e) => validateEmail(e.target.value)}
              />
              {errors.email.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : errors.email.message === '' ? (
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
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {csvRows.map((row, index) => (
                  <tr key={index} className={`border-b border-[#2C3E50] hover:bg-[#2C3E50]/50 ${!row.isValid ? 'bg-red-900/20' : ''}`}>
                    <td className="p-2">
                      <Input
                        value={row.sourceIP}
                        onChange={(e) => updateRow(index, 'sourceIP', e.target.value)}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.destIP}
                        onChange={(e) => updateRow(index, 'destIP', e.target.value)}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Select value={row.protocol} onValueChange={(value) => updateRow(index, 'protocol', value)}>
                        <SelectTrigger className="h-8">
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
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.port}
                        onChange={(e) => updateRow(index, 'port', e.target.value)}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Select value={row.authentication} onValueChange={(value) => updateRow(index, 'authentication', value)}>
                        <SelectTrigger className="h-8">
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
                        <SelectTrigger className="h-8">
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
                        <SelectTrigger className="h-8">
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
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        onClick={() => deleteRow(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                    <div className="mt-2 flex justify-end">
                      <Button 
                        onClick={() => navigator.clipboard.writeText(script)}
                        variant="outline" 
                        className="text-white hover:bg-white/20 transition-colors"
                      >
                        Copy script
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
