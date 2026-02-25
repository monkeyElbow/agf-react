import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { RatesProvider } from './context/RatesContext';
import { ContentAdminProvider } from './context/ContentAdminContext';
import { AnnouncementProvider } from './context/AnnouncementContext';
import { ConsultantsProvider } from './context/ConsultantsContext';
import { CareersJobsProvider } from './context/CareersJobsContext';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnnouncementProvider>
      <ContentAdminProvider>
        <ConsultantsProvider>
          <CareersJobsProvider>
            <RatesProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </RatesProvider>
          </CareersJobsProvider>
        </ConsultantsProvider>
      </ContentAdminProvider>
    </AnnouncementProvider>
  </React.StrictMode>
);
