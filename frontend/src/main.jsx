// src/main.jsx
import React from 'react'; // Import React if not already implicitly available in your Vite setup
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from "react-router-dom"; // CORRECTED IMPORT
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
  <React.StrictMode> {/* Optional: Good for development */}
    <BrowserRouter>
      <AuthProvider> {/* AuthProvider wraps App and its descendants */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);