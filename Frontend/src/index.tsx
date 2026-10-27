// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './validation';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Migration douce des anciennes sessions : departements -> divisions
try {
  const existing = localStorage.getItem('divisions');
  const legacy = localStorage.getItem('departements');
  if (!existing && legacy) {
    localStorage.setItem('divisions', legacy);
  }
  if (!localStorage.getItem('divisions')) {
    const user = JSON.parse(localStorage.getItem('utilisateur') || 'null');
    if (user?.division) localStorage.setItem('divisions', JSON.stringify([user.division]));
  }
  localStorage.removeItem('departements');
  localStorage.removeItem('archive_module');
} catch {
  // stockage local indisponible : ignorer
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
