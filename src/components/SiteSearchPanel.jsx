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

function SearchResultLink({ item, resultId, linkRef, isActive, onMouseEnter }) {
  const linkProps = {
    id: resultId,
    ref: linkRef,
    className: isActive ? 'is-keyboard-active' : undefined,
    'data-keyboard-active': isActive ? 'true' : undefined,
    onMouseEnter,
  };

  if ('href' in item && item.href) {
    return (
      <a {...linkProps} href={item.href} target="_blank" rel="noreferrer noopener">
        {item.title}
      </a>
    );
  }

  return <Link {...linkProps} to={item.path}>{item.title}</Link>;
}

export default function SiteSearchPanel({
  articles = [],
  documents = [],
  variant = 'page',
  autoFocus = false,
  label = 'Search all pages',
  showPageLabel = true,
  placeholder = 'Try: retirement, insurance, calculators, rates',
  onQueryStateChange,
}) {
  const generatedInputId = useId();
  const inputId = `site-search-input-${generatedInputId}`;
  const resultsId = `site-search-results-${generatedInputId}`;
  const inputRef = useRef(null);
  const resultLinkRefs = useRef([]);
  const { blocksByPath } = useContentAdmin();
  const [query, setQuery] = useState('');
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
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

  useEffect(() => {
    onQueryStateChange?.(hasTypedTerm);
  }, [hasTypedTerm, onQueryStateChange]);

  const matches = useMemo(
    () => searchSiteIndex(searchableItems, deferredTerm),
    [searchableItems, deferredTerm],
  );

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };
  const groupedMatches = useMemo(
    () => groupSiteSearchMatches(matches),
    [matches],
  );
  const navigableMatches = useMemo(
    () => groupedMatches.flatMap((group) => group.items),
    [groupedMatches],
  );

  useEffect(() => {
    setActiveResultIndex(-1);
    resultLinkRefs.current = [];
  }, [deferredTerm]);

  useEffect(() => {
    if (activeResultIndex >= navigableMatches.length) {
      setActiveResultIndex(-1);
    }
  }, [activeResultIndex, navigableMatches.length]);

  useEffect(() => {
    resultLinkRefs.current[activeResultIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeResultIndex]);

  const handleSearchInputKeyDown = (event) => {
    if (event.key === 'ArrowDown' && navigableMatches.length) {
      event.preventDefault();
      setActiveResultIndex((current) => (
        current < 0 ? 0 : Math.min(current + 1, navigableMatches.length - 1)
      ));
      return;
    }

    if (event.key === 'ArrowUp' && activeResultIndex >= 0) {
      event.preventDefault();
      setActiveResultIndex((current) => (current <= 0 ? -1 : current - 1));
      return;
    }

    if (event.key === 'Enter' && activeResultIndex >= 0) {
      event.preventDefault();
      resultLinkRefs.current[activeResultIndex]?.click();
      return;
    }

    if (event.key === 'Escape' && activeResultIndex >= 0) {
      event.preventDefault();
      setActiveResultIndex(-1);
    }
  };

  const resultLinkProps = (item) => {
    const resultIndex = navigableMatches.indexOf(item);
    return {
      resultId: `${resultsId}-result-${resultIndex}`,
      linkRef: (node) => {
        resultLinkRefs.current[resultIndex] = node;
      },
      isActive: resultIndex === activeResultIndex,
      onMouseEnter: () => setActiveResultIndex(resultIndex),
    };
  };

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
          onKeyDown={handleSearchInputKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          aria-controls={resultsId}
          aria-expanded={Boolean(hasTypedTerm && navigableMatches.length)}
          aria-activedescendant={activeResultIndex >= 0 ? `${resultsId}-result-${activeResultIndex}` : undefined}
        />
        <div id={resultsId} className="home-return-assist-results-shell" aria-live="polite">
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
                          <SearchResultLink item={item} {...resultLinkProps(item)} />
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

  const isHeaderVariant = variant === 'header';

  return (
    <div className={`site-search-panel ${isHeaderVariant ? 'site-search-panel--header' : 'site-search-panel--page'}`}>
      <label htmlFor={inputId} className={showPageLabel ? 'search-page-label' : 'sr-only'}>{label}</label>
      {isHeaderVariant ? (
        <div className="site-search-input-wrap">
          <input
            id={inputId}
            type="search"
            className="site-search-input search-page-input site-header-search-input"
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchInputKeyDown}
            placeholder={placeholder}
            aria-controls={resultsId}
            aria-expanded={Boolean(hasTypedTerm && navigableMatches.length)}
            aria-activedescendant={activeResultIndex >= 0 ? `${resultsId}-result-${activeResultIndex}` : undefined}
          />
          {hasTypedTerm ? (
            <button type="button" className="site-header-search-clear" onClick={clearQuery} aria-label="Clear search">
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      ) : (
        <input
          id={inputId}
          type="search"
          className="site-search-input search-page-input"
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchInputKeyDown}
          placeholder={placeholder}
          aria-controls={resultsId}
          aria-expanded={Boolean(hasTypedTerm && navigableMatches.length)}
          aria-activedescendant={activeResultIndex >= 0 ? `${resultsId}-result-${activeResultIndex}` : undefined}
        />
      )}

      {typedTerm ? (
        <div id={resultsId} className="search-page-results">
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
                        <SearchResultLink item={item} {...resultLinkProps(item)} />
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
