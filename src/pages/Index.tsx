
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Index = () => {
  const [generatedScript, setGeneratedScript] = useState('');

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <h1 className="text-2xl font-semibold text-center mb-8">One Click Onboarding</h1>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        These three fields are mandatory, you cannot start entering them without having filled them in.
      </div>

      {/* Mandatory Fields */}
      <div className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Department <span className="text-red-500">*</span>
          </label>
          <Input 
            placeholder="Department (1-4 chars)" 
            maxLength={4}
            className="max-w-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Project/Application Code <span className="text-red-500">*</span>
          </label>
          <Input 
            placeholder="Project code (1-4 chars)" 
            maxLength={4}
            className="max-w-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Requester's Email <span className="text-red-500">*</span>
          </label>
          <Input 
            type="email" 
            placeholder="Email address"
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Network Rules Grid */}
      <div className="grid grid-cols-9 gap-4 mb-8">
        {/* Source IP */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Source IP</label>
          <Input placeholder="IP source" />
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full ml-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Destination IP */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">IP Destination</label>
          <Input placeholder="IP destination" />
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full ml-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Protocol */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Protocol</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tcp">TCP</SelectItem>
              <SelectItem value="udp">UDP</SelectItem>
              <SelectItem value="icmp">ICMP</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full ml-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Service */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Service</label>
          <Input placeholder="Service" />
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full ml-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Port */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Port</label>
          <Input type="number" placeholder="Port" />
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full ml-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Authentication */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Authentication</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="oauth">OAuth</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full ml-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Flow Encryption */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Flow encryption</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="ssl">SSL/TLS</SelectItem>
              <SelectItem value="ipsec">IPSec</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full ml-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Classification */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Classification</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="confidential">Confidential</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full ml-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* APP Code */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">APP code</label>
          <Input placeholder="Code (4 chars)" maxLength={4} />
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full ml-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="text-red-500">Delete</Button>
        <Button variant="outline">Resume Draft</Button>
        <Button variant="outline" className="text-blue-500">Verify</Button>
        <Button variant="outline" className="text-green-500">Validate</Button>
        <Button className="bg-green-500 hover:bg-green-600">Generate Scripts</Button>
      </div>

      {/* Output Section */}
      {generatedScript && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Generated Script</h3>
          <textarea
            value={generatedScript}
            readOnly
            className="w-full h-32 p-4 border rounded-md font-mono text-sm"
          />
          <div className="mt-4 flex justify-end">
            <Button variant="outline">Copy script</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
