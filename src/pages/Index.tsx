
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Success",
        description: "The action was completed successfully.",
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">One Click Onboarding</h1>
      
      <Tabs defaultValue="home" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>
        
        <TabsContent value="home" className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to One Click Onboarding</h2>
            <p className="text-gray-600 mb-4">
              This application helps you streamline your onboarding process with just a few clicks.
            </p>
            
            <Button onClick={handleAction} disabled={loading}>
              {loading ? "Processing..." : "Get Started"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="about" className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">About This Application</h2>
            <p className="text-gray-600">
              One Click Onboarding is designed to simplify and accelerate the process of adding new systems to your infrastructure.
              Upload your CSV files, manage your configurations, and generate scripts in seconds.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="help" className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <p className="text-gray-600">
              If you need assistance using this application, please refer to the documentation or contact support.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
