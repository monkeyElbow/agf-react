import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { RatesProvider } from './context/RatesContext';
import { ContentAdminProvider } from './context/ContentAdminContext';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ContentAdminProvider>
      <RatesProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RatesProvider>
    </ContentAdminProvider>
  </React.StrictMode>
);
