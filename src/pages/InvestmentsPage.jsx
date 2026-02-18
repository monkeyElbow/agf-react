import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useRates } from '../context/RatesContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';

const certificateCards = [
  {
    title: 'Demand Certificates',
    description: 'Variable-rate investments with access to funds on demand (within 30 days). Minimum investment $250.',
  },
  {
    title: 'Term Certificates',
    description: 'Fixed or variable rates for terms from 3 months to 10 years. Minimum investment $500.',
  },
];

const growthCards = [
  {
    title: 'Grow your return.',
    body: 'Pursue competitive returns while helping ministries expand their local impact.',
  },
  {
    title: 'Grow your Plan B.',
    body: 'Build emergency reserves that support both readiness and mission outcomes.',
  },
  {
    title: 'Grow the Kingdom.',
    body: 'Your investment supports loans for church buildings and ministry expansion.',
  },
];

const testimonials = [
  {
    quote: '"Convoy of Hope would not be where we are without our partnership with AGFinancial."',
    author: 'Hal Donaldson, President, Convoy of Hope',
  },
  {
    quote: '"Their partnership helped us align financial strength with ministry momentum."',
    author: 'Ministry Operations Leader',
  },
  {
    quote: '"We found a strategy that worked for our timeline and mission goals."',
    author: 'Church Finance Team',
  },
];

export default function InvestmentsPage() {
  const pageRef = useRef(null);
  const { rates, ratesMeta } = useRates();
  useNativeEnhancements(pageRef);

  return (
    <div ref={pageRef} className="service-native-page investments-native-page">
      <section className="service-native-hero">
        <div className="ag-panel-rail">
          <h1 className="line1 line2">
            Your <mark>investments</mark>. Your <mark>faith</mark>. Better together.
          </h1>
        </div>
      </section>

      <section className="service-native-intro">
        <div className="ag-panel-rail">
          <h2>Invest like it matters. <mark>Because it does.</mark></h2>
          <p>
            Your investment dollars can deliver a competitive return while helping fund church construction and
            ministry growth.
          </p>
        </div>
      </section>

      <section className="service-native-section">
        <div className="ag-panel-rail-wide">
          <div className="service-native-grid is-two">
            {certificateCards.map((card) => (
              <article key={card.title} className="service-native-card fade-up">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="service-native-action-row">
                  <a href="https://secure.agfinancial.org/invest" target="_blank" rel="noreferrer noopener" className="service-native-btn">
                    Start investing
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="service-native-grid" style={{ marginTop: '1rem' }}>
            {growthCards.map((card) => (
              <article key={card.title} className="service-native-card fade-up">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-native-section">
        <div className="ag-panel-rail" id="rates">
          <h2>AGFinancial Investment Certificates Rates</h2>
          <div className="service-native-rates fade-up" style={{ marginTop: '1rem' }}>
            <div className="table-scroll">
              <table className="ag-table has-fixed-layout">
                <thead>
                  <tr>
                    <th>Investment Type</th>
                    <th>Standard Rate</th>
                    <th>Standard APY*</th>
                    <th>Premium Rate**</th>
                    <th>Premium APY*</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((row) => (
                    <tr key={row.id}>
                      <td>{row.product}</td>
                      <td>{row.standardRate}</td>
                      <td>{row.standardApy}</td>
                      <td>{row.premiumRate}</td>
                      <td>{row.premiumApy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="service-native-note">
            *Annual Percentage Yield. **Premium rates may be available for investments of $250,000 or greater.
            {' '}
            Effective {ratesMeta?.certificatesEffectiveDate || 'January 1, 2026'}.
          </p>
        </div>
      </section>

      <section className="service-native-cta-band">
        <div className="ag-panel-rail">
          <h2>Already an investor?</h2>
          <p>Manage your account securely and access your dashboard anytime.</p>
          <div className="service-native-action-row" style={{ justifyContent: 'center' }}>
            <a href="https://secure.agfinancial.org/" target="_blank" rel="noreferrer noopener" className="service-native-btn">
              Go to my dashboard
            </a>
          </div>
        </div>
      </section>

      <section className="service-native-section is-sand">
        <div className="ag-panel-rail-wide">
          <div className="service-native-ladder-box fade-up">
            <h2>Investment Laddering Strategy</h2>
            <p>
              Use laddering to balance longer-term rates with shorter-term access. Spread maturities to reduce rate
              risk and better match your ministry timeline.
            </p>
            <div className="service-native-action-row">
              <a
                href="https://www.calcxml.com/calculators/investment-certificate-laddering?skn=212&r=2"
                target="_blank"
                rel="noreferrer noopener"
                className="service-native-btn"
              >
                Open laddering calculator
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="service-native-section">
        <div className="ag-panel-rail">
          <h2 style={{ textAlign: 'center' }}>Fill the gaps. Show the story.</h2>
          <div className="service-native-testimonials-wrap carousel-stack">
            {testimonials.map((item, index) => (
              <article key={item.author} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                <p style={{ fontSize: 'clamp(1.35rem, 2.9vw, 2.2rem)', lineHeight: 1.15 }}>{item.quote}</p>
                <p><strong>{item.author}</strong></p>
              </article>
            ))}
          </div>
          <p className="service-native-note" style={{ textAlign: 'center' }}>
            Testimonials are examples only. Every situation is different and results vary.
          </p>
        </div>
      </section>

      <section className="service-native-section">
        <div className="ag-panel-rail-wide">
          <div className="service-native-dark-feature fade-up">
            <div className="service-native-dark-feature-inner">
              <div className="service-native-dark-feature-media" />
              <div className="service-native-dark-feature-copy">
                <h3>Church Cash Reserves</h3>
                <p>
                  Financial stability is essential for long-term growth. Build a practical reserve strategy so your
                  ministry is ready for both opportunity and disruption.
                </p>
                <div className="service-native-action-row">
                  <Link to="/resources" className="service-native-btn">Ready for the unexpected?</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
