import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRates } from '../context/RatesContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';

const OFFERING_CIRCULAR_URL = 'https://media.agfinancial.org/AGLF-Offering-Circular.pdf';

const certificateCards = [
  {
    titleTop: 'Demand',
    titleBottom: 'Certificates',
    description: 'Demand Certificates are variable rate investments that provide access to funds on demand (within 30 days).',
    minimum: 'Minimum investment $250.',
  },
  {
    titleTop: 'Term',
    titleBottom: 'Certificates',
    description: 'Term Certificates have fixed or variable interest rates over a predetermined amount of time, ranging from three months to ten years.',
    minimum: 'Minimum investment $500.',
  },
];

const growthCards = [
  {
    title: 'Grow your return.',
    body: 'Why choose between financial growth and spiritual impact? Deliver both at the same time.',
  },
  {
    title: 'Grow your "Plan B."',
    body: "Your church's emergency funds should build the Kingdom while preparing for the unexpected.",
  },
  {
    title: 'Grow the Kingdom.',
    body: "Every dollar helps provide loans to churches and ministries. Today's investment is tomorrow's church.",
  },
];

const testimonials = [
  {
    quote: '"It\'s an easy yes for me to continue to recommend AGFinancial."',
    authorName: 'Jeremy Johnson',
    authorTitle: 'President, Northwest University',
  },
  {
    quote: '"There are two returns. There\'s a return on the investment, and there\'s a return to the Kingdom."',
    authorName: 'Bryan Jarrett',
    authorTitle: 'Pastor, Northplace Church, TX',
  },
  {
    quote: '"Convoy of Hope would not be where we are without our partnership with AGFinancial."',
    authorName: 'Hal Donaldson',
    authorTitle: 'President, Convoy of Hope',
  },
];

const MAX_LADDER_YEARS = 20;
const DEFAULT_LADDER_YEARS = 5;
const MAX_VISUALIZE_YEARS = 60;
const DEFAULT_LADDER_TOTAL = '100,000';

const ladderStateOptions = [
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

function formatNumberInput(value) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  if (!cleaned) {
    return '';
  }
  const [whole, ...decimals] = cleaned.split('.');
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return [formattedWhole, ...decimals].join('.');
}

function parseNumber(value) {
  return Number.parseFloat(String(value || '').replace(/,/g, '')) || 0;
}

