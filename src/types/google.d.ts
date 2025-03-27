
declare namespace google {
  interface ScriptApp {
    run: any;
  }
  
  const script: {
    run: {
      withSuccessHandler: (callback: (response: any) => void) => any;
      withFailureHandler: (callback: (error: any) => void) => any;
      handleFileSelect: (content: string) => void;
      getDraft: () => void;
      generateScripts: (data: any) => void;
      exportCSV: (data: any) => void;
      deleteForm: () => void;
      saveNES: (data: any) => void;
    }
  };
}
