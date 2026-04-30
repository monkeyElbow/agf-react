import { useMemo, useState } from 'react';

const numberFormatter = new Intl.NumberFormat('en-US');

const ONE_LIFE_DEMO_RATES = {
  55: 4.8,
  60: 5.4,
  65: 5.7,
  70: 6.3,
  75: 7.0,
  80: 8.1,
  85: 9.1,
  90: 10.1,
};

const FREQUENCY_PERIODS = {
  Annual: 1,
  Semiannual: 2,
  Quarterly: 4,
  Monthly: 12,
};

function parseNumber(value) {
  return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
}

function formatMoney(value) {
  return `$${numberFormatter.format(Math.max(0, Math.round(value || 0)))}`;
}

function formatPercent(value) {
  return `${(Math.round((value || 0) * 10) / 10).toFixed(1)}%`;
}

function formatCurrencyInput(value) {
  const numeric = parseNumber(value);
  return numeric ? numberFormatter.format(numeric) : '';
}

function lerpRate(table, age) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (!keys.length) {
    return 0;
  }
  if (age <= keys[0]) {
    return table[keys[0]];
  }
  if (age >= keys[keys.length - 1]) {
    return table[keys[keys.length - 1]];
  }

  for (let index = 1; index < keys.length; index += 1) {
    if (age <= keys[index]) {
      const age0 = keys[index - 1];
      const age1 = keys[index];
      const rate0 = table[age0];
      const rate1 = table[age1];
      return rate0 + ((rate1 - rate0) * ((age - age0) / (age1 - age0)));
    }
  }

  return 0;
}

function oneLifeRate(age) {
  return lerpRate(ONE_LIFE_DEMO_RATES, age);
}

function twoLifeRate(age1, age2) {
  return 0.86 * oneLifeRate(Math.min(age1, age2));
}

function expectedYears(age) {
  if (age < 60) return 28;
  if (age < 65) return 24;
  if (age < 70) return 20;
  if (age < 75) return 16;
  if (age < 80) return 13;
  if (age < 85) return 10;
  if (age < 90) return 8;
  return 6;
}

function pvAnnuity(annual, rate, years, periods) {
  const i = rate / periods;
  const n = Math.max(1, Math.round(years * periods));
  const pmt = annual / periods;

  if (!i) {
    return pmt * n;
  }

  const pv = pmt * (1 - (1 / ((1 + i) ** n))) / i;
  return Number.isFinite(pv) ? pv : pmt * n;
}

