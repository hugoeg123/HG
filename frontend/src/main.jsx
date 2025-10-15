/**
 * Arquivo principal do frontend
 * 
 * Inicializa a aplicação React e configura o roteamento
 * 
 * Integra com: App.jsx para renderização do componente principal
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './overrides.css'; // UI theme overrides: subtle outlines and no yellow/amber
import './utils/clearStorage.js'; // Utilitários de limpeza de storage
import { initThemeFill } from './utils/themeFill'; // Hook: Applies background fill from nested elements to target divs

// Initialize theme fill utility (idempotent)
initThemeFill();

ReactDOM.createRoot(document.getElementById('root')).render(
  import.meta.env.MODE === 'production' ? (
    <React.StrictMode>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <App />
      </BrowserRouter>
    </React.StrictMode>
  ) : (
    // Desabilitar StrictMode em desenvolvimento para evitar logs/chamadas duplicadas causadas por double-invocation do React 18
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  )
);