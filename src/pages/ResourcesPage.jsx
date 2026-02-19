import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResourcesProvider, useResources } from '../context/ResourcesContext';

function ResourcesPageContent() {
  const { articles } = useResources();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  const publishedArticles = useMemo(
    () => articles.filter((item) => item.type === 'article' && item.isPublished),
    [articles],
  );

  const categories = useMemo(() => {
    const set = new Set();
    publishedArticles.forEach((item) => {
      if (item.category) {
        set.add(item.category);
      }
    });
    return ['all', ...Array.from(set)];
  }, [publishedArticles]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return publishedArticles.filter((item) => {
      if (category !== 'all' && item.category !== category) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return [
        item.title,
        item.category,
        item.excerpt,
      ].join(' ').toLowerCase().includes(needle);
    });
  }, [publishedArticles, category, query]);

  return (
    <div className="resources-native-page">
      <section className="resources-native-hero">
        <div className="ag-panel-rail">
          <h1>Resource Library</h1>
          <p>Articles, guides, and practical planning tools for church and personal stewardship.</p>
        </div>
      </section>

      <section className="resources-native-filters">
        <div className="ag-panel-rail">
          <div className="resources-native-filter-row">
            <label htmlFor="resources-type-search">
              Search
              <input
                id="resources-type-search"
                type="search"
                value={query}
                placeholder="Search resources"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <label htmlFor="resources-type-category">
              Category
              <select
                id="resources-type-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === 'all' ? 'All categories' : item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="resources-native-grid-wrap">
        <div className="ag-panel-rail">
          <div className="resources-native-grid">
            {filtered.map((article) => (
              <article key={article.id} className="resources-native-card">
                {article.imageUrl ? (
                  <Link to={`/resources/article/${encodeURIComponent(article.slug)}`} className="resources-native-card-image">
                    <img src={article.imageUrl} alt={article.title} loading="lazy" />
                  </Link>
                ) : null}

                <div className="resources-native-card-copy">
                  <span className="resources-native-card-category">{article.category || 'Article'}</span>
                  <h2>
                    <Link to={`/resources/article/${encodeURIComponent(article.slug)}`}>{article.title}</Link>
                  </h2>
                  {article.excerpt ? <p>{article.excerpt}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <ResourcesProvider>
      <ResourcesPageContent />
    </ResourcesProvider>
  );
}
