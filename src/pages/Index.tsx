import { useState, useEffect } from 'react';
import { Plus, Copy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface FormData {
  department: string;
  projectCode: string;
  requesterEmail: string;
  sourceIP: string;
  destIP: string;
  protocol: string;
  service: string;
  port: string;
  authentication: string;
  encryption: string;
  classification: string;
  appCode: string;
}

interface FormErrors {
  sourceIP: string;
  destIP: string;
  protocol: string;
  service: string;
  port: string;
  authentication: string;
  encryption: string;
  classification: string;
  appCode: string;
}

interface NetworkRule {
  id: string;
  sourceIP: string;
  destIP: string;
  protocol: string;
  service: string;
  port: string;
  authentication: string;
  encryption: string;
  classification: string;
  appCode: string;
}

const initialFormData: FormData = {
  department: '',
  projectCode: '',
  requesterEmail: '',
  sourceIP: '',
  destIP: '',
  protocol: '',
  service: '',
  port: '',
  authentication: '',
  encryption: '',
  classification: '',
  appCode: ''
};

const initialFormErrors: FormErrors = {
  sourceIP: '',
  destIP: '',
  protocol: '',
  service: '',
  port: '',
  authentication: '',
  encryption: '',
  classification: '',
  appCode: ''
};

const validateDepartment = (value: string) => {
  const regex = /^[a-zA-Z0-9]{1,4}$/;
  return regex.test(value);
};

const validateProjectCode = (value: string) => {
  const regex = /^[a-zA-Z0-9]{1,4}$/;
  return regex.test(value);
};

const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validateIP = (ip: string) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ip) {
    return "L'adresse IP est requise";
  }
  if (!ipv4Regex.test(ip)) {
    return "Format d'IP invalide";
  }
  const octets = ip.split('.');
  for (const octet of octets) {
    const num = parseInt(octet);
    if (num < 0 || num > 255) {
      return "Chaque octet doit être entre 0 et 255";
    }
  }
  return "";
};

const validatePort = (port: string) => {
  const portNum = parseInt(port);
  if (!port) {
    return "Le port est requis";
  }
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return "Le port doit être un nombre entre 1 et 65535";
  }
  return "";
};

const validateService = (service: string) => {
  if (!service) {
    return "Le service est requis";
  }
  if (service.length < 2) {
    return "Le nom du service doit faire au moins 2 caractères";
  }
  return "";
};

const validateAppCode = (code: string) => {
  const regex = /^[a-zA-Z0-9]{4}$/;
  if (!code) {
    return "Le code application est requis";
  }
  if (!regex.test(code)) {
    return "Le code application doit contenir exactement 4 caractères alphanumériques";
  }
  return "";
};

const validateRequired = (value: string) => {
  if (!value) {
    return "Ce champ est requis";
  }
  return "";
};

