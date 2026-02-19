import { useEffect, useMemo, useRef, useState } from 'react';
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

function NativeContentForm({ config }) {
  if (!config) {
    return null;
  }

  const stepConfigs = Array.isArray(config.steps) && config.steps.length
    ? config.steps
    : null;
  const [activeStep, setActiveStep] = useState(0);
  const isMultiStep = Boolean(stepConfigs);
  const currentStep = isMultiStep ? stepConfigs[Math.min(activeStep, stepConfigs.length - 1)] : null;
  const fields = isMultiStep
    ? (Array.isArray(currentStep?.fields) ? currentStep.fields : [])
    : (Array.isArray(config.fields) && config.fields.length
      ? config.fields
      : [
        { id: 'name', label: 'Name', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email', required: true },
        { id: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555' },
      ]);

  useEffect(() => {
    setActiveStep(0);
  }, [config, isMultiStep]);

  const renderField = (field) => {
    const fieldId = `native-form-${field.id}`;

    if (field.type === 'select') {
      return (
        <label key={field.id} htmlFor={fieldId}>
          {field.label}
          <select
            id={fieldId}
            required={Boolean(field.required)}
            defaultValue={field.defaultValue || ''}
          >
            <option value="" disabled>{field.placeholder || 'Select one'}</option>
            {(field.options || []).map((option) => (
              <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === 'textarea') {
      return (
        <label key={field.id} htmlFor={fieldId}>
          {field.label}
          <textarea
            id={fieldId}
            placeholder={field.placeholder || undefined}
            required={Boolean(field.required)}
            rows={field.rows || 4}
          />
        </label>
      );
    }

    if (field.type === 'radio' && Array.isArray(field.options) && field.options.length) {
      return (
        <fieldset key={field.id}>
          <legend>{field.label}</legend>
          <div className="native-info-inline-form-radio-row">
            {field.options.map((option) => (
              <label key={`${field.id}-${option.value}`} htmlFor={`${fieldId}-${option.value}`}>
                <input
                  id={`${fieldId}-${option.value}`}
                  name={field.id}
                  type="radio"
                  value={option.value}
                  required={Boolean(field.required)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    return (
      <label key={field.id} htmlFor={fieldId}>
        {field.label}
        <input
          id={fieldId}
          type={field.type || 'text'}
          placeholder={field.placeholder || undefined}
          inputMode={field.inputMode || undefined}
          pattern={field.pattern || undefined}
          title={field.title || undefined}
          maxLength={field.maxLength || undefined}
          required={Boolean(field.required)}
        />
      </label>
    );
  };

  const onNextStep = () => {
    setActiveStep((prev) => Math.min(prev + 1, stepConfigs.length - 1));
  };

  const onBackStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const isLastStep = !isMultiStep || activeStep === stepConfigs.length - 1;
  const stepSubmitLabel = currentStep?.submitLabel || config.submitLabel || 'Submit';
  const backLabel = currentStep?.backLabel || 'Back';
  const nextLabel = currentStep?.nextLabel || 'Next';

  return (
    <div className="native-info-inline-form" aria-label={config.title || 'Contact form'}>
      {config.title ? <h5>{config.title}</h5> : null}
      <form onSubmit={(event) => event.preventDefault()}>
        {fields.map(renderField)}
        {config.subtitle ? <h6>{config.subtitle}</h6> : null}
        {isMultiStep ? (
          <>
            <div className="native-info-inline-form-step-actions">
              {activeStep > 0 ? (
                <button type="button" className="service-native-btn is-ghost" onClick={onBackStep}>{backLabel}</button>
              ) : (
                <span className="native-info-inline-form-step-spacer" aria-hidden="true" />
              )}
              {isLastStep ? (
                <button type="submit" className="service-native-btn">{stepSubmitLabel}</button>
              ) : (
                <button type="button" className="service-native-btn" onClick={onNextStep}>{nextLabel}</button>
              )}
            </div>
            <div className="native-info-inline-form-progress" aria-hidden="true">
              {stepConfigs.map((step, index) => (
                <span
                  key={step.id || `step-${index + 1}`}
                  className={`native-info-inline-form-dot${index === activeStep ? ' is-active' : ''}`}
                />
              ))}
            </div>
          </>
        ) : (
          <button type="submit" className="service-native-btn">{config.submitLabel || 'Submit'}</button>
        )}
      </form>
    </div>
  );
}

function renderHighlightedText(source, highlights) {
  const text = String(source || '');
  const rules = Array.isArray(highlights)
    ? highlights.filter((item) => item && item.text)
    : [];

  if (!text || !rules.length) {
    return text;
  }

  const lower = text.toLowerCase();
  const pieces = [];
  let cursor = 0;
  let key = 0;
  const nextKey = (prefix) => {
    key += 1;
    return `${prefix}-${key}`;
  };

  while (cursor < text.length) {
    let next = null;

    rules.forEach((rule) => {
      const needle = String(rule.text).toLowerCase();
      if (!needle) {
        return;
      }
      const idx = lower.indexOf(needle, cursor);
      if (idx < 0) {
        return;
      }
      if (!next || idx < next.index) {
        next = { index: idx, rule, length: needle.length };
      }
    });

    if (!next) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor)}</span>);
      break;
    }

    if (next.index > cursor) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor, next.index)}</span>);
    }

    pieces.push(
      <mark key={nextKey('m')} className={next.rule.className || undefined}>
        {text.slice(next.index, next.index + next.length)}
      </mark>,
    );

    cursor = next.index + next.length;
  }

  return pieces;
}

function HeroTitle({ hero }) {
  if (Array.isArray(hero?.lines) && hero.lines.length) {
    return (
      <>
        {hero.lines.slice(0, 2).map((line, index) => {
          const lineConfig = typeof line === 'string' ? { title: line } : line;
          const lineNumber = index + 1;
          const lineClass = `line${lineNumber}`;
          const source = String(lineConfig?.title || '');
          const highlightRules = Array.isArray(lineConfig?.highlights) && lineConfig.highlights.length
            ? lineConfig.highlights
            : (lineConfig?.highlight ? [{ text: lineConfig.highlight, className: lineConfig.highlightClass }] : []);
          const content = highlightRules.length ? renderHighlightedText(source, highlightRules) : source;

          return (
            <h1 key={`${lineClass}-${source}`} className={`${lineClass}${lineConfig?.className ? ` ${lineConfig.className}` : ''}`}>
              {content}
            </h1>
          );
        })}
      </>
    );
  }

  if (!hero?.highlight && !Array.isArray(hero?.highlights)) {
    return <h1 className="line1 line2">{hero?.title}</h1>;
  }

  const source = String(hero.title || '');
  const highlightRules = Array.isArray(hero.highlights) && hero.highlights.length
    ? hero.highlights
    : [{ text: hero.highlight, className: hero.highlightClass }];

  if (!highlightRules.length) {
    return <h1 className="line1 line2">{source}</h1>;
  }

  return (
    <h1 className="line1 line2">
      {renderHighlightedText(source, highlightRules)}
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
  useNativeEnhancements(pageRef, page.path);
  const content = getNativePageContent(page.path, page.title);
  const introConfig = content?.intro && typeof content.intro === 'object' ? content.intro : null;
  const introHeading = introConfig?.heading || null;
  const introHeadingHighlights = Array.isArray(introConfig?.headingHighlights) ? introConfig.headingHighlights : [];
  const introParagraphs = introConfig
    ? (Array.isArray(introConfig.body) ? introConfig.body : (introConfig.body ? [introConfig.body] : []))
    : (content.intro ? [content.intro] : []);
  const introEmphasis = introConfig?.emphasis || null;
  const introActions = Array.isArray(introConfig?.actions) ? introConfig.actions : [];
  const pageClass = content.pageClass ? ` ${content.pageClass}` : '';
  const compactClass = content.compact ? ' is-compact' : '';

  if (page.path === '/sitemap') {
    return (
      <div ref={pageRef} className={`service-native-page native-info-page${compactClass}${pageClass}`}>
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
    <div ref={pageRef} className={`service-native-page native-info-page${compactClass}${pageClass}`}>
      <section className="service-native-hero">
        <div className="ag-panel-rail">
          <HeroTitle hero={content.hero || { title: page.title }} />
        </div>
      </section>

      <section className="service-native-intro">
        <div className="ag-panel-rail">
          {introHeading ? (
            <h2>
              {introHeadingHighlights.length ? renderHighlightedText(introHeading, introHeadingHighlights) : introHeading}
            </h2>
          ) : null}
          {introParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {introEmphasis ? <p className="native-info-intro-emphasis"><strong>{introEmphasis}</strong></p> : null}
          {introActions.length ? (
            <div className="service-native-action-row is-centered">
              {introActions.map((item) => (
                <Action key={`${item.label}-${item.to || item.href}`} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {(content.sections || []).map((section) => {
        if (section.feature) {
          const feature = section.feature;
          const featureBody = Array.isArray(feature.body)
            ? feature.body
            : (feature.body ? [feature.body] : []);

          return (
            <section
              key={section.title}
              className={`service-native-section${section.sand ? ' is-sand' : ''}${section.className ? ` ${section.className}` : ''}`}
            >
              <div className={section.fullBleed ? 'ag-panel-rail-wide native-info-full-bleed' : (section.wide ? 'ag-panel-rail-wide' : 'ag-panel-rail')}>
                <div className="service-native-dark-feature">
                  <div className="service-native-dark-feature-inner">
                    <div
                      className="service-native-dark-feature-media"
                      style={feature.image ? { backgroundImage: `url(${feature.image})` } : undefined}
                      role={feature.imageAlt ? 'img' : undefined}
                      aria-label={feature.imageAlt || undefined}
                    />
                    <div className="service-native-dark-feature-copy">
                      {feature.title ? <h3>{feature.title}</h3> : null}
                      {featureBody.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                      {Array.isArray(feature.actions) && feature.actions.length ? (
                        <div className="service-native-action-row">
                          {feature.actions.map((item) => (
                            <Action key={`${item.label}-${item.to || item.href}`} item={item} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        return (
          <section
            key={section.title}
            className={`service-native-section${section.sand ? ' is-sand' : ''}${section.className ? ` ${section.className}` : ''}`}
          >
            <div className={section.fullBleed ? 'ag-panel-rail-wide native-info-full-bleed' : (section.wide ? 'ag-panel-rail-wide' : 'ag-panel-rail')}>
            {section.logoImage ? (
              <img
                src={section.logoImage}
                alt={section.logoAlt || ''}
                className="native-info-section-logo"
              />
            ) : null}
            {!section.logoImage && section.logoText ? (
              <p className="native-info-section-logo-text">{section.logoText}</p>
            ) : null}
            {section.copyWrap ? (
              <div className={`native-info-section-copy${section.copyClassName ? ` ${section.copyClassName}` : ''}`}>
                {!section.hideTitle ? (
                  <h2 className={section.titleClassName || undefined}>
                    {renderHighlightedText(section.title, section.titleHighlights)}
                  </h2>
                ) : null}
                {section.subtitle ? <h3 className="native-info-section-subtitle">{section.subtitle}</h3> : null}
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
              </div>
            ) : (
              <>
                {!section.hideTitle ? (
                  <h2 className={section.titleClassName || undefined}>
                    {renderHighlightedText(section.title, section.titleHighlights)}
                  </h2>
                ) : null}
                {section.subtitle ? <h3 className="native-info-section-subtitle">{section.subtitle}</h3> : null}
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
              </>
            )}

            {Array.isArray(section.cards) && section.cards.length ? (
              <div className={`service-native-grid${section.columns ? ` is-${section.columns}` : ''}`}>
                {section.cards.map((card) => (
                  <article key={card.title} className={`service-native-card fade-up ${card.cardClass || 'card2'}`.trim()}>
                    <h3>{card.title}</h3>
                    {card.body ? <p>{card.body}</p> : null}
                    {Array.isArray(card.actions) && card.actions.length ? (
                      <div className="service-native-action-row">
                        {card.actions.map((item) => (
                          <Action key={`${item.label}-${item.to || item.href}`} item={item} />
                        ))}
                      </div>
                    ) : null}
                    {!Array.isArray(card.actions) && (card.to || card.href) ? (
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

            {section.form ? <NativeContentForm config={section.form} /> : null}

            {section.table ? (
              <div className="native-info-table-wrap">
                <table className="ag-table has-fixed-layout">
                  <thead>
                    <tr>
                      {section.table.headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, rowIndex) => (
                      <tr key={row.join('|')}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${rowIndex}-${cellIndex}-${cell}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {Array.isArray(section.testimonials) && section.testimonials.length ? (
              <div className="service-native-testimonials-wrap">
                <div className="carousel-stack">
                  {section.testimonials.map((item, index) => (
                    <article key={item.author} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                      <p><strong>{item.quote}</strong></p>
                      <p>—<strong>{item.author}</strong></p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {section.fineprint ? <p className="service-native-note">{section.fineprint}</p> : null}

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
        );
      })}

      {Array.isArray(content.actions) && content.actions.length ? (
        <section className="service-native-cta-band">
          <div className="ag-panel-rail">
            <div className="service-native-action-row is-centered">
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
