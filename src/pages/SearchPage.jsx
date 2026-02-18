import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { sitePages } from '../data/siteMap';

function normalize(text) {
  return (text || '').toLowerCase().trim();
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [indexEntries, setIndexEntries] = useState([]);
  const [indexReady, setIndexReady] = useState(false);
  const term = normalize(query);

  useEffect(() => {
    let mounted = true;

    fetch('/wp-content/search-index.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!mounted) {
          return;
        }
        setIndexEntries(Array.isArray(payload?.entries) ? payload.entries : []);
      })
      .catch(() => {
        if (mounted) {
          setIndexEntries([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setIndexReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const matches = useMemo(() => {
    if (!term) {
      return [];
    }

    if (!indexEntries.length) {
      return sitePages.filter((page) => {
        const haystack = `${page.title} ${page.path} ${page.section}`.toLowerCase();
        return haystack.includes(term);
      });
    }

    return indexEntries
      .filter((entry) => {
        const haystack = `${entry.title} ${entry.path} ${entry.section} ${entry.text}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => {
        const aTitle = normalize(a.title);
        const bTitle = normalize(b.title);
        const aExact = Number(aTitle.includes(term) || normalize(a.path).includes(term));
        const bExact = Number(bTitle.includes(term) || normalize(b.path).includes(term));
        return bExact - aExact || a.path.localeCompare(b.path);
      });
  }, [term, indexEntries]);

  return (
    <div className="search-page">
      <div className="ag-panel-rail">
        <h1>Search</h1>
        <p>Find pages across services, resources, legal, and company information.</p>
        <label htmlFor="site-search-input" className="search-page-label">Search all pages</label>
        <input
          id="site-search-input"
          type="search"
          className="search-page-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try: retirement, insurance, calculators, rates"
        />

        {term ? (
          <div className="search-page-results">
            <p>{matches.length} result(s)</p>
            <ul>
              {matches.map((page) => (
                <li key={page.path}>
                  <Link to={page.path}>{page.title}</Link>
                  <span>{page.path}</span>
                  {'excerpt' in page && page.excerpt ? <span>{page.excerpt}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!term && !indexReady ? <p>Loading search index...</p> : null}
      </div>
    </div>
  );
}