const Index = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>(initialFormErrors);
  const [isMainFormEnabled, setIsMainFormEnabled] = useState(false);
  const [generatedScripts, setGeneratedScripts] = useState<Array<{id: number, script: string}>>([]);
  const [networkRules, setNetworkRules] = useState<NetworkRule[]>([
    {
      id: '1',
      sourceIP: '',
      destIP: '',
      protocol: '',
      service: '',
      port: '',
      authentication: '',
      encryption: '',
      classification: '',
      appCode: ''
    }
  ]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'department') {
      if (!/^[a-zA-Z0-9]*$/.test(value)) return;
      if (value.length > 4) return;
    }
    if (field === 'projectCode') {
      if (!/^[a-zA-Z0-9]*$/.test(value)) return;
      if (value.length > 4) return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const isValid = 
      formData.department.length > 0 &&
      formData.projectCode.length > 0 &&
      formData.requesterEmail.length > 0;
    setIsMainFormEnabled(isValid);
  }, [formData.department, formData.projectCode, formData.requesterEmail]);

  const handleNetworkRuleChange = (ruleId: string, field: keyof NetworkRule, value: string) => {
    setNetworkRules(prevRules => 
      prevRules.map(rule => {
        if (rule.id === ruleId) {
          const updatedRule = { ...rule, [field]: value };
          
          let error = '';
          switch (field) {
            case 'sourceIP':
            case 'destIP':
              error = validateIP(value);
              break;
            case 'port':
              error = validatePort(value);
              break;
            case 'service':
              error = validateService(value);
              break;
            case 'appCode':
              error = validateAppCode(value);
              break;
            case 'protocol':
            case 'authentication':
            case 'encryption':
            case 'classification':
              error = validateRequired(value);
              break;
          }

          if (error) {
            setFormErrors(prev => ({ ...prev, [field]: error }));
            toast.error(`${field}: ${error}`);
          } else {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
          }

          return updatedRule;
        }
        return rule;
      })
    );
  };

  const duplicateRule = (ruleId: string, field: keyof NetworkRule) => {
    setNetworkRules(prevRules => {
      const ruleIndex = prevRules.findIndex(rule => rule.id === ruleId);
      if (ruleIndex === -1) return prevRules;

      const sourceRule = prevRules[ruleIndex];
      const newRule = {
        ...sourceRule,
        id: Date.now().toString(),
        [field]: ''
      };

      const newRules = [...prevRules];
      newRules.splice(ruleIndex + 1, 0, newRule);
      return newRules;
    });
    toast.success("Nouvelle règle créée");
  };

  const deleteRule = (ruleId: string) => {
    setNetworkRules(prevRules => {
      if (prevRules.length === 1) {
        toast.error("Impossible de supprimer la dernière règle");
        return prevRules;
      }
      return prevRules.filter(rule => rule.id !== ruleId);
    });
  };

  const generateScript = (rule: NetworkRule, index: number) => {
    const scriptTemplate = `curl -k -X POST "https://<TUFIN_SERVER>/securetrack/api/path-analysis" \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": {
      "ip": "${rule.sourceIP}",
      "mask": "255.255.255.0"
    },
    "destination": {
      "ip": "${rule.destIP}"
    },
    "service": {
      "protocol": "${rule.protocol.toUpperCase()}",
      "port": ${rule.port},
      "name": "${rule.service}"
    }
  }'`;

    return {
      id: index + 1,
      script: scriptTemplate
    };
  };

  const handleGenerateAllScripts = () => {
    const scripts = networkRules.map((rule, index) => {
      if (!rule.sourceIP || !rule.destIP || !rule.protocol || !rule.port || !rule.service) {
        toast.error(`La règle ${index + 1} est incomplète`);
        return null;
      }
      return generateScript(rule, index);
    }).filter((script): script is {id: number, script: string} => script !== null);

    setGeneratedScripts(scripts);
    if (scripts.length > 0) {
      toast.success("Scripts générés avec succès");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Script copié dans le presse-papier");
    }).catch(() => {
      toast.error("Erreur lors de la copie du script");
    });
  };

  return (
    <div className="form-container">
      <h1 className="text-2xl font-bold text-center mb-8">One Click Onboarding</h1>
      
      <div className="mandatory-fields">
        <div className="mandatory-message text-left">
          These three fields are mandatory, you cannot start entering them without having filled them in.
        </div>

        <div className="mandatory-fields-container ml-8">
          <div className="field-group w-full">
            <label className="field-label text-left w-full">
              Department <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Department (1-4 chars)"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="field-group w-full">
            <label className="field-label text-left w-full">
              Project/Application Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Project code (1-4 chars)"
              value={formData.projectCode}
              onChange={(e) => handleInputChange('projectCode', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="field-group w-full">
            <label className="field-label text-left w-full">
              Requester's Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="Email address"
              value={formData.requesterEmail}
              onChange={(e) => handleInputChange('requesterEmail', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <img 
              src="/lovable-uploads/2c5741ec-76b5-4d23-ade2-f5b173488467.png" 
              alt="Flow opening" 
              className="mandatory-image cursor-pointer hover:opacity-90 transition-opacity"
            />
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            <img 
              src="/lovable-uploads/2c5741ec-76b5-4d23-ade2-f5b173488467.png" 
              alt="Flow opening" 
              className="w-full h-full object-contain"
            />
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className={!isMainFormEnabled ? 'opacity-50 pointer-events-none' : ''}>
        {networkRules.map((rule) => (
          <div key={rule.id} className="mb-6">
            <div className="form-row">
              <div className="field-group w-ip">
                <label className="field-label">Source IP</label>
                <Input
                  type="text"
                  placeholder="IP source"
                  value={rule.sourceIP}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'sourceIP', e.target.value)}
                  className={`field-input ${formErrors.sourceIP ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => duplicateRule(rule.id, 'sourceIP')}
                  className="add-button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="field-group w-ip">
                <label className="field-label">IP Destination</label>
                <Input
                  type="text"
                  placeholder="IP destination"
                  value={rule.destIP}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'destIP', e.target.value)}
                  className={`field-input ${formErrors.destIP ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => duplicateRule(rule.id, 'destIP')}
                  className="add-button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="field-group w-protocol">
                <label className="field-label">Protocole</label>
                <Select onValueChange={(value) => handleNetworkRuleChange(rule.id, 'protocol', value)}>
                  <SelectTrigger className="field-input field-select">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="icmp">ICMP</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => duplicateRule(rule.id, 'protocol')}
                  className="add-button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="field-group w-service">
                <label className="field-label">Service</label>
                <Input
                  type="text"
                  placeholder="Service"
                  value={rule.service}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'service', e.target.value)}
                  className="field-input"
                />
                <button
                  type="button"
                  onClick={() => duplicateRule(rule.id, 'service')}
                  className="add-button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="field-group w-port">
                <label className="field-label">Port</label>
                <Input
                  type="text"
                  placeholder="Port"
                  value={rule.port}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'port', e.target.value)}
                  className="field-input"
                />
                <button
                  type="button"
                  onClick={() => duplicateRule(rule.id, 'port')}
                  className="add-button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="field-group w-select">
                <label className="field-label">Authentication</label>
                <Select onValueChange={(value) => handleNetworkRuleChange(rule.id, 'authentication', value)}>
                  <SelectTrigger className="field-input field-select">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="oauth">OAuth</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => duplicateRule(rule.id, 'authentication')}
                  className="add-button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="field-group w-select">
                <label className="field-label">Flow encryption</label>
                <Select onValueChange={(value) => handleNetworkRuleChange(rule.id, 'encryption', value)}>
                  <SelectTrigger className="field-input field-select">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ssl">SSL/TLS</SelectItem>
                    <SelectItem value="ipsec">IPSec</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => duplicateRule(rule.id, 'encryption')}
                  className="add-button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="field-group w-select">
                <label className="field-label">Classification</label>
                <Select onValueChange={(value) => handleNetworkRuleChange(rule.id, 'classification', value)}>
                  <SelectTrigger className="field-input field-select">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => duplicateRule(rule.id, 'classification')}
                  className="add-button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="field-group w-appcode">
                <label className="field-label">APP code</label>
                <Input
                  type="text"
                  placeholder="Code (4 chars)"
                  value={rule.appCode}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'appCode', e.target.value)}
                  className="field-input"
                />
                <button
                  type="button"
                  onClick={() => duplicateRule(rule.id, 'appCode')}
                  className="add-button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => deleteRule(rule.id)}
                className="rule-remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        <div className="action-buttons">
          <Button onClick={() => setFormData(initialFormData)} variant="destructive">
            Delete
          </Button>
          <Button onClick={() => toast.info("Draft functionality to be implemented")} variant="outline">
            Resume Draft
          </Button>
          <Button onClick={() => toast.info("Verifying entries...")}>
            Verify
          </Button>
          <Button onClick={() => toast.success("Entries validated successfully")}>
            Validate
          </Button>
          <Button 
            onClick={handleGenerateAllScripts} 
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            Generate Scripts
          </Button>
        </div>
      </form>

      {generatedScripts.length > 0 && (
        <div className="mt-8 space-y-4">
          {generatedScripts.map((scriptData) => (
            <div key={scriptData.id} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-16 font-medium text-gray-700 mt-2">
                ID: {scriptData.id}
              </div>
              <div className="flex-grow relative">
                <Textarea
                  value={scriptData.script}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(scriptData.script)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
