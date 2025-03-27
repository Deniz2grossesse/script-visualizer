
declare const google: {
  script: {
    run: {
      withSuccessHandler: (successCallback: (response: any) => void) => {
        withFailureHandler: (failureCallback: (error: any) => void) => void
      }
    }
  }
};
