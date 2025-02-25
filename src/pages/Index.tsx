import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Network, Shield, ArrowRight, Plus, Lock, FileCode, AlertTriangle, Check, X } from "lucide-react";

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

const Index = () => {
  const [generatedScript, setGeneratedScript] = useState('');
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

  const validateIP = (ip: string, field: 'sourceIP' | 'destIP'): boolean => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const isValid = ipRegex.test(ip) && ip.split('.').every(num => parseInt(num) >= 0 && parseInt(num) <= 255);
    setErrors(prev => ({
      ...prev,
      [field]: {
        error: !isValid,
        message: isValid ? '' : 'Veuillez entrer une adresse IP valide'
      }
    }));
    return isValid;
  };

  const validatePort = (port: string): boolean => {
    const portNum = parseInt(port);
    const isValid = !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
    setErrors(prev => ({
      ...prev,
      port: {
        error: !isValid,
        message: isValid ? '' : 'Veuillez entrer un port valide (1-65535)'
      }
    }));
    return isValid;
  };

  return (
    <div className="min-h-screen bg-[#212121] text-[#BDC3C7] font-sans p-6">
      <div className="w-[1200px] mx-auto bg-[#34495E] rounded-lg p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">One Click Onboarding</h1>
        
        <div className="bg-[#2C3E50] border border-[#BDC3C7]/30 rounded-lg p-4 mb-8">
          <AlertTriangle className="inline-block w-5 h-5 mr-2 text-[#E67E22]" />
          <span className="text-[#BDC3C7]">These three fields are mandatory, you cannot start entering them without having filled them in.</span>
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
                className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-white pr-10 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
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

        <div className="flex gap-4 mb-8">
          <div className="w-[180px] flex flex-col">
            <label className="block text-xs font-medium text-[#BDC3C7] flex items-center gap-1 mb-2 h-5">
              <Network className="w-3 h-3" /> Source IP
            </label>
            <Input 
              placeholder="IP source" 
              className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-white text-sm h-9 mb-2 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
              onChange={(e) => validateIP(e.target.value, 'sourceIP')}
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full self-center border-[#E67E22] hover:bg-[#E67E22]/20 transition-colors"
            >
              <Plus className="h-3 w-3 text-[#E67E22]" />
            </Button>
          </div>

          <div className="w-[180px] flex flex-col">
            <label className="block text-xs font-medium text-[#BDC3C7] flex items-center gap-1 mb-2 h-5">
              <Network className="w-3 h-3" /> IP Destination
            </label>
            <Input 
              placeholder="IP destination" 
              className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-white text-sm h-9 mb-2 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full self-center border-[#E67E22] hover:bg-[#E67E22]/20 transition-colors"
            >
              <Plus className="h-3 w-3 text-[#E67E22]" />
            </Button>
          </div>

          <div className="w-[120px] flex flex-col">
            <label className="block text-xs font-medium text-[#BDC3C7] flex items-center gap-1 mb-2 h-5">
              <Shield className="w-3 h-3" /> Protocol
            </label>
            <Select>
              <SelectTrigger className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white h-9 text-sm mb-2 focus:border-[#E67E22] focus:ring-[#E67E22]/50">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tcp">TCP</SelectItem>
                <SelectItem value="udp">UDP</SelectItem>
                <SelectItem value="icmp">ICMP</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full self-center border-[#E67E22] hover:bg-[#E67E22]/20 transition-colors"
            >
              <Plus className="h-3 w-3 text-[#E67E22]" />
            </Button>
          </div>

          <div className="w-[90px] flex flex-col">
            <label className="block text-xs font-medium text-[#BDC3C7] mb-2 h-5">Service</label>
            <Input 
              placeholder="Service"
              className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-white text-sm h-9 mb-2 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full self-center border-[#E67E22] hover:bg-[#E67E22]/20 transition-colors"
            >
              <Plus className="h-3 w-3 text-[#E67E22]" />
            </Button>
          </div>

          <div className="w-[100px] flex flex-col">
            <label className="block text-xs font-medium text-[#BDC3C7] mb-2 h-5">Port</label>
            <Input 
              type="number" 
              placeholder="Port"
              className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-white text-sm h-9 mb-2 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full self-center border-[#E67E22] hover:bg-[#E67E22]/20 transition-colors"
            >
              <Plus className="h-3 w-3 text-[#E67E22]" />
            </Button>
          </div>

          <div className="w-[110px] flex flex-col">
            <label className="block text-xs font-medium text-[#BDC3C7] flex items-center gap-1 mb-2 h-5">
              <Lock className="w-3 h-3" /> Authentication
            </label>
            <Select>
              <SelectTrigger className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white h-9 text-sm mb-2 focus:border-[#E67E22] focus:ring-[#E67E22]/50">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="oauth">OAuth</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full self-center border-[#E67E22] hover:bg-[#E67E22]/20 transition-colors"
            >
              <Plus className="h-3 w-3 text-[#E67E22]" />
            </Button>
          </div>

          <div className="w-[110px] flex flex-col">
            <label className="block text-xs font-medium text-[#BDC3C7] flex items-center gap-1 mb-2 h-5">
              <Shield className="w-3 h-3" /> Flow encryption
            </label>
            <Select>
              <SelectTrigger className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white h-9 text-sm mb-2 focus:border-[#E67E22] focus:ring-[#E67E22]/50">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="ssl">SSL/TLS</SelectItem>
                <SelectItem value="ipsec">IPSec</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full self-center border-[#E67E22] hover:bg-[#E67E22]/20 transition-colors"
            >
              <Plus className="h-3 w-3 text-[#E67E22]" />
            </Button>
          </div>

          <div className="w-[130px] flex flex-col">
            <label className="block text-xs font-medium text-[#BDC3C7] flex items-center gap-1 mb-2 h-5">
              <Shield className="w-3 h-3" /> Classification
            </label>
            <Select>
              <SelectTrigger className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white h-9 text-sm mb-2 focus:border-[#E67E22] focus:ring-[#E67E22]/50">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="confidential">Confidential</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full self-center border-[#E67E22] hover:bg-[#E67E22]/20 transition-colors"
            >
              <Plus className="h-3 w-3 text-[#E67E22]" />
            </Button>
          </div>

          <div className="w-[90px] flex flex-col">
            <label className="block text-xs font-medium text-[#BDC3C7] flex items-center gap-1 mb-2 h-5">
              <FileCode className="w-3 h-3" /> APP code
            </label>
            <Input 
              placeholder="Code (4)" 
              maxLength={4} 
              className="bg-[#34495E] border-[#BDC3C7]/30 rounded-md text-white placeholder-white text-sm h-9 mb-2 focus:border-[#E67E22] focus:ring-[#E67E22]/50"
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full self-center border-[#E67E22] hover:bg-[#E67E22]/20 transition-colors"
            >
              <Plus className="h-3 w-3 text-[#E67E22]" />
            </Button>
          </div>
        </div>

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
            className="bg-[#E67E22] hover:bg-[#D35400] text-white border-none transition-colors flex items-center gap-2"
          >
            Generate Scripts
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {generatedScript && (
          <div className="mt-8 bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Generated Script
            </h3>
            <textarea
              value={generatedScript}
              readOnly
              className="w-full h-32 p-4 rounded-md font-mono text-sm bg-[#2C3E50] border border-[#BDC3C7]/30 shadow-input focus:border-primary transition-colors text-white"
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="text-white hover:bg-white/20 transition-colors">
                Copy script
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
