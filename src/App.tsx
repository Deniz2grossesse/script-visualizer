
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <iframe 
        src="index.html" 
        style={{ width: '100%', height: '100vh', border: 'none' }} 
        title="Network Rules Generator"
      />
    </div>
  );
}

export default App;