function parseInteger(value) {
  return Number.parseInt(String(value || '').replace(/\D/g, ''), 10) || 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function suggestedHorizon(ladderYears) {
  return Math.max(ladderYears + 5, 10);
}

function formatCurrency(value) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function parsePercentValue(value) {
  const cleaned = String(value || '').replace(/[^0-9.]/g, '');
  if (!cleaned) {
    return null;
  }
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function getLadderYearApy(rows, year) {
  const row = rows.find((item) => String(item.product || '').toUpperCase().includes(`${year}-YEAR`));
  if (!row && year > 0) {
    return null;
  }
  const preferred = [row.standardApy, row.premiumApy, row.standardRate, row.premiumRate];
  for (const entry of preferred) {
    const value = parsePercentValue(entry);
    if (value !== null) {
      return value.toFixed(2);
    }
  }
  return null;
}

function buildLadderRateSeeds(rows, maxYears) {
  const fallbackDefault = '4.00';
  const seeds = {};
  let fallbackRate = getLadderYearApy(rows || [], DEFAULT_LADDER_YEARS) || fallbackDefault;

  for (let year = 1; year <= maxYears; year += 1) {
    const next = getLadderYearApy(rows || [], year);
    if (next !== null) {
      seeds[year] = next;
      fallbackRate = next;
    } else {
      seeds[year] = fallbackRate;
    }
  }
  return seeds;
}

function splitPrincipalEvenly(totalInvestment, ladderYears) {
  const totalCents = Math.round(totalInvestment * 100);
  const baseCents = Math.floor(totalCents / ladderYears);
  const remainder = totalCents - (baseCents * ladderYears);
  const slices = [];

  for (let index = 0; index < ladderYears; index += 1) {
    const cents = index === ladderYears - 1 ? baseCents + remainder : baseCents;
    slices.push(cents / 100);
  }
  return slices;
}

function computeApyInterest(principal, apyPercent, years) {
  const apyDecimal = apyPercent / 100;
  return principal * (Math.pow(1 + apyDecimal, years) - 1);
}

// Year-by-year ladder simulation with rollover support.
function simulateLadderSchedule({
  totalInvestment,
  ladderYears,
  horizonYears,
  reinvestMode,
  apyByYear,
}) {
  const principalSlices = splitPrincipalEvenly(totalInvestment, ladderYears);
  const initialRows = [];
  const scheduleRows = [];
  const timelineBars = [];
  const activeRungs = [];

  let rungId = 0;
  let totalInterestEarnedToDate = 0;

  const createRung = ({ principal, termYears, startYear, isRollover }) => {
    const apyPercent = apyByYear[termYears];
    const interest = computeApyInterest(principal, apyPercent, termYears);
    return {
      id: ++rungId,
      principal,
      termYears,
      apyPercent,
      startYear,
      maturityYear: startYear + termYears,
      interest,
      endingValue: principal + interest,
      isRollover,
    };
  };

  for (let termYears = 1; termYears <= ladderYears; termYears += 1) {
    const rung = createRung({
      principal: principalSlices[termYears - 1],
      termYears,
      startYear: 0,
      isRollover: false,
    });
    activeRungs.push(rung);
    initialRows.push(rung);
    timelineBars.push(rung);
  }

  for (let year = 1; year <= horizonYears; year += 1) {
    const maturedRungs = [];
    for (let index = activeRungs.length - 1; index >= 0; index -= 1) {
      if (activeRungs[index].maturityYear === year) {
        maturedRungs.push(activeRungs[index]);
        activeRungs.splice(index, 1);
      }
    }

    const principalMaturing = maturedRungs.reduce((sum, rung) => sum + rung.principal, 0);
    const interestMaturing = maturedRungs.reduce((sum, rung) => sum + rung.interest, 0);
    totalInterestEarnedToDate += interestMaturing;

    let reinvestedPrincipal = 0;
    if (reinvestMode === 'reinvest_longest' && principalMaturing > 0) {
      maturedRungs.forEach((matured) => {
        const rolledRung = createRung({
          principal: matured.principal,
          termYears: ladderYears,
          startYear: year,
          isRollover: true,
        });
        activeRungs.push(rolledRung);
        timelineBars.push(rolledRung);
        reinvestedPrincipal += matured.principal;
      });
    }

    // "Available" reflects what matures this year, regardless of reinvest choice.
    const principalAvailable = principalMaturing;
    const interestAvailable = interestMaturing;
    const totalCashAvailable = principalAvailable + interestAvailable;
    const lockedPrincipal = activeRungs.reduce((sum, rung) => sum + rung.principal, 0);

    scheduleRows.push({
      year,
      principalMaturing,
      interestMaturing,
      reinvested: reinvestedPrincipal > 0,
      reinvestedPrincipal,
      principalAvailable,
      interestAvailable,
      totalCashAvailable,
      lockedPrincipal,
      totalInterestEarnedToDate,
    });
  }

  return {
    ladderYears,
    horizonYears,
    reinvestMode,
    totalInvestment,
    apyByYear,
    initialRows,
    scheduleRows,
    timelineBars,
  };
}

function defaultLadderInput() {
  const years = DEFAULT_LADDER_YEARS;
  return {
    totalInvestment: DEFAULT_LADDER_TOTAL,
    ladderYears: String(years),
    visualizeYears: String(suggestedHorizon(years)),
    reinvestMode: 'reinvest_longest',
  };
}

export default function InvestmentsPage() {
  const pageRef = useRef(null);
  const { rates, ratesMeta } = useRates();
  const ladderRateSeeds = useMemo(() => buildLadderRateSeeds(rates, MAX_LADDER_YEARS), [rates]);
  const [ladderInput, setLadderInput] = useState(() => defaultLadderInput());
  const [ladderRates, setLadderRates] = useState(() => ladderRateSeeds);
  const [ladderResult, setLadderResult] = useState(null);
  const [ladderError, setLadderError] = useState('');
  const [ladderVisualizeTouched, setLadderVisualizeTouched] = useState(false);
  const [ladderDownload, setLadderDownload] = useState({
    name: '',
    email: '',
  });
  const [ladderDiscuss, setLadderDiscuss] = useState({
    organization: '',
    state: '',
    phone: '',
  });
  const [ladderDiscussMessage, setLadderDiscussMessage] = useState('');
  useNativeEnhancements(pageRef);

  useEffect(() => {
    setLadderInput(defaultLadderInput());
    setLadderRates(ladderRateSeeds);
    setLadderResult(null);
    setLadderError('');
    setLadderVisualizeTouched(false);
  }, [ladderRateSeeds]);

  const ladderYears = clamp(
    parseInteger(ladderInput.ladderYears) || DEFAULT_LADDER_YEARS,
    1,
    MAX_LADDER_YEARS,
  );

  const ladderBuildSteadyCopy = `In the early years, you're building the ladder. After year ${ladderYears}, you'll usually see a steady rhythm, and something matures each year.`;
  const ladderToggleHelper = ladderInput.reinvestMode === 'reinvest_longest'
    ? 'Keep the ladder going: roll each maturity into a new longest-term certificate.'
    : 'Take maturities as cash: the ladder will gradually wind down.';

  const hasCustomRateInputs = Array.from({ length: ladderYears }, (_, index) => index + 1).some((year) => (
    Math.abs(parseNumber(ladderRates[year]) - parseNumber(ladderRateSeeds[year])) > 0.0001
  ));

  const canDownloadLadder = Boolean(ladderResult)
    && ladderDownload.name.trim().length > 0
    && isValidEmail(ladderDownload.email);
  const ladderDiscussTone = ladderDiscussMessage.startsWith('Thanks') ? 'is-success' : 'is-alert';

  const timelineYears = useMemo(() => (
    ladderResult ? Array.from({ length: ladderResult.horizonYears + 1 }, (_, year) => year) : []
  ), [ladderResult]);

  const timelineBars = useMemo(() => {
    if (!ladderResult) {
      return [];
    }
    const horizon = ladderResult.horizonYears;
    return ladderResult.timelineBars
      .filter((bar) => bar.startYear < horizon)
      .slice()
      .sort((a, b) => (
        a.startYear - b.startYear
        || a.maturityYear - b.maturityYear
        || a.id - b.id
      ));
  }, [ladderResult]);

  const ladderSummary = useMemo(() => {
    if (!ladderResult) {
      return null;
    }
    const totalPrincipalMaturing = ladderResult.scheduleRows.reduce((sum, row) => sum + row.principalMaturing, 0);
    const totalInterestMaturing = ladderResult.scheduleRows.reduce((sum, row) => sum + row.interestMaturing, 0);
    const totalCashAvailable = ladderResult.scheduleRows.reduce((sum, row) => sum + row.totalCashAvailable, 0);
    return {
      totalPrincipalMaturing,
      totalInterestMaturing,
      totalCashAvailable,
    };
  }, [ladderResult]);

  const onLadderTotalChange = (value) => {
    setLadderInput((prev) => ({ ...prev, totalInvestment: formatNumberInput(value) }));
  };

  const onLadderYearsChange = (value) => {
    const normalizedYears = clamp(parseInteger(value) || 1, 1, MAX_LADDER_YEARS);
    setLadderInput((prev) => ({
      ...prev,
      ladderYears: String(normalizedYears),
      visualizeYears: ladderVisualizeTouched
        ? prev.visualizeYears
        : String(suggestedHorizon(normalizedYears)),
    }));
    setLadderRates((prev) => {
      const next = { ...prev };
      for (let year = 1; year <= normalizedYears; year += 1) {
        if (!next[year]) {
          next[year] = year === 1
            ? ladderRateSeeds[1]
            : next[year - 1] || ladderRateSeeds[year] || ladderRateSeeds[DEFAULT_LADDER_YEARS];
        }
      }
      return next;
    });
  };

  const onLadderVisualizeYearsChange = (value) => {
    const parsed = clamp(parseInteger(value) || 1, 1, MAX_VISUALIZE_YEARS);
    setLadderVisualizeTouched(true);
    setLadderInput((prev) => ({ ...prev, visualizeYears: String(parsed) }));
  };

  const onLadderReinvestModeChange = (value) => {
    setLadderInput((prev) => ({ ...prev, reinvestMode: value }));
  };

  const onLadderRateChange = (year, value) => {
    setLadderRates((prev) => ({ ...prev, [year]: formatNumberInput(value) }));
  };

  const calculateLadder = () => {
    try {
      const totalInvestment = parseNumber(ladderInput.totalInvestment);
      if (totalInvestment <= 0) {
        throw new Error('Enter a total investment amount greater than $0.');
      }

      const normalizedYears = clamp(parseInteger(ladderInput.ladderYears) || DEFAULT_LADDER_YEARS, 1, MAX_LADDER_YEARS);
      let horizonYears = parseInteger(ladderInput.visualizeYears);
      if (!horizonYears) {
        horizonYears = suggestedHorizon(normalizedYears);
      }
      horizonYears = clamp(horizonYears, normalizedYears + 1, MAX_VISUALIZE_YEARS);

      const apyByYear = {};
      for (let year = 1; year <= normalizedYears; year += 1) {
        const apy = parseNumber(ladderRates[year]);
        if (apy < 0) {
          throw new Error('APY values must be zero or greater.');
        }
        apyByYear[year] = apy;
      }

      const result = simulateLadderSchedule({
        totalInvestment,
        ladderYears: normalizedYears,
        horizonYears,
        reinvestMode: ladderInput.reinvestMode,
        apyByYear,
      });

      setLadderInput((prev) => ({
        ...prev,
        ladderYears: String(normalizedYears),
        visualizeYears: String(horizonYears),
      }));
      setLadderError('');
      setLadderResult(result);
    } catch (error) {
      setLadderResult(null);
      setLadderError(error instanceof Error ? error.message : 'Unable to calculate ladder.');
    }
  };

  const downloadLadderSample = () => {
    if (!canDownloadLadder || !ladderResult) {
      return;
    }
    const summary = [
      'AGFinancial Laddering Sample',
      '',
      `Prepared for: ${ladderDownload.name.trim()}`,
      `Email: ${ladderDownload.email.trim()}`,
      '',
      `Total Investment Amount: $${formatCurrency(ladderResult.totalInvestment)}`,
      `Ladder span (years / longest term): ${ladderResult.ladderYears}`,
      `Years to visualize: ${ladderResult.horizonYears}`,
      `Maturity behavior: ${ladderResult.reinvestMode === 'reinvest_longest' ? 'Reinvest into longest term' : 'Keep matured principal as cash'}`,
      'Return model: APY-based effective annual yield, principal-only reinvestment',
      '',
      'Year | Principal Maturing | Interest Maturing | Reinvested | Locked Principal | Cash Available',
      ...ladderResult.scheduleRows.map((row) => (
        `Year ${row.year} | ${formatCurrency(row.principalMaturing)} | ${formatCurrency(row.interestMaturing)} | ${row.reinvested ? 'Yes' : 'No'} | ${formatCurrency(row.lockedPrincipal)} | ${formatCurrency(row.totalCashAvailable)}`
      )),
      '',
      'This tool illustrates ladder mechanics. APY values can change. Results are estimates.',
    ].join('\n');
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeName = ladderDownload.name.trim().replace(/[^\w-]+/g, '-');
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeName || 'investor'}-laddering-sample.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const sendLadderDiscuss = () => {
    if (ladderDiscuss.state === 'OH') {
      setLadderDiscussMessage('Investments are not available in Ohio.');
      return;
    }
    if (!ladderDiscuss.phone.trim()) {
      setLadderDiscussMessage('Add a phone number so our team can follow up.');
      return;
    }
    setLadderDiscussMessage('Thanks. A member of our investments team will contact you soon.');
  };

  return (
    <div ref={pageRef} className="service-native-page investments-native-page">
      <section className="service-native-hero investments-native-hero">
        <div className="ag-panel-rail">
          <h1 className="line1 line2">
            Your <mark className="is-atlantean">investments</mark>. Your <mark className="is-mango">faith</mark>. Better <mark className="is-sandstone">together</mark>.
          </h1>
        </div>
      </section>

      <section className="service-native-intro investments-native-intro fade-out">
        <div className="ag-panel-rail">
          <h2>Invest like it matters. <mark>Because it does.</mark></h2>
          <p>Your investment dollars don't just multiply-they multiply ministry impact. Every dollar you invest generates a competitive return while funding church construction and ministry growth. When you invest like it matters, everything matters more.</p>
          <p className="investments-native-intro-tagline"><strong>That's the power of faith-driven investing.</strong></p>
        </div>
      </section>

      <section className="service-native-section investments-native-panel" id="certificates">
        <div className="ag-panel-rail">
          <div className="service-native-grid is-two investments-native-cert-grid fade-out">
            {certificateCards.map((card) => (
              <article key={`${card.titleTop}-${card.titleBottom}`} className="service-native-card card1 investments-native-cert-card fade-up">
                <h3>{card.titleTop}<br />{card.titleBottom}</h3>
                <p>
                  {card.description}
                  {' '}
                  <strong>{card.minimum}</strong>
                </p>
                <div className="service-native-action-row">
                  <a href="https://secure.agfinancial.org/invest" target="_blank" rel="noreferrer noopener" className="service-native-btn">
                    Start investing
                  </a>
                </div>
              </article>
            ))}
          </div>

          <h2 className="investments-native-build-title fade-out">
            <mark>Build</mark>
            {' '}
            financial health.
            {' '}
            <mark>Grow</mark>.
            {' '}
            <mark>Minister</mark>.
          </h2>

          <div className="service-native-grid investments-native-growth-grid fade-out">
            {growthCards.map((card) => (
              <article key={card.title} className="investments-native-growth-card fade-up">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-native-section investments-native-rates-section">
        <div className="ag-panel-rail" id="rates">
          <h2 className="investments-native-rates-title">AGFinancial Investment Certificates Rates</h2>
          <div className="service-native-rates investments-native-rates-wrap fade-up">
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
          <div className="rates-disclaimer investments-native-rates-disclaimer">
            <p className="investments-native-rates-disclaimer-lead">
              <strong>*Annual Percentage Yield</strong>
              <br />
              <strong>**Premium rates may be available for investments of $250,000 or greater.</strong>
              <br />
              <strong>Effective {ratesMeta?.certificatesEffectiveDate || 'January 1, 2025'}.</strong>
            </p>
            <p>
              Rates subject to change. Demand certificates are investments that do not represent cash and are payable
              within 30 days after demand by the investor. Penalties may apply to redemptions prior to maturity.
            </p>
            <p>
              This is not an offer to sell securities referred to herein and we are not soliciting you to purchase
              these securities. The offering is made only by the Offering Circular which includes risk factors. The
              Offering Circular may be obtained by writing or calling AGFinancial or by clicking
              {' '}
              <a href={OFFERING_CIRCULAR_URL} target="_blank" rel="noreferrer noopener">here</a>
              . AGFinancial investments are offered and sold only in states where authorized or exempt from
              authorization. A limited offering is available in Washington. Not available in Ohio.
            </p>
            <p>Not FDIC or SIPC Insured. Not a Bank Deposit. No AGFinancial Guarantee.</p>
            <p>
              <em>AGFinancial is a DBA of Assemblies of God Loan Fund, an affiliated entity of Assemblies of God Financial Services Group.</em>
            </p>
          </div>
        </div>
      </section>

      <section className="service-native-cta-band investments-native-dashboard-band">
        <div className="ag-panel-rail">
          <h2 className="investments-native-dashboard-title">Already an investor?</h2>
          <p>Log in to manage.</p>
          <div className="service-native-action-row is-centered">
            <a href="https://secure.agfinancial.org/" target="_blank" rel="noreferrer noopener" className="service-native-btn">
              Go to my dashboard
            </a>
          </div>
        </div>
      </section>

      <section className="service-native-section investments-native-ladder-section">
        <div className="ag-panel-rail">
          <div className="investments-native-ladder-box fade-up">
            <h2>Investment Laddering Strategy</h2>
            <h3>Longer term rates with shorter term access</h3>
            <p className="investments-native-ladder-copy">
              Laddering splits your savings into multiple certificates that mature at different times. That gives you
              regular access to cash while you pursue longer-term rates.
            </p>
            <h4 className="investments-native-ladder-subtitle">How it works</h4>
            <ul className="investments-native-ladder-list">
              <li>Split your total into equal parts.</li>
              <li>Start by buying certificates with staggered maturities (1-year, 2-year, 3-year...).</li>
              <li>When one matures, either reinvest into your selected longest-term certificate to keep the ladder going, or take the maturity as cash.</li>
            </ul>

            <p className="investments-native-ladder-phase-note">{ladderBuildSteadyCopy}</p>

            <div className="investments-native-ladder-grid is-meta">
              <label htmlFor="ladder-total">
                Total Investment Amount
                <div className="investments-native-ladder-currency">
                  <input
                    id="ladder-total"
                    type="text"
                    inputMode="decimal"
                    value={ladderInput.totalInvestment}
                    onChange={(event) => onLadderTotalChange(event.target.value)}
                  />
                </div>
              </label>

              <label htmlFor="ladder-years">
                Ladder span (years / longest term)
                <input
                  id="ladder-years"
                  type="text"
                  inputMode="numeric"
                  value={ladderInput.ladderYears}
                  onChange={(event) => onLadderYearsChange(event.target.value)}
                />
                <span className="investments-native-ladder-field-helper">
                  Builds 1-year through N-year certificates; reinvestment uses the N-year term.
                </span>
              </label>
            </div>

            <div className="investments-native-ladder-maturity">
              <p className="investments-native-ladder-field-label">When a certificate matures</p>
              <div className="investments-native-ladder-reinvest-toggle">
                <label htmlFor="ladder-reinvest">
                  <input
                    id="ladder-reinvest"
                    type="radio"
                    name="ladder-reinvest-mode"
                    value="reinvest_longest"
                    checked={ladderInput.reinvestMode === 'reinvest_longest'}
                    onChange={(event) => onLadderReinvestModeChange(event.target.value)}
                  />
                  Reinvest matured principal into longest term
                </label>
                <label htmlFor="ladder-cashout">
                  <input
                    id="ladder-cashout"
                    type="radio"
                    name="ladder-reinvest-mode"
                    value="cash_out"
                    checked={ladderInput.reinvestMode === 'cash_out'}
                    onChange={(event) => onLadderReinvestModeChange(event.target.value)}
                  />
                  Keep matured principal as cash
                </label>
              </div>
              <p className="investments-native-ladder-helper">{ladderToggleHelper}</p>
            </div>

            <div className="investments-native-ladder-visualize">
              <label htmlFor="ladder-visualize-years">
                Timeline years to visualize
                <input
                  id="ladder-visualize-years"
                  type="text"
                  inputMode="numeric"
                  value={ladderInput.visualizeYears}
                  onChange={(event) => onLadderVisualizeYearsChange(event.target.value)}
                />
              </label>
              <p className="investments-native-ladder-helper">
                Timeline filter only. Increase or decrease to expand the visual range.
              </p>
            </div>

            <div className="investments-native-ladder-rate-grid">
              {Array.from({ length: ladderYears }, (_, index) => index + 1).map((year) => (
                <label key={year} htmlFor={`ladder-rate-${year}`}>
                  {year}
                  -Year APY (%)
                  <input
                    id={`ladder-rate-${year}`}
                    type="text"
                    inputMode="decimal"
                    value={ladderRates[year] || ''}
                    onChange={(event) => onLadderRateChange(year, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <div className="service-native-action-row investments-native-ladder-action">
              <button type="button" className="service-native-btn" onClick={calculateLadder}>
                Calculate
              </button>
            </div>
            <p className="investments-native-ladder-note">
              Calculator math uses APY as an effective annual yield estimate.
            </p>
            <p className="investments-native-ladder-disclaimer">
              This tool illustrates ladder mechanics. APY values can change. Results are estimates.
            </p>
            {hasCustomRateInputs ? (
              <p className="investments-native-ladder-custom-note">
                Rates entered here are for illustration only and are not AGFinancial posted APY values or guarantees.
              </p>
            ) : null}
            {ladderError ? <p className="investments-native-ladder-error">{ladderError}</p> : null}

            {ladderResult ? (
              <div className="investments-native-ladder-results">
                <h3>Ladder Breakdown</h3>
                <div className="table-scroll">
                  <table className="ag-table has-fixed-layout">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Principal</th>
                        <th>APY</th>
                        <th>Interest Earned</th>
                        <th>Ending Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ladderResult.initialRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.termYears}-Year</td>
                          <td>${formatCurrency(row.principal)}</td>
                          <td>{row.apyPercent.toFixed(2)}%</td>
                          <td>${formatCurrency(row.interest)}</td>
                          <td>${formatCurrency(row.endingValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {ladderSummary ? (
                  <div className="investments-native-ladder-summary-grid">
                    <article className="investments-native-ladder-summary-card">
                      <strong>Total principal maturing (timeline)</strong>
                      <span>${formatCurrency(ladderSummary.totalPrincipalMaturing)}</span>
                    </article>
                    <article className="investments-native-ladder-summary-card">
                      <strong>Total interest maturing (timeline)</strong>
                      <span>${formatCurrency(ladderSummary.totalInterestMaturing)}</span>
                    </article>
                    <article className="investments-native-ladder-summary-card">
                      <strong>Cumulative cash available (timeline)</strong>
                      <span>${formatCurrency(ladderSummary.totalCashAvailable)}</span>
                    </article>
                  </div>
                ) : null}

                <div className="investments-native-ladder-accordion">
                  <details className="investments-native-ladder-accordion-item">
                    <summary className="investments-native-ladder-accordion-summary">Timeline</summary>
                    <div className="investments-native-ladder-accordion-body">
                      <div className="investments-native-ladder-timeline-scroll">
                        <div className="investments-native-ladder-timeline-shell">
                          <div
                            className="investments-native-ladder-timeline-grid"
                            style={{ gridTemplateColumns: `repeat(${timelineYears.length}, minmax(92px, 1fr))` }}
                          >
                            {timelineYears.map((year) => (
                              <div key={`label-${year}`} className="investments-native-ladder-year-label">Year {year}</div>
                            ))}
                          </div>
                          <div
                            className="investments-native-ladder-timeline-grid is-badge-row"
                            style={{ gridTemplateColumns: `repeat(${timelineYears.length}, minmax(92px, 1fr))` }}
                          >
                            <div className="investments-native-ladder-year-badge">
                              <strong>Start</strong>
                              Initial purchase
                            </div>
                            {ladderResult.scheduleRows.map((row) => (
                              <div key={`badge-${row.year}`} className="investments-native-ladder-year-badge">
                                <strong>Matures</strong>
                                ${formatCurrency(row.principalMaturing)}
                                <br />
                                Interest: ${formatCurrency(row.interestMaturing)}
                              </div>
                            ))}
                          </div>
                          <div className="investments-native-ladder-timeline-rungs">
                            {timelineBars.map((bar, index) => {
                              const safeHorizon = Math.max(ladderResult.horizonYears, 1);
                              const visibleStart = Math.max(0, Math.min(bar.startYear, safeHorizon));
                              const visibleEnd = Math.max(visibleStart, Math.min(bar.maturityYear, safeHorizon));
                              const spanYears = Math.max(0.01, visibleEnd - visibleStart);
                              const leftPct = (visibleStart / safeHorizon) * 100;
                              const widthPct = (spanYears / safeHorizon) * 100;
                              const maturityPct = (Math.min(bar.maturityYear, safeHorizon) / safeHorizon) * 100;

                              return (
                                <div key={bar.id} className="investments-native-ladder-rung-row">
                                  <div className="investments-native-ladder-rung-label">Rung {index + 1}</div>
                                  <div className="investments-native-ladder-rung-track" style={{ '--ladder-tick-step': `${100 / safeHorizon}%` }}>
                                    <div
                                      className={`investments-native-ladder-rung-bar${bar.isRollover ? ' is-rollover' : ''}`}
                                      style={{
                                        left: `${leftPct}%`,
                                        width: `${widthPct}%`,
                                      }}
                                    >
                                      ${formatCurrency(bar.principal)} @ {bar.termYears}-year
                                    </div>
                                    <span className="investments-native-ladder-rung-dot" style={{ left: `${maturityPct}%` }} />
                                    {bar.isRollover ? (
                                      <span className="investments-native-ladder-rung-rollover" style={{ left: `${maturityPct}%` }}>-&gt;</span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>

                  <details className="investments-native-ladder-accordion-item">
                    <summary className="investments-native-ladder-accordion-summary">Year-by-year schedule</summary>
                    <div className="investments-native-ladder-accordion-body">
                      <div className="table-scroll">
                        <table className="ag-table has-fixed-layout">
                          <thead>
                            <tr>
                              <th>Year</th>
                              <th>Principal Maturing</th>
                              <th>Interest Maturing</th>
                              <th>Reinvested</th>
                              <th>Principal Still Locked</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ladderResult.scheduleRows.map((row) => (
                              <tr key={`schedule-${row.year}`}>
                                <td>Year {row.year}</td>
                                <td>${formatCurrency(row.principalMaturing)}</td>
                                <td>${formatCurrency(row.interestMaturing)}</td>
                                <td>{row.reinvested ? 'Yes' : 'No'}</td>
                                <td>${formatCurrency(row.lockedPrincipal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>

                  <details className="investments-native-ladder-accordion-item">
                    <summary className="investments-native-ladder-accordion-summary">Cash available by year</summary>
                    <div className="investments-native-ladder-accordion-body">
                      <div className="table-scroll">
                        <table className="ag-table has-fixed-layout">
                          <thead>
                            <tr>
                              <th>Year</th>
                              <th>Principal Available</th>
                              <th>Interest Available</th>
                              <th>Total Cash Available</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ladderResult.scheduleRows.map((row) => (
                              <tr key={`cash-${row.year}`}>
                                <td>Year {row.year}</td>
                                <td>${formatCurrency(row.principalAvailable)}</td>
                                <td>${formatCurrency(row.interestAvailable)}</td>
                                <td>${formatCurrency(row.totalCashAvailable)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                </div>

                <div className="investments-native-ladder-gated">
                  <div className="investments-native-ladder-gated-download">
                    <h4>Download your laddering sample.</h4>
                    <p className="investments-native-ladder-cta-note">
                      Provide your name and email to get your personalized laddering summary, including your inputs and yearly breakdown.
                    </p>
                    <div className="investments-native-ladder-gated-row">
                      <input
                        id="ladder-download-name"
                        type="text"
                        placeholder="Your name"
                        value={ladderDownload.name}
                        onChange={(event) => setLadderDownload((prev) => ({ ...prev, name: event.target.value }))}
                      />
                      <input
                        id="ladder-download-email"
                        type="email"
                        placeholder="you@example.com"
                        value={ladderDownload.email}
                        onChange={(event) => setLadderDownload((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>
                    <div className="investments-native-ladder-gated-actions">
                      <button type="button" className="service-native-btn" disabled={!canDownloadLadder} onClick={downloadLadderSample}>
                        Download sample
                      </button>
                    </div>
                  </div>

                  <div className="investments-native-ladder-contact">
                    <h4 className="investments-native-ladder-contact-heading">Ready to discuss your investment possibilities?</h4>
                    <p className="investments-native-ladder-contact-message">
                      A member of our investments team will contact you, ready to guide you through the process.
                    </p>
                    <div className="investments-native-ladder-contact-info-row">
                      <input
                        id="ladder-discuss-org"
                        type="text"
                        placeholder="Organization"
                        value={ladderDiscuss.organization}
                        onChange={(event) => setLadderDiscuss((prev) => ({ ...prev, organization: event.target.value }))}
                      />
                      <select
                        id="ladder-discuss-state"
                        value={ladderDiscuss.state}
                        onChange={(event) => setLadderDiscuss((prev) => ({ ...prev, state: event.target.value }))}
                      >
                        <option value="">State</option>
                        {ladderStateOptions.map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="investments-native-ladder-contact-phone-row">
                      <input
                        id="ladder-discuss-phone"
                        className="investments-native-ladder-contact-phone"
                        type="tel"
                        placeholder="(555) 555-5555"
                        value={ladderDiscuss.phone}
                        onChange={(event) => setLadderDiscuss((prev) => ({ ...prev, phone: formatPhoneInput(event.target.value) }))}
                      />
                      <div className="investments-native-ladder-contact-submit">
                        <button type="button" className="service-native-btn" onClick={sendLadderDiscuss}>
                          Send
                        </button>
                        {ladderDiscussMessage ? (
                          <span className={`investments-native-ladder-discuss-message ${ladderDiscussTone}`}>
                            {ladderDiscussMessage}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="service-native-section">
        <div className="ag-panel-rail">
          <div className="service-native-testimonials-wrap carousel-stack">
            {testimonials.map((item, index) => (
              <article key={item.authorName} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                <p style={{ fontSize: 'clamp(1.35rem, 2.9vw, 2.2rem)', lineHeight: 1.15 }}>{item.quote}</p>
                <p>-<strong>{item.authorName},</strong> <em>{item.authorTitle}</em></p>
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
