import { Link, Navigate, useParams } from 'react-router-dom';
import { ResourcesProvider, useResources } from '../context/ResourcesContext';

function ResourceArticlePageContent() {
  const { slug: slugParam } = useParams();
  const { articles } = useResources();
  const slug = decodeURIComponent(slugParam || '').toLowerCase();

  const article = articles.find((item) => item.slug === slug && item.type === 'article');
  if (!article) {
    return <Navigate to="/resources" replace />;
  }

  return (
    <article className="resources-native-article-page">
      <header className="resources-native-article-hero">
        <div className="ag-panel-rail">
          <Link to="/resources" className="resources-native-back-link">Back to resources</Link>
          <p className="resources-native-article-kicker">{article.category || 'Article'}</p>
          <h1>{article.title}</h1>
        </div>
      </header>

      {article.imageUrl ? (
        <section className="resources-native-article-image-wrap">
          <div className="ag-panel-rail">
            <img src={article.imageUrl} alt={article.title} className="resources-native-article-image" />
          </div>
        </section>
      ) : null}

      <section className="resources-native-article-content-wrap">
        <div className="ag-panel-rail">
          <div
            className="resources-native-article-content"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml || '<p>Article content unavailable.</p>' }}
          />
          {article.sourceUrl ? (
            <p className="resources-native-article-source">
              Source:{' '}
              <a href={article.sourceUrl} target="_blank" rel="noreferrer noopener">
                {article.sourceUrl}
              </a>
            </p>
          ) : null}
        </div>
      </section>
    </article>
  );
}

export default function ResourceArticlePage() {
  return (
    <ResourcesProvider>
      <ResourceArticlePageContent />
    </ResourcesProvider>
  );
}
