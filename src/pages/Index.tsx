import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
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

  useEffect(() => {
    const isValid = validateDepartment(formData.department) &&
                   validateProjectCode(formData.projectCode) &&
                   validateEmail(formData.requesterEmail);
    setIsMainFormEnabled(isValid);
  }, [formData.department, formData.projectCode, formData.requesterEmail]);

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
      toast.error(error);
    } else {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNetworkRuleChange = (ruleId: string, field: keyof NetworkRule, value: string) => {
    setNetworkRules(prevRules => 
      prevRules.map(rule => 
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
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
        [field]: '' // Vide uniquement le champ cliqué
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

  const handleDelete = () => {
    setFormData(initialFormData);
    setFormErrors(initialFormErrors);
    toast.success("Formulaire effacé");
  };

  const handleResumeDraft = () => {
    toast.info("Draft functionality to be implemented");
  };

  const handleVerify = () => {
    toast.info("Verifying entries...");
  };

  const handleValidate = () => {
    toast.success("Entries validated successfully");
  };

  const handleGenerateScript = () => {
    toast.success("Script generation started");
  };

  return (
    <div className="form-container">
      <h1 className="text-2xl font-bold text-center mb-8">One Click Onboarding</h1>
      
      <div className="mandatory-fields">
        <div className="mandatory-message">
          These three fields are mandatory, you cannot start entering them without having filled them in.
        </div>

        <div className="mandatory-fields-container">
          <div className="field-group w-full">
            <label className="field-label">
              Department <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Department (1-4 chars)"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className={`w-full ${!validateDepartment(formData.department) && formData.department ? 'border-red-500' : ''}`}
            />
            {formData.department && !validateDepartment(formData.department) && (
              <p className="text-red-500 text-xs mt-1">Department must be 1-4 alphanumeric characters</p>
            )}
          </div>

          <div className="field-group w-full">
            <label className="field-label">
              Project/Application Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Project code (1-4 chars)"
              value={formData.projectCode}
              onChange={(e) => handleInputChange('projectCode', e.target.value)}
              className={`w-full ${!validateProjectCode(formData.projectCode) && formData.projectCode ? 'border-red-500' : ''}`}
            />
            {formData.projectCode && !validateProjectCode(formData.projectCode) && (
              <p className="text-red-500 text-xs mt-1">Project code must be 1-4 alphanumeric characters</p>
            )}
          </div>

          <div className="field-group w-full">
            <label className="field-label">
              Requester's Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="Email address"
              value={formData.requesterEmail}
              onChange={(e) => handleInputChange('requesterEmail', e.target.value)}
              className={`w-full ${!validateEmail(formData.requesterEmail) && formData.requesterEmail ? 'border-red-500' : ''}`}
            />
            {formData.requesterEmail && !validateEmail(formData.requesterEmail) && (
              <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
            )}
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <img 
              src="/lovable-uploads/2c5741ec-76b5-4d23-ade2-f5b173488467.png" 
              alt="Flow opening simplification & Automation configuration check" 
              className="mandatory-image cursor-pointer hover:opacity-90 transition-opacity"
            />
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            <img 
              src="/lovable-uploads/2c5741ec-76b5-4d23-ade2-f5b173488467.png" 
              alt="Flow opening simplification & Automation configuration check" 
              className="w-full h-full object-contain"
            />
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className={!isMainFormEnabled ? 'opacity-50 pointer-events-none' : ''}>
        {networkRules.map((rule) => (
          <div key={rule.id} className="relative">
            <div className="form-row">
              <div className="field-group w-ip">
                <label className="field-label">Source IP</label>
                <Input
                  type="text"
                  value={rule.sourceIP}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'sourceIP', e.target.value)}
                  className={formErrors.sourceIP ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => duplicateRule(rule.id, 'sourceIP')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="field-group w-ip">
                <label className="field-label">Destination IP</label>
                <Input
                  type="text"
                  value={rule.destIP}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'destIP', e.target.value)}
                  className={formErrors.destIP ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => duplicateRule(rule.id, 'destIP')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="field-group w-select">
                <label className="field-label">Protocol</label>
                <Select onValueChange={(value) => handleNetworkRuleChange(rule.id, 'protocol', value)}>
                  <SelectTrigger className={formErrors.protocol ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="icmp">ICMP</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => duplicateRule(rule.id, 'protocol')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="field-group w-service">
                <label className="field-label">Service</label>
                <Input
                  type="text"
                  value={rule.service}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'service', e.target.value)}
                  className={formErrors.service ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => duplicateRule(rule.id, 'service')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="field-group w-port">
                <label className="field-label">Port</label>
                <Input
                  type="text"
                  value={rule.port}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'port', e.target.value)}
                  className={formErrors.port ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => duplicateRule(rule.id, 'port')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="field-group w-select">
                <label className="field-label">Authentication</label>
                <Select onValueChange={(value) => handleNetworkRuleChange(rule.id, 'authentication', value)}>
                  <SelectTrigger className={formErrors.authentication ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select auth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="oauth">OAuth</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => duplicateRule(rule.id, 'authentication')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="field-group w-select">
                <label className="field-label">Flow encryption</label>
                <Select onValueChange={(value) => handleNetworkRuleChange(rule.id, 'encryption', value)}>
                  <SelectTrigger className={formErrors.encryption ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select encryption" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ssl">SSL/TLS</SelectItem>
                    <SelectItem value="ipsec">IPSec</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => duplicateRule(rule.id, 'encryption')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="field-group w-select">
                <label className="field-label">Classification</label>
                <Select onValueChange={(value) => handleNetworkRuleChange(rule.id, 'classification', value)}>
                  <SelectTrigger className={formErrors.classification ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => duplicateRule(rule.id, 'classification')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="field-group w-appcode">
                <label className="field-label">APP code</label>
                <Input
                  type="text"
                  value={rule.appCode}
                  onChange={(e) => handleNetworkRuleChange(rule.id, 'appCode', e.target.value)}
                  className={formErrors.appCode ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => duplicateRule(rule.id, 'appCode')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="mt-8"
                onClick={() => deleteRule(rule.id)}
              >
                ×
              </Button>
            </div>
          </div>
        ))}

        <div className="action-buttons">
          <Button onClick={handleDelete} variant="destructive">
            Delete
          </Button>
          <Button onClick={handleResumeDraft} variant="outline">
            Resume Draft
          </Button>
          <Button onClick={handleVerify}>
            Verify
          </Button>
          <Button onClick={handleValidate}>
            Validate
          </Button>
          <Button onClick={handleGenerateScript} variant="default">
            Generate Script
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Index;
