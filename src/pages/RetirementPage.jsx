import { useRef } from 'react';
import { Link } from 'react-router-dom';
import useNativeEnhancements from '../hooks/useNativeEnhancements';

const planFeatures = [
  {
    title: 'MBA Income Fund',
    body: 'A flagship fixed income option built for ministry-minded retirement savers.',
  },
  {
    title: 'Screened Investments',
    body: 'Portfolio options screened for alignment with biblical ethical standards.',
  },
  {
    title: 'Faith-Based Strategies',
    body: 'Investment direction shaped by stewardship values and long-term purpose.',
  },
  {
    title: 'Roth / Pretax Deferrals',
    body: 'Flexible tax strategy choices for current income and retirement planning.',
  },
  {
    title: 'Rollovers',
    body: 'Consolidate retirement balances into one plan for simpler oversight.',
  },
  {
    title: 'Variety',
    body: 'Low-cost index, active, risk-based, and target-date options available.',
  },
  {
    title: 'Your Consultant',
    body: 'Regional consultants help with setup, implementation, and ongoing support.',
  },
  {
    title: 'Education',
    body: 'Participant education support including plan trends and contribution planning.',
  },
];

export default function RetirementPage() {
  const pageRef = useRef(null);
  useNativeEnhancements(pageRef);

  return (
    <div ref={pageRef} className="service-native-page retirement-native-page">
      <section className="service-native-hero">
        <div className="ag-panel-rail">
          <h1>
            Your <mark>future</mark>. Your <mark>plan</mark>.
          </h1>
        </div>
      </section>

      <section className="service-native-intro">
        <div className="ag-panel-rail">
          <h2>Invest in tomorrow. Start today.</h2>
          <p>
            We help ministers, ministry employees, and organizations build retirement strategies that fit ministry
            life.
          </p>
          <div className="service-native-action-row" style={{ justifyContent: 'center' }}>
            <Link to="/services/retirement/retirement-consultants" className="service-native-btn">Find my consultant</Link>
          </div>
        </div>
      </section>

      <section className="service-native-section is-sand">
        <div className="ag-panel-rail-wide">
          <h2>AGFinancial 403(b) Retirement Plan</h2>
          <p>Smart benefits, strong advantages for ministers and ministry teams.</p>
          <div className="service-native-grid is-four">
            {planFeatures.map((feature) => (
              <article key={feature.title} className="service-native-card fade-up">
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
          <div className="service-native-action-row">
            <Link to="/services/retirement/403b" className="service-native-btn">Explore the 403(b)</Link>
          </div>
        </div>
      </section>

      <section className="service-native-section">
        <div className="ag-panel-rail-wide">
          <div className="service-native-split">
            <article className="service-native-card fade-up">
              <h3>Individual Retirement Accounts (IRAs)</h3>
              <p>Choose Traditional or Roth IRA options with practical tax-planning flexibility.</p>
              <div className="service-native-action-row">
                <Link to="/services/retirement/iras" className="service-native-btn">Explore IRAs</Link>
              </div>
            </article>

            <article className="service-native-card fade-up">
              <h3>Deferred Compensation Plan (409A)</h3>
              <p>
                For ministers, ministry employees, and QCCOs who need contribution flexibility above standard limits.
              </p>
              <div className="service-native-action-row">
                <Link to="/services/retirement/409a" className="service-native-btn">Learn about 409A</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="service-native-cta-band">
        <div className="ag-panel-rail">
          <h2>Minister&apos;s housing allowance still matters in retirement.</h2>
          <p>
            Review the housing-allowance guidance and worksheet tools in our 403(b) page to estimate your eligible
            amount and compare annual housing expenses. Let us do the math with you.
          </p>
          <div className="service-native-action-row" style={{ justifyContent: 'center' }}>
            <Link to="/services/retirement/403b#housing" className="service-native-btn">Open housing allowance section</Link>
            <a href="https://media.agfinancial.org/Housing-Allowance-Worksheet.pdf" target="_blank" rel="noreferrer noopener" className="service-native-btn is-ghost">
              Download worksheet
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
