import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import { useDocuments } from '../context/DocumentsContext';
import { isPageHiddenFromSitemap } from '../data/siteMap';

function SitemapRouteSection() {
  const { pageHierarchy } = useContentAdmin();
  const searchId = useId();
  const sectionId = useId();
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const sectionLabelMap = {
    Core: 'General',
  };

  const groups = useMemo(() => {
    const pages = Object.values(pageHierarchy || {}).filter((page) => (
      !page.path.startsWith('/admin/')
      && page.path !== '/search'
      && !isPageHiddenFromSitemap(page)
    ));
    const grouped = pages.reduce((acc, page) => {
      if (!acc[page.section]) {
        acc[page.section] = [];
      }
      acc[page.section].push(page);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([section, items]) => [
        section,
        [...items].sort((a, b) => a.title.localeCompare(b.title)),
      ])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [pageHierarchy]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups
      .map(([section, pages]) => {
        if (sectionFilter !== 'all' && section !== sectionFilter) {
          return [section, []];
        }
        const filteredPages = needle
          ? pages.filter((page) => (`${page.title} ${page.path}`.toLowerCase().includes(needle)))
          : pages;
        return [section, filteredPages];
      })
      .filter(([, pages]) => pages.length);
  }, [groups, query, sectionFilter]);

  return (
    <section className="service-native-section native-sitemap-section">
      <div className="ag-panel-rail">
        <div className="native-sitemap-tools">
          <label htmlFor={searchId}>
            <span className="sr-only">Find page</span>
            <input
              id={searchId}
              type="search"
              value={query}
              placeholder="Try: rates, calculators, contact"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label htmlFor={sectionId}>
            <span className="sr-only">Section</span>
            <select
              id={sectionId}
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
            >
              <option value="all">All sections</option>
              {groups.map(([section]) => (
                <option key={`sitemap-section-${section}`} value={section}>
                  {sectionLabelMap[section] || section}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredGroups.length ? (
          <div className="native-sitemap-grid">
            {filteredGroups.map(([section, pages]) => (
              <div key={section} className="native-info-links-block native-sitemap-group">
                <h3>{sectionLabelMap[section] || section}</h3>
                <ul className="native-info-link-list">
                  {pages.map((page) => (
                    <li key={page.path}>
                      <Link className="service-native-btn is-tone-atlantean" to={page.path}>{page.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="native-sitemap-empty">
            <p>No pages match your filter.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSectionFilter('all');
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProspectusRouteSection({ sections, actions, ActionRenderer, NativeLinkRenderer }) {
  const [query, setQuery] = useState('');
  const docsSection = Array.isArray(sections)
    ? sections.find((section) => Array.isArray(section?.links) && section.links.length)
    : null;
  const docs = Array.isArray(docsSection?.links) ? docsSection.links : [];
  const filteredDocs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return docs;
    }
      return docs.filter((item) => String(item.label || '').toLowerCase().includes(needle));
  }, [docs, query]);

  return (
    <section className="service-native-section native-prospectus-section">
      <div className="ag-panel-rail">
        <div className="native-prospectus-tools">
          {Array.isArray(actions) && actions.length ? (
            <div className="native-prospectus-tools-actions">
              {actions.map((item) => (
                <ActionRenderer
                  key={`${item.label}-${item.to || item.href || item.documentId}`}
                  item={{
                    ...item,
                    className: `${item.className ? `${item.className} ` : ''}is-outline is-tone-atlantean native-prospectus-download-btn`.trim(),
                  }}
                />
              ))}
            </div>
          ) : null}
          <label htmlFor="prospectus-doc-search" className="native-prospectus-search">
            <input
              id="prospectus-doc-search"
              type="search"
              aria-label="Search documents"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents"
            />
          </label>
          <p className="native-prospectus-count">
            {filteredDocs.length} of {docs.length} documents
          </p>
        </div>
          <div className="native-prospectus-grid">
          {filteredDocs.map((item) => (
            <article key={`${item.label}-${item.href || item.to || item.documentId}`} className="native-prospectus-card">
              <h3>{item.label}</h3>
              <div className="service-native-action-row native-prospectus-card-actions">
                <NativeLinkRenderer
                  item={item}
                  className="service-native-btn is-outline is-tone-atlantean"
                >
                  View
                </NativeLinkRenderer>
              </div>
            </article>
          ))}
        </div>
        {!filteredDocs.length ? (
          <p className="native-prospectus-empty">No documents match your search.</p>
        ) : null}
      </div>
    </section>
  );
}

function FormsLibraryRouteSection({ seedForms, NativeLinkRenderer }) {
  const categoryId = useId();
  const [query, setQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const { documents } = useDocuments();
  const forms = useMemo(() => {
    const libraryDocs = Array.isArray(documents)
      ? documents.filter((doc) => doc.active && doc.category === 'form' && doc.url)
        .map((doc) => ({
          topic: doc.topic || 'Other',
          label: doc.title,
          href: doc.url,
          documentId: doc.id,
        }))
      : [];

    if (libraryDocs.length) {
      return libraryDocs;
    }

    return Array.isArray(seedForms) ? seedForms : [];
  }, [documents, seedForms]);

  const formTopics = useMemo(() => (
    Array.from(new Set(forms.map((item) => String(item.topic || 'Other').trim() || 'Other')))
      .sort((a, b) => a.localeCompare(b))
  ), [forms]);

  const filteredForms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return forms.filter((item) => {
      const topic = String(item.topic || 'Other').trim() || 'Other';
      if (topicFilter !== 'all' && topic !== topicFilter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = `${topic} ${item.label || ''} ${item.href || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [forms, query, topicFilter]);

  const groups = useMemo(() => {
    const grouped = filteredForms.reduce((acc, item) => {
      const topic = String(item.topic || 'Other');
      if (!acc[topic]) {
        acc[topic] = [];
      }
      acc[topic].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([topic, items]) => [
        topic,
        [...items].sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''))),
      ])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredForms]);

  return (
    <section className="service-native-section native-forms-section">
      <div className="ag-panel-rail">
        <div className="native-forms-tools">
          <label htmlFor="forms-library-search" className="native-prospectus-search native-forms-search">
            <span className="native-forms-search-label">Search forms</span>
            <input
              id="forms-library-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Start typing to search"
            />
          </label>
          <label htmlFor={categoryId} className="native-forms-category">
            <span className="native-forms-search-label">Category</span>
            <select
              id={categoryId}
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {formTopics.map((topic) => (
                <option key={`forms-topic-${topic}`} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>
        </div>

        {groups.length ? (
          <div className="native-forms-grid">
            {groups.map(([topic, items]) => (
              <article key={topic} className="native-forms-group">
                <div className="native-forms-group-head">
                  <h3>{topic}</h3>
                </div>
                <ul className="native-forms-list">
                  {items.map((item) => (
                    <li key={`${item.topic}-${item.label}-${item.href}`}>
                      <NativeLinkRenderer item={item} />
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : null}

        {!groups.length ? (
          <p className="native-forms-empty">No forms match your search.</p>
        ) : null}
      </div>
    </section>
  );
}

function formatCareersPostedDate(value) {
  const iso = String(value || '').trim();
  if (!iso) {
    return '';
  }
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isNativeCareersJobsSection(section) {
  return String(section?.className || '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .includes('careers-native-jobs-list');
}

export function buildCareersRouteSections({ pathname, sections, getVisibleJobs }) {
  if (pathname !== '/about-us/careers') {
    return Array.isArray(sections) ? sections : [];
  }

  const jobs = typeof getVisibleJobs === 'function'
    ? getVisibleJobs().map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      summary: job.summary,
      note: job.note,
      postedDate: formatCareersPostedDate(job.postedDate),
      applyUrl: job.applyUrl,
      buttonLabel: job.buttonLabel || 'Apply Online',
    }))
    : [];

  return (Array.isArray(sections) ? sections : []).map((section) => {
    if (!isNativeCareersJobsSection(section)) {
      return section;
    }
    return {
      ...section,
      jobs,
    };
  });
}

export function NativeCareersJobsSection({ jobs }) {
  const items = Array.isArray(jobs) ? jobs : [];

  if (!items.length) {
    return <p className="native-info-location-empty">There are currently no open positions to display.</p>;
  }

  return (
    <div className="careers-native-jobs-list-wrap">
      {items.map((job) => (
        <article key={job.id || job.title} className="careers-native-job">
          <h3>{job.title}</h3>
          {job.location ? <p className="careers-native-job-location">{job.location}</p> : null}
          {job.postedDate ? <p className="careers-native-job-posted">Posted {job.postedDate}</p> : null}
          {job.summary ? <p className="careers-native-job-summary">{job.summary}</p> : null}
          {job.note ? <p className="careers-native-job-note"><em>{job.note}</em></p> : null}
          {job.applyUrl ? (
            <div className="service-native-action-row is-centered">
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="service-native-btn is-outline is-tone-atlantean"
              >
                {job.buttonLabel || 'Apply Online'}
              </a>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function NativeSitemapRouteRenderer({ pageRef, compactClass, pageClass }) {
  return (
    <div ref={pageRef} className={`ag-page-shell service-native-page native-info-page native-info-page--sitemap${compactClass}${pageClass}`}>
      <section className="native-functional-page-head native-functional-page-head--sitemap">
        <div className="ag-panel-rail">
          <h1>Sitemap</h1>
        </div>
      </section>
      <SitemapRouteSection />
    </div>
  );
}

export function NativeProspectusRouteRenderer({
  pageRef,
  compactClass,
  pageClass,
  hasOpenHudPanel,
  intro,
  actions,
  sections,
  ActionRenderer,
  NativeLinkRenderer,
}) {
  return (
    <div ref={pageRef} className={`ag-page-shell service-native-page native-info-page${compactClass}${pageClass}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}`}>
      <section className="native-functional-page-head native-functional-page-head--prospectus">
        <div className="ag-panel-rail">
          <h1 className="native-prospectus-hero-title">Prospectus</h1>
        </div>
      </section>
      <ProspectusRouteSection
        sections={sections}
        actions={actions}
        ActionRenderer={ActionRenderer}
        NativeLinkRenderer={NativeLinkRenderer}
      />
    </div>
  );
}

export function NativeFormsRouteRenderer({
  pageRef,
  compactClass,
  pageClass,
  intro,
  seedForms,
  NativeLinkRenderer,
}) {
  const displayIntro = String(intro || '').trim();
  const shouldShowIntro = displayIntro && displayIntro !== 'Browse AGFinancial form links by topic.';

  return (
    <div ref={pageRef} className={`ag-page-shell service-native-page native-info-page${compactClass}${pageClass}`}>
      <section className="native-functional-page-head native-functional-page-head--utility native-functional-page-head--forms">
        <div className="ag-panel-rail">
          <h1>Forms</h1>
          {shouldShowIntro ? <p>{displayIntro}</p> : null}
        </div>
      </section>
      <FormsLibraryRouteSection seedForms={seedForms} NativeLinkRenderer={NativeLinkRenderer} />
    </div>
  );
}
