import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Network, Shield, ArrowRight, Plus, Lock, FileCode, AlertTriangle, Check, X, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [isImporting, setIsImporting] = useState(false);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

  const handleImportCSV = useCallback((event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || isImporting) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          toast({
            title: "Erreur",
            description: "Le fichier est vide",
            variant: "destructive"
          });
          return;
        }

        const lines = text.split('\n').slice(11);
        const newRows: CSVRow[] = [];

        lines.forEach((line) => {
          if (line.trim() === '') return;

          const columns = line.split(',').map(col => col.trim());
          if (columns.length >= 9) {
            newRows.push({
              sourceIP: columns[3] || '',
              destIP: columns[6] || '',
              protocol: 'tcp',
              service: columns[8] || '',
              port: columns[9] || '',
              authentication: 'no',
              flowEncryption: 'no',
              classification: 'yellow',
              appCode: columns[13] || ''
            });
          }
        });

        if (newRows.length > 0) {
          const shouldUpdate = window.confirm(`Voulez-vous importer ${newRows.length} règles ?`);
          if (shouldUpdate) {
            setCsvRows(newRows);
          }
        } else {
          toast({
            title: "Information",
            description: "Aucune règle valide trouvée dans le fichier",
          });
        }
      } catch (error) {
        console.error('Erreur lors du parsing du CSV:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la lecture du fichier",
          variant: "destructive"
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setIsImporting(false);
      toast({
        title: "Erreur",
        description: "Erreur lors de la lecture du fichier",
        variant: "destructive"
      });
    };

    reader.readAsText(file);
  }, [isImporting, toast]);

  useEffect(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';
    input.addEventListener('change', handleImportCSV);
    document.body.appendChild(input);
    setFileInput(input);
    
    return () => {
      input.removeEventListener('change', handleImportCSV);
      input.remove();
    };
  }, [handleImportCSV]);

  const generateScriptForRow = (row: CSVRow): string => {
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

  const triggerFileInput = useCallback(() => {
    if (!isImporting && fileInput) {
      fileInput.click();
    }
  }, [isImporting, fileInput]);

  const handleAddRow = () => {
    const emptyRow: CSVRow = {
      sourceIP: '',
      destIP: '',
      protocol: 'tcp',
      service: '',
      port: '',
      authentication: 'no',
      flowEncryption: 'no',
      classification: 'yellow',
      appCode: ''
    };
    setCsvRows(prev => [...prev, emptyRow]);
  };

  const handleGenerateScripts = () => {
    const validRows = csvRows.slice(0, 5);
    if (validRows.length === 0) {
      toast({
        title: "Information",
        description: "Aucune règle à générer",
      });
      return;
    }

    const scripts = validRows.map((row, index) => ({
      id: index + 1,
      script: generateScriptForRow(row)
    }));
    setGeneratedScripts(scripts);
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
            type="button"
            onClick={handleAddRow}
            disabled={isImporting}
            className="flex items-center gap-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </Button>
          
          <Button
            type="button"
            onClick={triggerFileInput}
            disabled={isImporting}
            className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#D35400] text-white"
          >
            <Upload className="w-4 h-4" />
            Importer CSV
          </Button>
        </div>

        {csvRows.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#2C3E50] text-white">
                  <th className="p-2 text-left">Source IP</th>
                  <th className="p-2 text-left">IP Destination</th>
                  <th className="p-2 text-left">Protocol</th>
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
                  <tr key={index} className="border-b border-[#2C3E50] hover:bg-[#2C3E50]/50">
                    <td className="p-2">
                      <Input
                        value={row.sourceIP}
                        onChange={(e) => {
                          const newRows = [...csvRows];
                          newRows[index] = { ...row, sourceIP: e.target.value };
                          setCsvRows(newRows);
                        }}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.destIP}
                        onChange={(e) => {
                          const newRows = [...csvRows];
                          newRows[index] = { ...row, destIP: e.target.value };
                          setCsvRows(newRows);
                        }}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Select defaultValue={row.protocol} onValueChange={(value) => {
                        const newRows = [...csvRows];
                        newRows[index] = { ...row, protocol: value };
                        setCsvRows(newRows);
                      }}>
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
                        onChange={(e) => {
                          const newRows = [...csvRows];
                          newRows[index] = { ...row, service: e.target.value };
                          setCsvRows(newRows);
                        }}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.port}
                        onChange={(e) => {
                          const newRows = [...csvRows];
                          newRows[index] = { ...row, port: e.target.value };
                          setCsvRows(newRows);
                        }}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Select defaultValue={row.authentication} onValueChange={(value) => {
                        const newRows = [...csvRows];
                        newRows[index] = { ...row, authentication: value };
                        setCsvRows(newRows);
                      }}>
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
                      <Select defaultValue={row.flowEncryption} onValueChange={(value) => {
                        const newRows = [...csvRows];
                        newRows[index] = { ...row, flowEncryption: value };
                        setCsvRows(newRows);
                      }}>
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
                      <Select defaultValue={row.classification} onValueChange={(value) => {
                        const newRows = [...csvRows];
                        newRows[index] = { ...row, classification: value };
                        setCsvRows(newRows);
                      }}>
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
                        onChange={(e) => {
                          const newRows = [...csvRows];
                          newRows[index] = { ...row, appCode: e.target.value };
                          setCsvRows(newRows);
                        }}
                        className="bg-[#34495E] border-[#BDC3C7]/30 text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setCsvRows(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button 
            type="button"
            onClick={handleGenerateScripts}
            disabled={csvRows.length === 0 || isImporting}
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
