import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import { StorageService } from '../services/storage';
import '../index.css';

// Initialize storage before rendering app
StorageService.initialize().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
