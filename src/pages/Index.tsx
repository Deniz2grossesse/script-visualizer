
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

const Index = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isMainFormEnabled, setIsMainFormEnabled] = useState(false);

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
  };

  const handleDelete = () => {
    setFormData(initialFormData);
    toast.success("Form has been cleared");
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

        <img 
          src="/lovable-uploads/2c5741ec-76b5-4d23-ade2-f5b173488467.png" 
          alt="Flow opening simplification & Automation configuration check" 
          className="mandatory-image"
        />
      </div>

      <form onSubmit={(e) => e.preventDefault()} className={!isMainFormEnabled ? 'opacity-50 pointer-events-none' : ''}>
        <div className="form-row">
          <div className="field-group">
            <label className="field-label">Source IP</label>
            <Input
              type="text"
              placeholder="IP source"
              value={formData.sourceIP}
              onChange={(e) => handleInputChange('sourceIP', e.target.value)}
              className="w-full"
            />
            <button className="add-button">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="field-group">
            <label className="field-label">IP Destination</label>
            <Input
              type="text"
              placeholder="IP destination"
              value={formData.destIP}
              onChange={(e) => handleInputChange('destIP', e.target.value)}
              className="w-full"
            />
            <button className="add-button">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="field-group">
            <label className="field-label">Protocole</label>
            <Select onValueChange={(value) => handleInputChange('protocol', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tcp">TCP</SelectItem>
                <SelectItem value="udp">UDP</SelectItem>
                <SelectItem value="http">HTTP</SelectItem>
              </SelectContent>
            </Select>
            <button className="add-button">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="field-group">
            <label className="field-label">Service</label>
            <Input
              type="text"
              placeholder="Service"
              value={formData.service}
              onChange={(e) => handleInputChange('service', e.target.value)}
              className="w-full"
            />
            <button className="add-button">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="field-group">
            <label className="field-label">Port</label>
            <Input
              type="text"
              placeholder="Port"
              value={formData.port}
              onChange={(e) => handleInputChange('port', e.target.value)}
              className="w-full"
            />
            <button className="add-button">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="field-group">
            <label className="field-label">Authentication</label>
            <Select onValueChange={(value) => handleInputChange('authentication', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="oauth">OAuth</SelectItem>
              </SelectContent>
            </Select>
            <button className="add-button">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="field-group">
            <label className="field-label">Flow encryption</label>
            <Select onValueChange={(value) => handleInputChange('encryption', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="tls">TLS</SelectItem>
              </SelectContent>
            </Select>
            <button className="add-button">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="field-group">
            <label className="field-label">Classification</label>
            <Select onValueChange={(value) => handleInputChange('classification', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="confidential">Confidential</SelectItem>
              </SelectContent>
            </Select>
            <button className="add-button">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="field-group">
            <label className="field-label">APP code (4 chars)</label>
            <Input
              type="text"
              placeholder="Code (4 chars)"
              value={formData.appCode}
              onChange={(e) => handleInputChange('appCode', e.target.value)}
              maxLength={4}
              className="w-full"
            />
            <button className="add-button">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <Button
            variant="destructive"
            className="btn-delete"
            onClick={handleDelete}
          >
            Supprimer
          </Button>
          
          <Button
            variant="secondary"
            className="btn-draft"
            onClick={handleResumeDraft}
          >
            Reprendre le brouillon
          </Button>
          
          <Button
            variant="outline"
            className="btn-verify"
            onClick={handleVerify}
          >
            Vérifier
          </Button>
          
          <Button
            variant="default"
            className="btn-validate"
            onClick={handleValidate}
          >
            Valider
          </Button>
          
          <Button
            variant="default"
            className="btn-generate"
            onClick={handleGenerateScript}
          >
            Générer Script
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Index;
