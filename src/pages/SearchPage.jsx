import SiteSearchPanel from '../components/SiteSearchPanel';
import { useDocuments } from '../context/DocumentsContext';
import { ResourcesProvider, useResources } from '../context/ResourcesContext';

function SearchPageContent() {
  const { documents } = useDocuments();
  const { publishedArticles } = useResources();

  return (
    <div className="search-page">
      <div className="ag-panel-rail">
        <h1>Search</h1>
        <p>Look for anything anywhere.</p>
        <SiteSearchPanel
          variant="page"
          documents={documents}
          articles={publishedArticles}
          autoFocus
          showPageLabel={false}
        />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <ResourcesProvider>
      <SearchPageContent />
    </ResourcesProvider>
  );
}
