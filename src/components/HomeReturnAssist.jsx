import { useDocuments } from '../context/DocumentsContext';
import { ResourcesProvider, useResources } from '../context/ResourcesContext';
import SiteSearchPanel from './SiteSearchPanel';

function HomeReturnAssistSearchPanel() {
  const { documents } = useDocuments();
  const { articles } = useResources();

  return (
    <SiteSearchPanel
      variant="return-assist"
      documents={documents}
      articles={articles}
      placeholder="What can we help you find?"
      label="What can we help you find?"
      autoFocus
    />
  );
}

export default function HomeReturnAssist({ onDismiss }) {
  return (
    <section className="home-return-assist" aria-label="Return assist">
      <ResourcesProvider>
        <div className="home-return-assist-panel">
          <div className="home-return-assist-search-shell">
            <HomeReturnAssistSearchPanel />
          </div>
          <button
            type="button"
            className="home-return-assist-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss return assist"
          >
            ×
          </button>
        </div>
      </ResourcesProvider>
    </section>
  );
}
