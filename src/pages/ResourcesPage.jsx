import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ResourcesProvider, useResources } from '../context/ResourcesContext';
import { getResourceCategoryTone } from '../lib/resourceCategoryTone';

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function ResourcesPageContent() {
  const { articles } = useResources();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const requestedCategory = searchParams.get('category') || 'all';
  const category = categories.includes(requestedCategory) ? requestedCategory : 'all';

  const filtered = useMemo(() => {
    const needle = normalizeSearchText(query);
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
      ].map(normalizeSearchText).join(' ').includes(needle);
    });
  }, [publishedArticles, category, query]);

  return (
    <div className="resources-native-page">
      <section className="resources-native-hero">
        <div className="ag-panel-rail">
          <h1>Resource Library</h1>
        </div>
      </section>

      <section className="resources-native-filters">
        <div className="ag-panel-rail">
          <div className="resources-native-filter-row">
            <div className="resources-native-filter-field">
              <label className="sr-only" htmlFor="resources-type-search">
                Search
              </label>
              <input
                id="resources-type-search"
                type="search"
                value={query}
                placeholder="Search for"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="resources-native-filter-field">
              <label className="sr-only" htmlFor="resources-type-category">
                Category
              </label>
              <select
                id="resources-type-category"
                value={category}
                onChange={(event) => {
                  const nextCategory = event.target.value;
                  setSearchParams((current) => {
                    const next = new URLSearchParams(current);
                    if (nextCategory === 'all') {
                      next.delete('category');
                    } else {
                      next.set('category', nextCategory);
                    }
                    return next;
                  });
                }}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === 'all' ? 'Select category' : item}
                  </option>
                ))}
              </select>
            </div>
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
                  <span className={`resources-native-card-category is-tone-${getResourceCategoryTone(article.category)}`}>
                    {article.category || 'Article'}
                  </span>
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
