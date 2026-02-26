import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { sitePages } from '../data/siteMap';
import { useDocuments } from '../context/DocumentsContext';

function normalize(text) {
  return (text || '').toLowerCase().trim();
}

export default function SearchPage() {
  const { documents } = useDocuments();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const term = normalize(query);
  const searchablePages = useMemo(
    () => sitePages.filter((page) => !page.path.startsWith('/admin/')),
    [],
  );
  const prospectusDocs = useMemo(
    () => (Array.isArray(documents) ? documents : [])
      .filter((doc) => doc.active && doc.category === 'prospectus' && doc.url)
      .map((doc) => ({
        title: doc.title,
        href: doc.url,
        key: `prospectus-doc:${doc.id}`,
        path: '/prospectus',
        section: 'Prospectus Documents',
        excerpt: doc.kind === 'web-form' ? 'Web form' : 'PDF document',
        resultType: 'document',
        documentId: doc.id,
      })),
    [documents],
  );

  const searchableItems = useMemo(
    () => [...searchablePages, ...prospectusDocs],
    [searchablePages, prospectusDocs],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matches = useMemo(() => {
    if (!term) {
      return [];
    }
    return searchableItems
      .filter((item) => {
        const haystack = `${item.title} ${item.path} ${item.section} ${item.excerpt || ''}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => {
        const aTitle = normalize(a.title);
        const bTitle = normalize(b.title);
        const aExact = Number(aTitle.includes(term) || normalize(a.path).includes(term));
        const bExact = Number(bTitle.includes(term) || normalize(b.path).includes(term));
        return bExact - aExact || a.path.localeCompare(b.path);
      });
  }, [searchableItems, term]);

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
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try: retirement, insurance, calculators, rates"
        />

        {term ? (
          <div className="search-page-results">
            <p>{matches.length} result(s)</p>
            <ul>
              {matches.map((item) => (
                <li key={item.key || item.path}>
                  {'href' in item && item.href ? (
                    <a href={item.href} target="_blank" rel="noreferrer noopener">{item.title}</a>
                  ) : (
                    <Link to={item.path}>{item.title}</Link>
                  )}
                  <span>{item.path}</span>
                  {'excerpt' in item && item.excerpt ? <span>{item.excerpt}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
