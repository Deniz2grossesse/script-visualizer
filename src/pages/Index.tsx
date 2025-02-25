
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, AlertTriangle, Upload, Trash2 } from "lucide-react";

const Index = () => {
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
            className="flex items-center gap-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white"
            onClick={() => {}} // Bouton complètement inactif
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
              className="hidden"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button 
            type="button"
            className="bg-[#E67E22] hover:bg-[#D35400] text-white border-none transition-colors flex items-center gap-2"
          >
            Generate Scripts
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
