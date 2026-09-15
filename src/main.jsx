import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/admin-globals.css';
import './styles/admin-layout.css';
import './styles/admin-dashboard.css';
import './styles/admin-tables.css';
import './styles/admin-modals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);