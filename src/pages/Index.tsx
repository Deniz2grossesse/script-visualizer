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
    <div className="min-h-screen bg-[#2C3E50] text-white font-sans p-6">
      <div className="max-w-[1200px] mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8">
        <h1 className="text-4xl font-bold text-center mb-8 font-sans">One Click Onboarding</h1>
        
        <div className="bg-white/20 border border-white/30 rounded-lg p-4 mb-8 backdrop-blur-sm">
          <AlertTriangle className="inline-block w-5 h-5 mr-2 text-yellow-400" />
          These three fields are mandatory, you cannot start entering them without having filled them in.
        </div>

        <div className="mb-10 space-y-6">
          <div className="grid gap-6 max-w-sm">
            <div>
              <label className="block text-sm font-medium mb-2">
                Department <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input 
                  placeholder="Department (1-4 chars)" 
                  maxLength={4}
                  className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white placeholder-white/50 pr-10"
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
                  className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white placeholder-white/50 pr-10"
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
                  className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white placeholder-white/50 pr-10"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 gap-6 mb-8">
          <div className="space-y-2">
            <label className="block text-sm font-medium flex items-center gap-2">
              <Network className="w-4 h-4" /> Source IP
            </label>
            <div className="relative">
              <Input 
                placeholder="IP source" 
                className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white placeholder-white/50 pr-10"
                onChange={(e) => validateIP(e.target.value, 'sourceIP')}
              />
              {errors.sourceIP.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : errors.sourceIP.message === '' ? (
                <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
              ) : null}
            </div>
            {errors.sourceIP.error && (
              <p className="text-destructive text-sm">{errors.sourceIP.message}</p>
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full mx-auto block border-primary/50 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium flex items-center gap-2">
              <Network className="w-4 h-4" /> IP Destination
            </label>
            <div className="relative">
              <Input 
                placeholder="IP destination" 
                className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white placeholder-white/50 pr-10"
                onChange={(e) => validateIP(e.target.value, 'destIP')}
              />
              {errors.destIP.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : errors.destIP.message === '' ? (
                <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
              ) : null}
            </div>
            {errors.destIP.error && (
              <p className="text-destructive text-sm">{errors.destIP.message}</p>
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full mx-auto block border-primary/50 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" /> Protocol
            </label>
            <Select>
              <SelectTrigger className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white">
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
              className="w-6 h-6 rounded-full mx-auto block border-primary/50 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Service</label>
            <div className="relative">
              <Input 
                placeholder="Service"
                className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white placeholder-white/50 pr-10"
                onChange={(e) => {
                  const isValid = e.target.value.length > 0;
                  setErrors(prev => ({
                    ...prev,
                    service: {
                      error: !isValid,
                      message: isValid ? '' : 'Service requis'
                    }
                  }));
                }}
              />
              {errors.service.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : errors.service.message === '' ? (
                <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
              ) : null}
            </div>
            {errors.service.error && (
              <p className="text-destructive text-sm">{errors.service.message}</p>
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full mx-auto block border-primary/50 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Port</label>
            <div className="relative">
              <Input 
                type="number" 
                placeholder="Port"
                className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white placeholder-white/50 pr-10"
                onChange={(e) => validatePort(e.target.value)}
              />
              {errors.port.error ? (
                <X className="absolute right-3 top-2.5 h-5 w-5 text-destructive" />
              ) : errors.port.message === '' ? (
                <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
              ) : null}
            </div>
            {errors.port.error && (
              <p className="text-destructive text-sm">{errors.port.message}</p>
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full mx-auto block border-primary/50 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" /> Authentication
            </label>
            <Select>
              <SelectTrigger className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white">
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
              className="w-6 h-6 rounded-full mx-auto block border-primary/50 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" /> Flow encryption
            </label>
            <Select>
              <SelectTrigger className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white">
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
              className="w-6 h-6 rounded-full mx-auto block border-primary/50 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" /> Classification
            </label>
            <Select>
              <SelectTrigger className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white">
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
              className="w-6 h-6 rounded-full mx-auto block border-primary/50 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium flex items-center gap-2">
              <FileCode className="w-4 h-4" /> APP code
            </label>
            <Input 
              placeholder="Code (4 chars)" 
              maxLength={4} 
              className="bg-[#BDC3C7]/20 border-[#BDC3C7]/30 rounded-md shadow-input hover:border-primary/50 focus:border-primary transition-colors text-white placeholder-white/50 pr-10"
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="w-6 h-6 rounded-full mx-auto block border-primary/50 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button 
            variant="outline" 
            className="text-destructive hover:bg-destructive/20 transition-colors"
          >
            Delete
          </Button>
          <Button 
            variant="outline"
            className="text-white hover:bg-white/20 transition-colors"
          >
            Resume Draft
          </Button>
          <Button 
            variant="outline"
            className="text-primary hover:bg-primary/20 transition-colors"
          >
            Verify
          </Button>
          <Button 
            variant="outline"
            className="text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            Validate
          </Button>
          <Button 
            className="bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2"
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