export default function CharitableGiftTestDriveWidget() {
  const [annuityType, setAnnuityType] = useState('one');
  const [frequency, setFrequency] = useState('Monthly');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [age1Input, setAge1Input] = useState('70');
  const [age2Input, setAge2Input] = useState('68');
  const [valueInput, setValueInput] = useState('1,000,000');
  const [basisInput, setBasisInput] = useState('300,000');
  const [taxRate, setTaxRate] = useState('22%');
  const [rate7520Input, setRate7520Input] = useState('5.0');
  const [cgRateInput, setCgRateInput] = useState('15');
  const [minAgeInput, setMinAgeInput] = useState('55');

  const computed = useMemo(() => {
    const minAge = Number(minAgeInput) || 55;
    const age1 = Math.max(Number(age1Input) || 0, minAge);
    const age2 = Math.max(Number(age2Input) || 0, minAge);
    const value = parseNumber(valueInput);
    const basis = Math.min(parseNumber(basisInput), value);
    const gain = Math.max(0, value - basis);
    const periods = FREQUENCY_PERIODS[frequency] || 12;
    const rate7520 = (Number(rate7520Input) || 5) / 100;
    const ratePct = annuityType === 'two' ? twoLifeRate(age1, age2) : oneLifeRate(age1);
    const rate = ratePct / 100;
    const annual = value * rate;
    const per = annual / periods;

    const deductionFactor = age1 >= 80 ? 0.45 : (age1 >= 70 ? 0.35 : (age1 >= 60 ? 0.30 : 0.25));
    const deduction = value * deductionFactor;

    const years = annuityType === 'two'
      ? expectedYears(Math.min(age1, age2)) + 3
      : expectedYears(age1);
    const exclusionRatio = Math.max(0, Math.min(0.9, (basis / (value || 1)) * (years / 28)));
    const taxFreePer = per * exclusionRatio;
    const ordinaryPer = Math.max(0, per - taxFreePer);
    const pv = pvAnnuity(annual, rate7520, years, periods);
    const remainder = Math.max(0, value - pv);
    const unitWord = periods === 12 ? 'month' : periods === 4 ? 'quarter' : periods === 2 ? 'half-year' : 'year';

    const displayName1 = name1.trim();
    const displayName2 = name2.trim();
    let presentFor = 'you';
    if (annuityType === 'two' && displayName1 && displayName2) {
      presentFor = `${displayName1} & ${displayName2}`;
    } else if (displayName1) {
      presentFor = displayName1;
    }

    return {
      minAge,
      age1,
      age2,
      value,
      basis,
      gain,
      periods,
      ratePct,
      annual,
      per,
      deduction,
      years,
      exclusionRatio,
      taxFreePer,
      ordinaryPer,
      remainder,
      unitWord,
      presentFor,
      rate7520,
    };
  }, [
    annuityType,
    age1Input,
    age2Input,
    basisInput,
    frequency,
    minAgeInput,
    name1,
    name2,
    rate7520Input,
    valueInput,
  ]);

  const isTwoLife = annuityType === 'two';

  const handleCurrencyChange = (setter) => (event) => {
    setter(formatCurrencyInput(event.target.value));
  };

  const handleAgeChange = (setter) => (event) => {
    const raw = event.target.value.replace(/[^\d]/g, '');
    setter(raw);
  };

  const handlePdf = () => {
    window.alert('PDF export coming (component-only, paginated).');
  };

  const handleEmail = () => {
    const bodyLines = [
      'Gift Annuity Illustration (Demo)',
      `Created for: ${computed.presentFor}`,
      `Type/Frequency: ${isTwoLife ? 'Two Lives' : 'One Life'} • ${formatPercent(computed.ratePct)} • ${frequency}`,
      `Gift: ${formatMoney(computed.value)}`,
      `Per-period payout: ${formatMoney(computed.per)} ${computed.unitWord}`,
      `Annual payout: ${formatMoney(computed.annual)} (${formatPercent((computed.annual / (computed.value || 1)) * 100)} of gift)`,
      `Charitable deduction: ${formatMoney(computed.deduction)}`,
      `Exclusion ratio: ~${formatPercent(computed.exclusionRatio * 100)} for ~${Math.round(computed.years)} years`,
      `Basis/Gain: ${formatMoney(computed.basis)} / ${formatMoney(computed.gain)}`,
      `Tax rate selected: ${taxRate}; Capital gains rate selected: ${cgRateInput}%`,
      'Illustration only — see ACGA/§7520 tables for an official calculation.',
    ];
    const subject = encodeURIComponent('Gift Annuity Illustration (Demo)');
    const body = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:bhunt@agfinancial.org?subject=${subject}&body=${body}`;
  };

  const clampAgeOnBlur = (value, setter) => () => {
    if (!String(value || '').trim()) {
      return;
    }
    setter(String(Math.max(Number(value) || 0, computed.minAge)));
  };

  return (
    <div className="cga-test-drive-widget">
      <h4 className="cga-test-drive-title">Test drive a CGA.</h4>
      <p className="cga-test-drive-subtitle">See how your payments and ministry impact might look.</p>

      <div className="cga-test-drive-app">
        <div className="cga-test-drive-header">
          <h5>Charitable gift annuity created for <span>{computed.presentFor}</span></h5>
          <p className="cga-test-drive-header-sub">
            Annuity Type: <strong>{isTwoLife ? 'Two Lives' : 'One Life'}</strong> •{' '}
            <strong>{formatPercent(computed.ratePct)}</strong> •{' '}
            <span>{frequency}</span>
          </p>
          <div className="cga-test-drive-summary" aria-live="polite">
            <p>
              Gift of <span className="is-strong">{formatMoney(computed.value)}</span> receives approximately{' '}
              <span className="is-strong">{formatMoney(computed.per)}</span> per {computed.unitWord} (
              <span>{formatMoney(computed.annual)}</span>, about <span>{formatPercent((computed.annual / (computed.value || 1)) * 100)}</span> of your gift).
              You can claim a charitable deduction of <span className="is-ded">{formatMoney(computed.deduction)}</span>, and about{' '}
              <span>{formatPercent(computed.exclusionRatio * 100)}</span> of each payment is tax-free for about{' '}
              <span>{Math.round(computed.years)}</span> years.
            </p>
          </div>
        </div>

        <div className="cga-test-drive-grid">
          <div className="cga-test-drive-card cga-test-drive-controls">
            <h6>Adjust the example</h6>
            <div className="cga-test-drive-fields">
              <label className="cga-test-drive-field">
                <span>Annuity Type</span>
                <select value={annuityType} onChange={(event) => setAnnuityType(event.target.value)}>
                  <option value="one">One Life</option>
                  <option value="two">Two Lives</option>
                </select>
              </label>

              <label className="cga-test-drive-field">
                <span>Payment Frequency</span>
                <select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
                  <option value="Annual">Annual</option>
                  <option value="Semiannual">Semiannual</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </label>

              <div className="cga-test-drive-field cga-test-drive-field--wide">
                <span>First Person (Name &amp; Age)</span>
                <div className="cga-test-drive-inline">
                  <input
                    type="text"
                    value={name1}
                    onChange={(event) => setName1(event.target.value)}
                    placeholder="First & Last Name"
                    aria-label="First Person Name"
                  />
                  <input
                    type="number"
                    className={`cga-test-drive-age${String(age1Input || '').trim() ? '' : ' is-ghost'}`}
                    min={computed.minAge}
                    step="1"
                    value={age1Input}
                    onChange={handleAgeChange(setAge1Input)}
                    onBlur={clampAgeOnBlur(age1Input, setAge1Input)}
                    placeholder="Age"
                    aria-label="First Person Age"
                  />
                </div>
              </div>

              {isTwoLife ? (
                <div className="cga-test-drive-field cga-test-drive-field--wide">
                  <span>Second Person (Name &amp; Age)</span>
                  <div className="cga-test-drive-inline">
                    <input
                      type="text"
                      value={name2}
                      onChange={(event) => setName2(event.target.value)}
                      placeholder="First & Last Name"
                      aria-label="Second Person Name"
                    />
                    <input
                      type="number"
                      className={`cga-test-drive-age${String(age2Input || '').trim() ? '' : ' is-ghost'}`}
                      min={computed.minAge}
                      step="1"
                      value={age2Input}
                      onChange={handleAgeChange(setAge2Input)}
                      onBlur={clampAgeOnBlur(age2Input, setAge2Input)}
                      placeholder="Age"
                      aria-label="Second Person Age"
                    />
                  </div>
                </div>
              ) : null}

              <label className="cga-test-drive-field">
                <span>Property Value ($)</span>
                <input type="text" value={valueInput} onChange={handleCurrencyChange(setValueInput)} />
              </label>

              <label className="cga-test-drive-field">
                <span>Cost Basis ($)</span>
                <input type="text" value={basisInput} onChange={handleCurrencyChange(setBasisInput)} />
              </label>

              <label className="cga-test-drive-field">
                <span>Income Tax Rate</span>
                <select value={taxRate} onChange={(event) => setTaxRate(event.target.value)}>
                  <option value="10%">10%</option>
                  <option value="12%">12%</option>
                  <option value="22%">22%</option>
                  <option value="24%">24%</option>
                  <option value="32%">32%</option>
                  <option value="35%">35%</option>
                  <option value="37%">37%</option>
                </select>
              </label>

              <details className="cga-test-drive-advanced cga-test-drive-field--wide">
                <summary>Advanced ▸ (demo §7520, capital gains %, min age)</summary>
                <div className="cga-test-drive-inline cga-test-drive-inline--advanced">
                  <label className="cga-test-drive-field">
                    <span>§7520 Rate (demo)</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.2"
                      value={rate7520Input}
                      onChange={(event) => setRate7520Input(event.target.value)}
                    />
                  </label>
                  <label className="cga-test-drive-field">
                    <span>Capital Gains Rate (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="1"
                      value={cgRateInput}
                      onChange={(event) => setCgRateInput(event.target.value)}
                    />
                  </label>
                  <label className="cga-test-drive-field">
                    <span>Minimum Age</span>
                    <input
                      type="number"
                      min="50"
                      max="99"
                      step="1"
                      value={minAgeInput}
                      onChange={(event) => setMinAgeInput(event.target.value)}
                    />
                  </label>
                </div>
              </details>
            </div>

            <div className="cga-test-drive-actions">
              <button type="button" className="cga-test-drive-btn is-ghost" onClick={handlePdf}>Create PDF</button>
              <button type="button" className="cga-test-drive-btn is-ghost" onClick={handleEmail}>Email this</button>
            </div>
          </div>

          <div className="cga-test-drive-stack">
            <div className="cga-test-drive-tile">
              <h6>Your Gifted Asset: <span>{formatMoney(computed.value)}</span></h6>
              <p className="cga-test-drive-meta">
                Basis <span>{formatMoney(computed.basis)}</span> • Gain <span>{formatMoney(computed.gain)}</span>
              </p>
              <p className="cga-test-drive-micro">Capital gain treatment may be reduced when funding a CGA.</p>

              <h6 className="is-spaced">Your Ministry Impact</h6>
              <div className="cga-test-drive-kpi">{formatMoney(computed.remainder)}</div>
              <p className="cga-test-drive-micro">Remainder depends on longevity and earnings; shown illustratively.</p>
            </div>

            <div className="cga-test-drive-tile">
              <h6>Your Lifetime Payments</h6>
              <div className="cga-test-drive-kpi">{formatMoney(computed.per)} / {computed.unitWord}</div>
              <p className="cga-test-drive-meta">Annual total: <strong>{formatMoney(computed.annual)}</strong></p>
              <p className="cga-test-drive-micro">Tax-free portion: {formatMoney(computed.taxFreePer)} per {computed.unitWord}</p>
              <p className="cga-test-drive-micro">Taxable portion: {formatMoney(computed.ordinaryPer)} per {computed.unitWord}</p>
              <p className="cga-test-drive-micro">Rate based on age(s) per ACGA guidelines.</p>
            </div>
          </div>
        </div>

        <div className="cga-test-drive-fineprint">
          <p>
            Figures are illustrations for education only and may differ from a personalized ACGA/§7520-based calculation.
            For a compliant multi-page PDF, please chat with an AGFinancial representative.
          </p>
        </div>
      </div>
    </div>
  );
}
