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
import './utils/clearStorage.js'; // Utilitários de limpeza de storage

ReactDOM.createRoot(document.getElementById('root')).render(
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
);