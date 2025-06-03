import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Trash2, Copy, Upload, Plus, FileCode2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

declare global {
  interface Window {
    google: {
      script: {
        run: {
          withSuccessHandler: (handler: (result: any) => void) => {
            withFailureHandler: (handler: (error: any) => void) => {
              handleXLSXFileSelect: (fileBlob: any, fileName: string) => void;
              exportXLSX: (data: any[]) => void;
              generateScripts: (options: { csvRows: any[] }) => void;
              deleteForm: () => void;
            }
          }
        }
      }
    }
  }
}

const google = window.google;

interface Rule {
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

export default function OnboardingForm() {
  const [department, setDepartment] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [email, setEmail] = useState('');
  const [csvRows, setCsvRows] = useState<Rule[]>([]);
  const [generatedScripts, setGeneratedScripts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addNewRow = () => {
    setCsvRows(prevRows => [...prevRows, {
      sourceIP: '',
      destIP: '',
      protocol: 'TCP',
      service: '',
      port: '',
      authentication: 'No',
      flowEncryption: 'No',
      classification: 'Yellow',
      appCode: '',
      isValid: false,
      errors: []
    }]);
  };

  const deleteRow = (index: number) => {
    setCsvRows(prevRows => {
      const newRows = [...prevRows];
      newRows.splice(index, 1);
      return newRows;
    });
  };

  const duplicateRow = (index: number) => {
    setCsvRows(prevRows => {
      const newRows = [...prevRows];
      const duplicatedRow = { ...newRows[index] };
      newRows.splice(index + 1, 0, duplicatedRow);
      return newRows;
    });
  };

  /**
   * 🔶 Import XLSX avec vérifications automatisées complètes
   * Cette fonction ne traite QUE des fichiers .xlsx
   */
  const handleFileImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 🚫 Vérification automatisée : Rejet des fichiers CSV
    if (file.name.toLowerCase().endsWith('.csv')) {
      toast({
        variant: "destructive",
        title: "❌ Format non supporté",
        description: "Les fichiers CSV ne sont plus acceptés. Veuillez utiliser exclusivement des fichiers .xlsx (Excel)."
      });
      return;
    }

    // 📝 Vérification automatisée : Seuls les fichiers .xlsx sont acceptés
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast({
        variant: "destructive",
        title: "❌ Format invalide",
        description: "Seuls les fichiers Excel (.xlsx) sont supportés."
      });
      return;
    }

    setIsLoading(true);
    console.log("🔄 Import du fichier XLSX:", file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Appel à la fonction Google Apps Script pour traitement XLSX
      google.script.run
        .withSuccessHandler((response: any) => {
          setIsLoading(false);
          if (response.success) {
            setCsvRows(response.data || []);
            setDepartment(response.department || '');
            setProjectCode(response.projectCode || '');
            setEmail(response.requesterEmail || '');
            
            toast({
              title: "✅ Import réussi",
              description: response.message
            });
            console.log("✅ Fichier XLSX traité avec succès");
          } else {
            toast({
              variant: "destructive",
              title: "❌ Erreur d'import",
              description: response.message
            });
            console.error("❌ Erreur lors de l'import XLSX:", response.message);
          }
        })
        .withFailureHandler((error: any) => {
          setIsLoading(false);
          console.error("❌ Erreur critique lors de l'import XLSX:", error);
          toast({
            variant: "destructive",
            title: "❌ Erreur critique",
            description: "Échec du traitement du fichier XLSX"
          });
        })
        .handleXLSXFileSelect(blob, file.name);
    };

    reader.onerror = () => {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "❌ Erreur de lecture",
        description: "Impossible de lire le fichier XLSX"
      });
    };

    reader.readAsArrayBuffer(file);
  };

  const handleExportXLSX = () => {
    if (csvRows.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucune donnée",
        description: "Aucune ligne à exporter. Veuillez ajouter des données."
      });
      return;
    }

    console.log("🔄 Export XLSX avec", csvRows.length, "lignes");

    google.script.run
      .withSuccessHandler((blob: any) => {
        // Créer un lien de téléchargement pour le fichier XLSX
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'export_onboarding.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "✅ Export réussi",
          description: "Fichier XLSX exporté avec succès"
        });
        console.log("✅ Export XLSX terminé");
      })
      .withFailureHandler((error: any) => {
        console.error("❌ Erreur lors de l'export XLSX:", error);
        toast({
          variant: "destructive",
          title: "❌ Erreur d'export",
          description: "Échec de l'export du fichier XLSX"
        });
      })
      .exportXLSX(csvRows);
  };

  const handleGenerateScripts = () => {
    google.script.run
      .withSuccessHandler((response: any) => {
        if (response.success) {
          setGeneratedScripts(response.data);
          toast({
            title: "✅ Scripts générés",
            description: response.message
          });
        } else {
          toast({
            variant: "destructive",
            title: "❌ Erreur de génération",
            description: response.message
          });
        }
      })
      .withFailureHandler((error: any) => {
        toast({
          variant: "destructive",
          title: "❌ Erreur critique",
          description: "Erreur lors de la communication avec Google Apps Script"
        });
        console.error("Erreur lors de la génération des scripts:", error);
      })
      .generateScripts({ csvRows });
  };

  const handleDeleteForm = () => {
    google.script.run
      .withSuccessHandler(() => {
        setDepartment('');
        setProjectCode('');
        setEmail('');
        setCsvRows([]);
        setGeneratedScripts([]);
        toast({
          title: "✅ Formulaire supprimé",
          description: "Le formulaire a été supprimé avec succès."
        });
      })
      .withFailureHandler((error: any) => {
        toast({
          variant: "destructive",
          title: "❌ Erreur de suppression",
          description: "Erreur lors de la suppression du formulaire."
        });
        console.error("Erreur lors de la suppression du formulaire:", error);
      })
      .deleteForm();
  };

  return (
    <div className="min-h-screen bg-[#212121] text-[#BDC3C7] font-sans p-6">
      <div className="w-[1200px] mx-auto bg-[#34495E] rounded-lg p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          One Click Onboarding - Format XLSX Exclusif
        </h1>

        <div className="mb-6 p-4 bg-[#2C3E50] rounded-lg border border-[#F39C12]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-[#F39C12] font-semibold">Important: Format XLSX uniquement</p>
              <p className="text-sm text-[#BDC3C7]">
                Les fichiers CSV ne sont plus supportés. Utilisez exclusivement des fichiers Excel (.xlsx).
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Button
            onClick={handleFileImport}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#D35400] text-white"
          >
            <Upload className="w-4 h-4" />
            {isLoading ? "Traitement..." : "Import XLSX"}
          </Button>
          <Button
            onClick={handleExportXLSX}
            className="flex items-center gap-2 bg-[#27ae60] hover:bg-[#219a52] text-white"
          >
            <FileCode2 className="w-4 h-4" />
            Export XLSX
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Informations Requises</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="Department (1-4 chars)"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="projectCode">Project/Application Code</Label>
              <Input
                id="projectCode"
                placeholder="Project code (1-4 chars)"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Requester's Email</Label>
              <Input
                id="email"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Network Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={addNewRow} className="mb-4 bg-[#2ECC71] hover:bg-[#27AE60] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add New Rule
            </Button>
            {csvRows.map((row, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 p-4 rounded-md bg-[#2C3E50]">
                <div className="col-span-3">
                  <Label htmlFor={`sourceIP-${index}`}>Source IP</Label>
                  <Textarea
                    id={`sourceIP-${index}`}
                    placeholder="192.168.1.0/24"
                    value={row.sourceIP}
                    onChange={(e) => {
                      const newRows = [...csvRows];
                      newRows[index].sourceIP = e.target.value;
                      setCsvRows(newRows);
                    }}
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor={`destIP-${index}`}>Destination IP</Label>
                  <Textarea
                    id={`destIP-${index}`}
                    placeholder="10.0.0.1"
                    value={row.destIP}
                    onChange={(e) => {
                      const newRows = [...csvRows];
                      newRows[index].destIP = e.target.value;
                      setCsvRows(newRows);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`protocol-${index}`}>Protocol</Label>
                  <Select
                    onValueChange={(value) => {
                      const newRows = [...csvRows];
                      newRows[index].protocol = value;
                      setCsvRows(newRows);
                    }}
                    defaultValue={row.protocol}
                  >
                    <SelectTrigger className="bg-[#34495E] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#34495E] text-white">
                      <SelectItem value="TCP">TCP</SelectItem>
                      <SelectItem value="UDP">UDP</SelectItem>
                      <SelectItem value="ICMP">ICMP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`service-${index}`}>Service</Label>
                  <Input
                    id={`service-${index}`}
                    placeholder="Service"
                    value={row.service}
                    onChange={(e) => {
                      const newRows = [...csvRows];
                      newRows[index].service = e.target.value;
                      setCsvRows(newRows);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`port-${index}`}>Port</Label>
                  <Input
                    id={`port-${index}`}
                    placeholder="443"
                    value={row.port}
                    onChange={(e) => {
                      const newRows = [...csvRows];
                      newRows[index].port = e.target.value;
                      setCsvRows(newRows);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`authentication-${index}`}>Authentication</Label>
                  <Select
                    onValueChange={(value) => {
                      const newRows = [...csvRows];
                      newRows[index].authentication = value;
                      setCsvRows(newRows);
                    }}
                    defaultValue={row.authentication}
                  >
                    <SelectTrigger className="bg-[#34495E] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#34495E] text-white">
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`flowEncryption-${index}`}>Flow Encryption</Label>
                  <Select
                    onValueChange={(value) => {
                      const newRows = [...csvRows];
                      newRows[index].flowEncryption = value;
                      setCsvRows(newRows);
                    }}
                    defaultValue={row.flowEncryption}
                  >
                    <SelectTrigger className="bg-[#34495E] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#34495E] text-white">
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`classification-${index}`}>Classification</Label>
                  <Select
                    onValueChange={(value) => {
                      const newRows = [...csvRows];
                      newRows[index].classification = value;
                      setCsvRows(newRows);
                    }}
                    defaultValue={row.classification}
                  >
                    <SelectTrigger className="bg-[#34495E] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#34495E] text-white">
                      <SelectItem value="Yellow">Yellow</SelectItem>
                      <SelectItem value="Amber">Amber</SelectItem>
                      <SelectItem value="Red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`appCode-${index}`}>App Code</Label>
                  <Input
                    id={`appCode-${index}`}
                    placeholder="Code"
                    value={row.appCode}
                    onChange={(e) => {
                      const newRows = [...csvRows];
                      newRows[index].appCode = e.target.value;
                      setCsvRows(newRows);
                    }}
                  />
                </div>
                <div className="col-span-1 flex items-end justify-between">
                  <Button
                    onClick={() => duplicateRow(index)}
                    className="bg-[#3498db] hover:bg-[#2980b9] text-white"
                    size="icon"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteRow(index)}
                    className="bg-[#e74c3c] hover:bg-[#c0392b] text-white"
                    size="icon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateScripts} className="mb-4 bg-[#F08B32] hover:bg-[#E67E22] text-white">
              Generate Scripts
            </Button>
            {generatedScripts.length > 0 ? (
              generatedScripts.map((script, index) => (
                <div key={index} className="mb-2 p-4 rounded-md bg-[#2C3E50] text-white break-words">
                  <pre>{script}</pre>
                </div>
              ))
            ) : (
              <p>No scripts generated yet.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button onClick={handleDeleteForm} className="bg-[#FF4757] hover:bg-[#D63031] text-white">
            Delete Form
          </Button>
        </div>
      </div>
    </div>
  );
}
