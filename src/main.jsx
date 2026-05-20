import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { RatesProvider } from './context/RatesContext';
import { bootstrapSharedContentAdminState, ContentAdminProvider } from './context/ContentAdminContext';
import { AnnouncementProvider } from './context/AnnouncementContext';
import { ConsultantsProvider } from './context/ConsultantsContext';
import { CareersJobsProvider } from './context/CareersJobsContext';
import { RedirectsProvider } from './context/RedirectsContext';
import { DocumentsProvider } from './context/DocumentsContext';
import { ConsultantResponsesProvider } from './context/ConsultantResponsesContext';
import { TestimonialsProvider } from './context/TestimonialsContext';

async function renderApp() {
  const initialContentAdminState = await bootstrapSharedContentAdminState();

  createRoot(document.getElementById('root')).render(
    <AnnouncementProvider>
      <ContentAdminProvider initialState={initialContentAdminState}>
        <ConsultantsProvider>
          <ConsultantResponsesProvider>
            <CareersJobsProvider>
              <RedirectsProvider>
                <TestimonialsProvider>
                  <DocumentsProvider>
                    <RatesProvider>
                      <BrowserRouter>
                        <App />
                      </BrowserRouter>
                    </RatesProvider>
                  </DocumentsProvider>
                </TestimonialsProvider>
              </RedirectsProvider>
            </CareersJobsProvider>
          </ConsultantResponsesProvider>
        </ConsultantsProvider>
      </ContentAdminProvider>
    </AnnouncementProvider>,
  );
}

void renderApp();
