import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { RatesProvider } from './context/RatesContext';
import ContentAdminProvider from './context/FastContentAdminProvider';
import { AnnouncementProvider } from './context/AnnouncementContext';
import { ConsultantsProvider } from './context/ConsultantsContext';
import { CareersJobsProvider } from './context/CareersJobsContext';
import { RedirectsProvider } from './context/RedirectsContext';
import { DocumentsProvider } from './context/DocumentsContext';
import { ConsultantResponsesProvider } from './context/ConsultantResponsesContext';
import { TestimonialsProvider } from './context/TestimonialsContext';
import { DisclosuresProvider } from './context/DisclosuresContext';
import { ChartsProvider } from './context/ChartsContext';

function renderApp() {
  createRoot(document.getElementById('root')).render(
    <AnnouncementProvider>
      <ContentAdminProvider>
        <ConsultantsProvider>
          <ConsultantResponsesProvider>
            <CareersJobsProvider>
              <RedirectsProvider>
                <TestimonialsProvider>
                  <DisclosuresProvider>
                    <ChartsProvider>
                      <DocumentsProvider>
                        <RatesProvider>
                          <BrowserRouter>
                            <App />
                          </BrowserRouter>
                        </RatesProvider>
                      </DocumentsProvider>
                    </ChartsProvider>
                  </DisclosuresProvider>
                </TestimonialsProvider>
              </RedirectsProvider>
            </CareersJobsProvider>
          </ConsultantResponsesProvider>
        </ConsultantsProvider>
      </ContentAdminProvider>
    </AnnouncementProvider>,
  );
}

renderApp();
