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
import { RedirectsProvider } from './context/RedirectsContext';
import { DocumentsProvider } from './context/DocumentsContext';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnnouncementProvider>
      <ContentAdminProvider>
        <ConsultantsProvider>
          <CareersJobsProvider>
            <RedirectsProvider>
              <DocumentsProvider>
                <RatesProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </RatesProvider>
              </DocumentsProvider>
            </RedirectsProvider>
          </CareersJobsProvider>
        </ConsultantsProvider>
      </ContentAdminProvider>
    </AnnouncementProvider>
  </React.StrictMode>
);
