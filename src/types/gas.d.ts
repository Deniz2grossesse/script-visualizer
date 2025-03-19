
declare namespace google {
  namespace script {
    namespace run {
      function withSuccessHandler(handler: (response: any) => void): typeof google.script.run;
      function withFailureHandler(handler: (error: Error) => void): typeof google.script.run;
      function generateScripts(data: any): void;
      function handleFileSelect(fileData: string): void;
      function saveDraft(formData: any): void;
      function getDraft(): void;
      function deleteForm(): void;
      function exportCSV(modifiedLines: any[]): void;
    }
  }
}
