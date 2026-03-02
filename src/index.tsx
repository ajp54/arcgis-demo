import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // StrictMode is intentionally kept — ArcGIS MapView cleanup in useEffect
  // handles the double-mount correctly via view.destroy().
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
