import { useState } from 'react';
import { Link } from 'react-router-dom';

function formatUsPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (!digits.length) {
    return '';
  }
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function TopStripBlock({ block }) {
  const phoneHref = `tel:${String(block.phone || '').replace(/[^\d+]/g, '')}`;

  return (
    <section className="home-native-strip">
      <div className="home-native-strip-fluid">
        <a href={block.loginHref} target="_blank" rel="noreferrer noopener" className="home-native-strip-login-btn">
          {block.loginLabel}
        </a>
        <div className="home-native-strip-right">
          <a href={phoneHref} className="home-native-strip-phone">{block.phone}</a>
          <Link to={block.ratesPath} className="home-native-strip-rates">{block.ratesLabel}</Link>
        </div>
      </div>
    </section>
  );
}

function HeroBlock({ block }) {
  return (
    <section className="home-native-hero">
      <div className="ag-panel-rail">
        <p className="home-native-eyebrow">
          {block.eyebrowPrefix} <mark>{block.highlight}</mark>.
        </p>
        <h1 className="home-native-title line1 line2">
          {block.titlePrefix} <mark>{block.accentWord}</mark>.
        </h1>
        <Link to={block.ctaPath} className="home-native-cta">{block.ctaLabel}</Link>
      </div>
    </section>
  );
}

function ServicesGridBlock({ block }) {
  return (
    <section className="home-native-services">
      <div className="ag-panel-rail">
        <h2>{block.heading}</h2>
        <div className="home-native-services-grid">
          {block.cards.map((card) => (
            <article key={card.path} className={`home-native-card fade-up${card.featured ? ' is-featured' : ''}`}>
              <img src={card.image} alt="" loading="lazy" />
              <h3><Link to={card.path}>{card.title}</Link></h3>
              <Link to={card.path} className="home-native-card-action">{card.action}</Link>
            </article>
          ))}
        </div>
        <div className="home-native-browse-wrap">
          <Link to={block.browsePath} className="home-native-browse-link">{block.browseLabel}</Link>
        </div>
      </div>
    </section>
  );
}

function ImpactStatBlock({ block }) {
  const stats = Array.isArray(block.stats) && block.stats.length
    ? block.stats
    : [{ value: block.statValue, label: block.statLabel, tone: 'mango' }];

  return (
    <section className="home-native-impact">
      <div className="ag-panel-rail home-native-impact-grid">
        <div className="fade-up">
          <h2>
            {block.titlePrefix} <mark>{block.highlight}</mark>.
          </h2>
          <p>{block.body}</p>
          <div className="home-native-impact-cta-wrap">
            <Link to={block.ctaPath} className="home-native-cta">{block.ctaLabel}</Link>
          </div>
        </div>
        <div className="home-native-stat-list fade-up">
          {stats.map((stat, index) => (
            <div key={`${stat.value}-${index}`} className="home-native-stat">
              <p className={`home-native-stat-value countup is-${stat.tone || 'mango'}`}>{stat.value}</p>
              <p className="home-native-stat-label"><strong>{stat.label}</strong></p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFormBlock({ block }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event) {
    event.preventDefault();
    if (!name || !email) {
      return;
    }
    setSubmitted(true);
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  }

  const headingPrefix = block.headingPrefix || '';
  const headingHighlight = block.headingHighlight || '';
  const headingSuffix = block.headingSuffix || block.heading || '';

  return (
    <section className="home-native-cta-form-wrap">
      <div className="ag-panel-rail">
        <h2>
          {headingPrefix}
          {' '}
          <mark>{headingHighlight}</mark>
          {' '}
          {headingSuffix}
        </h2>
        <div className="home-native-cta-shell">
          <form className="home-native-cta-form" onSubmit={onSubmit}>
            <label htmlFor="home-cta-name">Name</label>
            <input id="home-cta-name" value={name} onChange={(event) => setName(event.target.value)} required />
            <label htmlFor="home-cta-email">Email</label>
            <input id="home-cta-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="home-cta-phone">Phone</label>
            <input
              id="home-cta-phone"
              type="tel"
              value={phone}
              placeholder={block.phonePlaceholder || '(555) 555-5555'}
              onChange={(event) => setPhone(formatUsPhone(event.target.value))}
            />
            <label htmlFor="home-cta-message">Message</label>
            <textarea
              id="home-cta-message"
              value={message}
              placeholder={block.messagePlaceholder || 'What would you like to discuss?'}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="home-native-cta-note">{block.note}</p>
            <button type="submit">{block.buttonLabel}</button>
          </form>
        </div>
        {submitted ? <p className="home-native-cta-form-success">Thanks. We will reach out soon.</p> : null}
      </div>
    </section>
  );
}

function FeatureSplitBlock({ block }) {
  return (
    <section className={`home-native-feature${block.sand ? ' is-sand' : ''}`}>
      <div className={`ag-panel-rail home-native-feature-grid${block.imageOnLeft ? ' is-image-left' : ' is-image-right'}`}>
        <div className="home-native-feature-media fade-up">
          <img src={block.imagePath} alt={block.imageAlt || ''} loading="lazy" />
        </div>
        <div className="home-native-feature-copy fade-up">
          <h3>
            {block.leadHighlight ? <mark>{block.leadHighlight}</mark> : null}
            {block.leadHighlight ? <br /> : null}
            {block.heading}
          </h3>
          <p>{block.body}</p>
          <Link to={block.ctaPath} className="home-native-cta">{block.ctaLabel}</Link>
        </div>
      </div>
    </section>
  );
}

function NewsletterBlock({ block }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event) {
    event.preventDefault();
    if (!email) {
      return;
    }
    setSubmitted(true);
    setEmail('');
  }

  return (
    <section className="home-native-newsletter">
      <div className="ag-panel-rail">
        <h2>
          {block.headingPrefix || block.heading}
          {' '}
          {block.headingHighlight ? <mark>{block.headingHighlight}</mark> : null}
          .
        </h2>
        <p>{block.body}</p>
        <form onSubmit={onSubmit} className="home-native-newsletter-form">
          <input
            id="home-newsletter-email"
            type="email"
            aria-label="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            required
          />
          <button type="submit">{block.buttonLabel}</button>
        </form>
        {submitted ? <p className="home-native-newsletter-success">Thanks, you are on the list.</p> : null}
      </div>
    </section>
  );
}

const blockRenderers = {
  top_strip: TopStripBlock,
  hero: HeroBlock,
  services_grid: ServicesGridBlock,
  impact_stat: ImpactStatBlock,
  cta_form: CtaFormBlock,
  feature_split: FeatureSplitBlock,
  newsletter: NewsletterBlock,
};

export default function PageBlocksRenderer({ blocks }) {
  return (
    <>
      {blocks.map((block, index) => {
        const Renderer = blockRenderers[block.type];
        if (!Renderer) {
          return null;
        }
        return <Renderer key={`${block.type}-${index}`} block={block} />;
      })}
    </>
  );
}
