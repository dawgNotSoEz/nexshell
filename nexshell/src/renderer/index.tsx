import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/variables.css';
import './styles/intro-animations.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Unable to find root element for NexShell renderer.');
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
