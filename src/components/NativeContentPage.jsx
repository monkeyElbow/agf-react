import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { sitePages } from '../data/siteMap';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import { getNativePageContent } from '../data/nativePageContent';

function Action({ item }) {
  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer noopener" className={`service-native-btn${item.ghost ? ' is-ghost' : ''}`}>
        {item.label}
      </a>
    );
  }
  return (
    <Link to={item.to} className={`service-native-btn${item.ghost ? ' is-ghost' : ''}`}>
      {item.label}
    </Link>
  );
}

function HeroTitle({ hero }) {
  if (!hero?.highlight) {
    return <h1>{hero?.title}</h1>;
  }

  const source = String(hero.title || '');
  const splitIdx = source.toLowerCase().indexOf(String(hero.highlight).toLowerCase());
  if (splitIdx < 0) {
    return <h1>{source}</h1>;
  }

  const before = source.slice(0, splitIdx);
  const exact = source.slice(splitIdx, splitIdx + String(hero.highlight).length);
  const after = source.slice(splitIdx + String(hero.highlight).length);

  return (
    <h1>
      {before}
      <mark>{exact}</mark>
      {after}
    </h1>
  );
}

function SitemapSection() {
  const groups = useMemo(() => {
    const pages = sitePages.filter((page) => !page.path.startsWith('/admin/') && page.path !== '/search');
    return pages.reduce((acc, page) => {
      if (!acc[page.section]) {
        acc[page.section] = [];
      }
      acc[page.section].push(page);
      return acc;
    }, {});
  }, []);

  return (
    <section className="service-native-section">
      <div className="ag-panel-rail">
        {Object.entries(groups).map(([section, pages]) => (
          <div key={section} className="native-info-links-block">
            <h3>{section}</h3>
            <ul className="native-info-link-list">
              {pages.map((page) => (
                <li key={page.path}>
                  <Link to={page.path}>{page.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function NativeContentPage({ page }) {
  const pageRef = useRef(null);
  useNativeEnhancements(pageRef);
  const content = getNativePageContent(page.path, page.title);

  if (page.path === '/sitemap') {
    return (
      <div ref={pageRef} className={`service-native-page native-info-page${content.compact ? ' is-compact' : ''}`}>
        <section className="service-native-hero">
          <div className="ag-panel-rail">
            <HeroTitle hero={{ title: 'Sitemap', highlight: null }} />
          </div>
        </section>
        <section className="service-native-intro">
          <div className="ag-panel-rail">
            <p>All current native routes.</p>
          </div>
        </section>
        <SitemapSection />
      </div>
    );
  }

  return (
    <div ref={pageRef} className={`service-native-page native-info-page${content.compact ? ' is-compact' : ''}`}>
      <section className="service-native-hero">
        <div className="ag-panel-rail">
          <HeroTitle hero={content.hero || { title: page.title }} />
        </div>
      </section>

      <section className="service-native-intro">
        <div className="ag-panel-rail">
          <p>{content.intro}</p>
        </div>
      </section>

      {(content.sections || []).map((section) => (
        <section key={section.title} className={`service-native-section${section.sand ? ' is-sand' : ''}`}>
          <div className={section.wide ? 'ag-panel-rail-wide' : 'ag-panel-rail'}>
            <h2>{section.title}</h2>
            {(section.body || []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

            {Array.isArray(section.links) && section.links.length ? (
              <ul className="native-info-link-list">
                {section.links.map((item) => (
                  <li key={`${item.label}-${item.to || item.href}`}>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noreferrer noopener">{item.label}</a>
                    ) : (
                      <Link to={item.to}>{item.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}

            {Array.isArray(section.cards) && section.cards.length ? (
              <div className={`service-native-grid${section.columns ? ` is-${section.columns}` : ''}`}>
                {section.cards.map((card) => (
                  <article key={card.title} className={`service-native-card fade-up ${card.cardClass || 'card2'}`.trim()}>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                    {card.to || card.href ? (
                      <div className="service-native-action-row">
                        {card.href ? (
                          <a href={card.href} target="_blank" rel="noreferrer noopener" className="service-native-btn">
                            {card.cta || 'Learn more'}
                          </a>
                        ) : (
                          <Link to={card.to} className="service-native-btn">{card.cta || 'Learn more'}</Link>
                        )}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}

            {Array.isArray(section.faqs) && section.faqs.length ? (
              <div className="native-faq-list">
                {section.faqs.map((item) => (
                  <details key={item.question} className="native-faq-item">
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            ) : null}

            {Array.isArray(section.actions) && section.actions.length ? (
              <div className="service-native-action-row">
                {section.actions.map((item) => (
                  <Action key={`${item.label}-${item.to || item.href}`} item={item} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ))}

      {Array.isArray(content.actions) && content.actions.length ? (
        <section className="service-native-cta-band">
          <div className="ag-panel-rail">
            <div className="service-native-action-row" style={{ justifyContent: 'center' }}>
              {content.actions.map((item) => (
                <Action key={`${item.label}-${item.to || item.href}`} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
