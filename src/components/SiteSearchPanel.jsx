import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import {
  buildSiteSearchIndex,
  groupSiteSearchMatches,
  normalizeSiteSearchText,
  resultTypeLabel,
  searchSiteIndex,
} from '../lib/siteSearch';

function SearchResultLink({ item }) {
  if ('href' in item && item.href) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer noopener">
        {item.title}
      </a>
    );
  }

  return <Link to={item.path}>{item.title}</Link>;
}

export default function SiteSearchPanel({
  articles = [],
  documents = [],
  variant = 'page',
  autoFocus = false,
  label = 'Search all pages',
  showPageLabel = true,
  placeholder = 'Try: retirement, insurance, calculators, rates',
}) {
  const generatedInputId = useId();
  const inputId = `site-search-input-${generatedInputId}`;
  const inputRef = useRef(null);
  const { blocksByPath } = useContentAdmin();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const typedTerm = normalizeSiteSearchText(query);
  const deferredTerm = normalizeSiteSearchText(deferredQuery);
  const hasTypedTerm = Boolean(typedTerm);
  const searchableItems = useMemo(
    () => buildSiteSearchIndex({ articles, documents, blocksByPath }),
    [articles, documents, blocksByPath],
  );

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const matches = useMemo(
    () => searchSiteIndex(searchableItems, deferredTerm),
    [searchableItems, deferredTerm],
  );
  const groupedMatches = useMemo(
    () => groupSiteSearchMatches(matches),
    [matches],
  );

  if (variant === 'return-assist') {
    return (
      <div className={`site-search-panel site-search-panel--return-assist${hasTypedTerm ? ' is-active' : ''}`}>
        <label className="sr-only" htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
          type="search"
          className="site-search-input home-return-assist-search-input"
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        <div className="home-return-assist-results-shell" aria-live="polite">
          {hasTypedTerm ? (
            <p className="home-return-assist-results-count">
              {matches.length} result{matches.length === 1 ? '' : 's'}
            </p>
          ) : null}
          <div className="home-return-assist-results-scroll">
            {groupedMatches.length ? (
              <div className="home-return-assist-groups">
                {groupedMatches.map((group) => (
                  <section key={`return-search-group-${group.group}`} className="home-return-assist-group-card" aria-label={group.label}>
                    <header className="home-return-assist-group-head">
                      <h2>{group.label}</h2>
                      <span>{group.items.length}</span>
                    </header>
                    <ul className="home-return-assist-group-list">
                      {group.items.map((item) => (
                        <li key={item.key || item.path} className="home-return-assist-result-item">
                          <SearchResultLink item={item} />
                          <span className="home-return-assist-result-path">{item.path}</span>
                          <span className="home-return-assist-result-meta">{item.section} • {resultTypeLabel(item.resultType)}</span>
                          {item.excerpt ? <span className="home-return-assist-result-excerpt">{item.excerpt}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : hasTypedTerm ? (
              <p className="home-return-assist-empty">No matches found for “{query.trim()}”.</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="site-search-panel site-search-panel--page">
      <label htmlFor={inputId} className={showPageLabel ? 'search-page-label' : 'sr-only'}>{label}</label>
      <input
        id={inputId}
        type="search"
        className="site-search-input search-page-input"
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
      />

      {typedTerm ? (
        <div className="search-page-results">
          <p>{matches.length} result(s)</p>
          {groupedMatches.length ? (
            <div className="search-page-groups">
              {groupedMatches.map((group) => (
                <section key={`search-group-${group.group}`} className="search-page-group-card" aria-label={group.label}>
                  <header className="search-page-group-head">
                    <h2>{group.label}</h2>
                    <span>{group.items.length}</span>
                  </header>
                  <ul className="search-page-group-list">
                    {group.items.map((item) => (
                      <li key={item.key || item.path} className="search-page-result-item">
                        <SearchResultLink item={item} />
                        <span>{item.path}</span>
                        <span>{item.section} • {resultTypeLabel(item.resultType)}</span>
                        {item.excerpt ? <span>{item.excerpt}</span> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <p>No matches found for “{query.trim()}”.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
