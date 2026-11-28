import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './styles.css';

import { initInstallButton } from './install.js';

// Offer an "Install app" button when the browser allows it and the app isn't installed yet.
initInstallButton({ appName: 'Chore Champs', selector: '.app-header' });

// Register the service worker so the app shell works offline.
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
