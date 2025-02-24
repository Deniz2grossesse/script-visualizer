
import { useState } from 'react';
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

const Index = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = () => {
    setFormData(initialFormData);
    toast.success("Form has been cleared");
  };

  const handleResumeDraft = () => {
    // Implement draft functionality
    toast.info("Draft functionality to be implemented");
  };

  const handleVerify = () => {
    // Add verification logic
    toast.info("Verifying entries...");
  };

  const handleValidate = () => {
    // Add validation logic
    toast.success("Entries validated successfully");
  };

  const handleGenerateScript = () => {
    // Add script generation logic
    toast.success("Script generation started");
  };

  return (
    <div className="form-container animate-fade-in">
      <form onSubmit={(e) => e.preventDefault()}>
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
        </div>

        <div className="form-row mt-6">
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
        </div>

        <div className="form-row mt-6">
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
