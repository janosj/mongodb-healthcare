import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';               // ODL / Schema Evolution Demo
import SearchApp from './SearchApp';   // Atlas Search Demo

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to ODL demo */}
        <Route path="/" element={<Navigate to="/odl" replace />} />
        
        {/* Window 1: ODL Ingestion Demo */}
        <Route path="/odl" element={<App />} />
        
        {/* Window 2: Atlas Search Demo */}
        <Route path="/search" element={<SearchApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

