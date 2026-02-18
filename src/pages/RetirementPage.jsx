import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import ministersHousingImage from '../assets/ministers-housing.jpg';
import retirementKeyboardImage from '../assets/retirement-keyboard.jpg';
import retirementTop3Image from '../assets/retirement-top3.jpg';

const planFeatures = [
  {
    title: 'MBA Income Fund',
    tone: 'is-atlantean',
    body: 'The AGFinancial flagship fixed income investment option provides a fixed rate of return, and helps build churches and ministry facilities.',
  },
  {
    title: 'Screened Investments',
    tone: 'is-mango',
    body: 'This unique investment option ensures the securities you own are aligned with biblical ethical standards.',
  },
  {
    title: 'Faith-Based Investments',
    tone: 'is-super-grey',
    body: 'Our values, beliefs about stewardship, and our mission are the same as yours.',
  },
  {
    title: 'Roth / Pretax Deferrals',
    tone: 'is-atlantean',
    body: 'This option allows taxes to be paid on the contribution now, in order to provide tax-free withdrawals at retirement.',
  },
  {
    title: 'Rollovers',
    tone: 'is-mango',
    body: 'Retirement savings can be simplified by consolidating other retirement accounts into a single 403(b).',
  },
  {
    title: 'Variety',
    tone: 'is-super-grey',
    body: 'Investment options include low-cost index funds, actively-managed funds, risk-based and target-date strategies, and individual funds.',
  },
  {
    title: 'Your Own Consultant',
    tone: 'is-atlantean',
    body: 'Our regional consultants are available to answer your questions, help customize your plan, and assist you with implementation.',
  },
  {
    title: 'Education',
    tone: 'is-mango',
    body: 'Onsite education for your participants is available, and includes retirement trends, IRS regulations, and customized action plans.',
  },
];

const testimonials = [
  {
    quote: '“I so appreciate AGFinancial for making sure our church team is set up for success.”',
    author: 'Russell Bryan Johnson, Lead Pastor, Pursuit NW',
  },
  {
    quote: 'AGFinancial is more than a financial institution. They are my partners and coworkers who are also involved in ministry, so they speak my language.',
    author: 'Nino Gonzales, Lead Pastor, Calvario City Church, FL',
  },
  {
    quote: '“I absolutely trust what they stand for. I trust the people who work there…professional, godly, friendly.”',
    author: 'Mike McClaflin, AGWM, Convoy of Hope',
  },
];

const states = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
  ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

function formatPhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (!digits) {
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

function parseNumber(value) {
  return Number.parseFloat(String(value || '').replace(/,/g, '')) || 0;
}

function formatAmountInput(value) {
  const raw = String(value || '').replace(/[^\d.]/g, '');
  if (!raw) {
    return '';
  }
  const parts = raw.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function computeProjection(current, monthly, monthlyRate, months) {
  if (monthlyRate === 0) {
    return current + monthly * months;
  }
  return current * Math.pow(1 + monthlyRate, months)
    + monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

export default function RetirementPage() {
  const pageRef = useRef(null);
  useNativeEnhancements(pageRef);
  const [calc, setCalc] = useState({
    ageNow: '40',
    retireAge: '67',
    lifeExpectancy: '90',
    currentSavings: '50,000',
    monthlySavings: '500',
    desiredIncome: '60,000',
    socialSecurity: '20,000',
    growthRate: '6',
  });
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    organization: '',
    state: '',
    email: '',
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [ctaForm, setCtaForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [ctaMessage, setCtaMessage] = useState('');

  const calcResults = useMemo(() => {
    const ageNow = Number.parseInt(calc.ageNow, 10) || 0;
    const retireAge = Number.parseInt(calc.retireAge, 10) || 0;
    const lifeExpectancy = Number.parseInt(calc.lifeExpectancy, 10) || 0;
    const desiredIncome = parseNumber(calc.desiredIncome);
    const socialSecurity = parseNumber(calc.socialSecurity);
    const currentSavings = parseNumber(calc.currentSavings);
    const monthlySavings = parseNumber(calc.monthlySavings);
    const growthRate = (Number.parseFloat(calc.growthRate) || 0) / 100;

    const yearsToRetirement = Math.max(0, retireAge - ageNow);
    const monthsToRetirement = yearsToRetirement * 12;
    const yearsRetired = Math.max(0, lifeExpectancy - retireAge);
    const neededNestEgg = Math.max(0, desiredIncome - socialSecurity) * yearsRetired;
    const monthlyRate = growthRate / 12;
    const projectedSavings = computeProjection(currentSavings, monthlySavings, monthlyRate, monthsToRetirement);

    let extraNeeded = 0;
    if (monthsToRetirement > 0 && projectedSavings < neededNestEgg) {
      const gap = neededNestEgg - projectedSavings;
      extraNeeded = monthlyRate === 0
        ? gap / monthsToRetirement
        : (gap * monthlyRate) / (Math.pow(1 + monthlyRate, monthsToRetirement) - 1);
    }

    const labels = [];
    const projectedSeries = [];
    for (let year = 0; year <= yearsToRetirement; year += 1) {
      const months = year * 12;
      labels.push(String(ageNow + year));
      projectedSeries.push(computeProjection(currentSavings, monthlySavings, monthlyRate, months));
    }
    const neededSeries = new Array(labels.length).fill(neededNestEgg);

    const chartWidth = 860;
    const chartHeight = 320;
    const padTop = 16;
    const padRight = 14;
    const padBottom = 30;
    const padLeft = 64;
    const innerWidth = chartWidth - padLeft - padRight;
    const innerHeight = chartHeight - padTop - padBottom;

    const maxY = Math.max(neededNestEgg, ...projectedSeries, 1);
    const pointFor = (value, index, count) => {
      const xFactor = count > 1 ? index / (count - 1) : 0;
      const x = padLeft + (xFactor * innerWidth);
      const y = padTop + ((1 - (value / maxY)) * innerHeight);
      return `${x},${y}`;
    };

    const projectedPoints = projectedSeries.map((value, index) => (
      pointFor(value, index, projectedSeries.length)
    )).join(' ');
    const targetPoints = neededSeries.map((value, index) => (
      pointFor(value, index, neededSeries.length)
    )).join(' ');

    const yTicks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const value = Math.round(maxY * (1 - ratio));
      return {
        value,
        y: padTop + (ratio * innerHeight),
      };
    });

    return {
      neededNestEgg: Math.max(0, Math.round(neededNestEgg)),
      projectedSavings: Math.max(0, Math.round(projectedSavings)),
      extraNeeded: Math.max(0, Math.round(extraNeeded)),
      growthPercent: (growthRate * 100).toFixed(1),
      labels,
      projectedPoints,
      targetPoints,
      yTicks,
      chartWidth,
      chartHeight,
      padLeft,
      padRight,
      padBottom,
      padTop,
    };
  }, [calc]);

  const onCalcNumberChange = (field, value) => {
    setCalc((prev) => ({ ...prev, [field]: value }));
  };

  const onCalcAmountChange = (field, value) => {
    setCalc((prev) => ({ ...prev, [field]: formatAmountInput(value) }));
  };

  const onLeadSubmit = (event) => {
    event.preventDefault();
    if (!leadForm.name.trim() || !leadForm.email.trim()) {
      return;
    }
    setLeadSubmitted(true);
    setLeadForm({
      name: '',
      phone: '',
      organization: '',
      state: '',
      email: '',
    });
  };

  const onCtaSubmit = (event) => {
    event.preventDefault();
    if (!ctaForm.name.trim() || !ctaForm.email.trim()) {
      setCtaMessage('Add your name and email to connect.');
      return;
    }
    setCtaMessage('Got it. We’ll reach out soon.');
    setCtaForm({
      name: '',
      email: '',
      phone: '',
    });
  };

  const dollars = (value) => value.toLocaleString();

  return (
    <div ref={pageRef} className="service-native-page retirement-native-page">
      <section className="service-native-hero">
        <div className="ag-panel-rail">
          <h1 className="retirement-native-hero-line line1">
            Your <mark>future</mark>.
          </h1>
          <h1 className="retirement-native-hero-line line2">
            Your <mark>plan</mark>.
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

      <section className="service-native-section retirement-plan-section">
        <div className="ag-panel-rail-wide">
          <h2 className="retirement-plan-heading">AGFinancial 403(b) Retirement Plan</h2>
          <h3 className="retirement-plan-subheading">Smart benefits, strong advantages</h3>
          <p className="retirement-plan-lead">
            The <strong>AGFinancial</strong> flagship retirement plan is customized specifically for ministers and ministry or organization employees. This is a plan exempt from ERISA. Choose from a variety of strategies.
          </p>
          <div className="service-native-grid is-four retirement-plan-grid">
            {planFeatures.map((feature) => (
              <article key={feature.title} className="service-native-card fade-up">
                <h3 className={feature.tone}>{feature.title}</h3>
                <hr className="retirement-plan-card-divider" />
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
          <h4 className="retirement-plan-footer">
            Includes minister&apos;s housing allowance, higher contribution limits, and more.
          </h4>
          <div className="service-native-action-row">
            <Link to="/services/retirement/403b" className="service-native-btn">Explore the 403(b)</Link>
          </div>
        </div>
      </section>

      <section className="service-native-section retirement-accounts-section">
        <div className="ag-panel-rail-wide">
          <div className="service-native-split">
            <article className="service-native-card card2 retirement-account-card fade-up">
              <h3>Individual Retirement Accounts (IRAs)</h3>
              <p>
                An IRA (Individual Retirement Account) provides beneficial options, both now and in the future.
                We offer <strong>Traditional</strong> and <strong>Roth</strong> IRAs. Learn more about each below.
              </p>
              <div className="service-native-action-row">
                <Link to="/services/retirement/iras" className="service-native-btn">Explore IRAs</Link>
              </div>
            </article>

            <article className="service-native-card card2 retirement-account-card fade-up">
              <h3>Deferred Compensation Plan (409A)</h3>
              <p>
                Available exclusively to ministers, ministry employees, and Qualified Church-Controlled Organizations
                (QCCO), this 409A plan allows participants to defer compensation above and beyond standard retirement
                contribution limits.
              </p>
              <div className="service-native-action-row">
                <Link to="/services/retirement/409a" className="service-native-btn">Learn more</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="service-native-section retirement-calc-section">
        <div className="ag-panel-rail-wide">
          <h2 className="retirement-calc-title">Retirement Savings Calculator</h2>
          <p className="retirement-calc-lead">Plug in some numbers. Take a sneak peek at your financial future.</p>

          <div className="retirement-calc-box fade-up">
            <div className="retirement-calc-grid">
                  <label>
                    Current Age
                    <input type="number" value={calc.ageNow} onChange={(e) => onCalcNumberChange('ageNow', e.target.value)} />
                  </label>
                  <label>
                    Retirement Age
                    <input type="number" value={calc.retireAge} onChange={(e) => onCalcNumberChange('retireAge', e.target.value)} />
                  </label>
                  <label>
                    Life Expectancy
                    <input type="number" value={calc.lifeExpectancy} onChange={(e) => onCalcNumberChange('lifeExpectancy', e.target.value)} />
                  </label>
                  <label>
                    Current Retirement Savings ($)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={calc.currentSavings}
                      onChange={(e) => onCalcAmountChange('currentSavings', e.target.value)}
                    />
                  </label>
                  <label>
                    Monthly Contributions ($)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={calc.monthlySavings}
                      onChange={(e) => onCalcAmountChange('monthlySavings', e.target.value)}
                    />
                  </label>
                  <label>
                    Desired Annual Retirement Income ($)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={calc.desiredIncome}
                      onChange={(e) => onCalcAmountChange('desiredIncome', e.target.value)}
                    />
                  </label>
                  <label>
                    Expected Annual Social Security ($)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={calc.socialSecurity}
                      onChange={(e) => onCalcAmountChange('socialSecurity', e.target.value)}
                    />
                  </label>
                  <label>
                    Expected Annual Return (%): <strong>{calcResults.growthPercent}</strong>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.1"
                      value={calc.growthRate}
                      onChange={(e) => onCalcNumberChange('growthRate', e.target.value)}
                    />
                  </label>
                </div>

            <div className="retirement-calc-results">
              <h3>Results</h3>
              <p className="retirement-calc-result-row">
                <span>Total Needed at Retirement:</span>
                <strong>${dollars(calcResults.neededNestEgg)}</strong>
              </p>
              <p className="retirement-calc-result-row">
                <span>Projected Savings at Retirement:</span>
                <strong>${dollars(calcResults.projectedSavings)}</strong>
              </p>
              <p className="retirement-calc-result-row">
                <span>Additional Monthly Savings Needed:</span>
                <strong>${dollars(calcResults.extraNeeded)}</strong>
              </p>

              <div className="retirement-calc-chart" aria-hidden="true">
                <svg viewBox={`0 0 ${calcResults.chartWidth} ${calcResults.chartHeight}`} role="img" aria-label="Retirement projection chart">
                  <line
                    x1={calcResults.padLeft}
                    y1={calcResults.chartHeight - calcResults.padBottom}
                    x2={calcResults.chartWidth - calcResults.padRight}
                    y2={calcResults.chartHeight - calcResults.padBottom}
                    stroke="#d3d8dd"
                    strokeWidth="1"
                  />
                  {calcResults.yTicks.map((tick) => (
                    <g key={tick.value}>
                      <line
                        x1={calcResults.padLeft}
                        y1={tick.y}
                        x2={calcResults.chartWidth - calcResults.padRight}
                        y2={tick.y}
                        stroke="#edf1f4"
                        strokeWidth="1"
                      />
                      <text
                        x={calcResults.padLeft - 10}
                        y={tick.y + 4}
                        textAnchor="end"
                        fontSize="12"
                        fill="#6a7480"
                      >
                        ${tick.value.toLocaleString()}
                      </text>
                    </g>
                  ))}
                  <polyline
                    fill="none"
                    stroke="#00A3B3"
                    strokeWidth="3"
                    points={calcResults.projectedPoints}
                  />
                  <polyline
                    fill="none"
                    stroke="#FFA400"
                    strokeWidth="3"
                    points={calcResults.targetPoints}
                  />
                  {calcResults.labels.length > 0 ? (
                    <>
                      <text
                        x={calcResults.padLeft}
                        y={calcResults.chartHeight - 8}
                        textAnchor="start"
                        fontSize="12"
                        fill="#6a7480"
                      >
                        Age {calcResults.labels[0]}
                      </text>
                      <text
                        x={calcResults.chartWidth - calcResults.padRight}
                        y={calcResults.chartHeight - 8}
                        textAnchor="end"
                        fontSize="12"
                        fill="#6a7480"
                      >
                        Age {calcResults.labels[calcResults.labels.length - 1]}
                      </text>
                    </>
                  ) : null}
                </svg>
                <div className="retirement-calc-legend">
                  <span className="is-projected">Projected balance</span>
                  <span className="is-target">Target at retirement</span>
                </div>
              </div>
            </div>

            <div className="retirement-lead-form">
              <h4>Ready to take the next step?</h4>
              <p>Enter your info below to start a chat about your retirement.</p>
              {leadSubmitted ? (
                <p className="retirement-lead-thanks">
                  Thanks for reaching out! A retirement advisor will review your info and follow up shortly.
                </p>
              ) : (
                <form onSubmit={onLeadSubmit}>
                  <div className="retirement-calc-grid">
                    <label>
                      Name
                      <input
                        type="text"
                        value={leadForm.name}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        type="tel"
                        value={leadForm.phone}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: formatPhoneInput(event.target.value) }))}
                      />
                    </label>
                    <label>
                      Organization
                      <input
                        type="text"
                        value={leadForm.organization}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, organization: event.target.value }))}
                      />
                    </label>
                    <label>
                      State
                      <select
                        value={leadForm.state}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, state: event.target.value }))}
                      >
                        <option value="">State</option>
                        {states.map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="retirement-calc-grid-span">
                      Email
                      <input
                        type="email"
                        value={leadForm.email}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
                        required
                      />
                    </label>
                  </div>
                  <div className="service-native-action-row">
                    <button type="submit" className="service-native-btn retirement-btn-reset">Send</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="service-native-section retirement-everyday">
        <div className="ag-panel-rail">
          <h2>
            Retire a little <mark>every day</mark>.
          </h2>
          <h3>Starting now.</h3>
          <div className="service-native-action-row" style={{ justifyContent: 'center' }}>
            <Link to="/services/retirement/retirement-consultants" className="service-native-btn">
              Reach my consultant
            </Link>
          </div>
        </div>
      </section>

      <section className="service-native-section retirement-feature is-housing">
        <div className="ag-panel-rail-wide">
          <div className="retirement-feature-grid">
            <div className="retirement-feature-media">
              <img src={ministersHousingImage} alt="Ministers Housing Allowance" />
            </div>
            <div className="retirement-feature-copy">
              <h3>Ministers Housing Allowance</h3>
              <p>
                The IRS allows retired ministers to have distributions from the <strong>AGFinancial 403(b)</strong>{' '}
                plan declared as ministers housing allowance-a significant tax savings.
              </p>
              <div className="service-native-action-row">
                <Link to="/services/retirement/403b#housing" className="service-native-btn">See the details</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="service-native-section retirement-feature is-online">
        <div className="ag-panel-rail-wide">
          <div className="retirement-feature-grid">
            <div className="retirement-feature-copy">
              <h3>Online Contributions</h3>
              <p>
                This online tool for <strong>employer</strong> contributions will help minimize monthly data entry
                and maximize accuracy as you make retirement contributions on behalf of your employees.
              </p>
              <div className="service-native-action-row">
                <Link to="/online-contributions" className="service-native-btn">Submit contributions</Link>
              </div>
            </div>
            <div className="retirement-feature-media">
              <img src={retirementKeyboardImage} alt="Online Contributions" />
            </div>
          </div>
        </div>
      </section>

      <section className="service-native-section retirement-addon-wrap">
        <div className="ag-panel-rail">
          <div className="retirement-addon-box">
            <h3>Imagine the possibilities.</h3>
            <form onSubmit={onCtaSubmit}>
              <label htmlFor="retirement-cta-name">Name</label>
              <input
                id="retirement-cta-name"
                type="text"
                value={ctaForm.name}
                onChange={(event) => setCtaForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />

              <label htmlFor="retirement-cta-email">Email</label>
              <input
                id="retirement-cta-email"
                type="email"
                value={ctaForm.email}
                onChange={(event) => setCtaForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />

              <label htmlFor="retirement-cta-phone">Phone</label>
              <input
                id="retirement-cta-phone"
                type="tel"
                placeholder="(555) 555-5555"
                value={ctaForm.phone}
                onChange={(event) => setCtaForm((prev) => ({ ...prev, phone: formatPhoneInput(event.target.value) }))}
              />

              <h4>Let&apos;s explore together.</h4>
              <button type="submit" className="service-native-btn retirement-btn-reset">Follow-up with me</button>
              <small>{ctaMessage}</small>
            </form>
          </div>
        </div>
      </section>

      <section className="service-native-section retirement-testimonials">
        <div className="ag-panel-rail">
          <div className="carousel-stack">
            {testimonials.map((item, index) => (
              <article key={item.author} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                <p className="retirement-testimonial-quote"><strong>{item.quote}</strong></p>
                <p className="retirement-testimonial-author">-<strong>{item.author}</strong></p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-native-section retirement-fineprint">
        <div className="ag-panel-rail">
          <p className="service-native-note">
            Testimonials found on this site are examples of what we have done for other clients, and what some of
            our clients have said about us. However, we cannot guarantee the results in any case. Your results may
            vary and every situation is different. No compensation was provided for these testimonials.
          </p>
        </div>
      </section>

      <section className="service-native-section retirement-top3">
        <div className="ag-panel-rail-wide">
          <div className="service-native-dark-feature">
            <div className="service-native-dark-feature-inner">
              <div className="service-native-dark-feature-media retirement-top3-media" style={{ backgroundImage: `url(${retirementTop3Image})` }} />
              <div className="service-native-dark-feature-copy">
                <h3>Top 3 investing mistakes to avoid...</h3>
                <p>... and how to navigate today&apos;s volatile markets.</p>
                <div className="service-native-action-row">
                  <a href="/resources" className="service-native-btn">Read more</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
