import { useMemo, useState } from 'react';
import { useDisclosures } from '../context/DisclosuresContext';

const MONEY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

function parseNumber(value) {
  return Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0;
}

function formatMoney(value) {
  return MONEY_FORMATTER.format(Number(value) || 0);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const DEFAULT_FIELDS = {
  years: '30',
  income: '0',
  salaryIncrease: '5',
  balance: '0',
  returnRate: '8',
  frequency: '24',
  employerMatch: '100',
  maxMatch: '3',
  currentContribution: '4',
  proposedContribution: '6',
};

function runProjection(input) {
  const years = clamp(Math.round(parseNumber(input.years)), 1, 50);
  const income = Math.max(parseNumber(input.income), 0);
  const salaryIncrease = parseNumber(input.salaryIncrease) / 100;
  const startingBalance = Math.max(parseNumber(input.balance), 0);
  const returnRate = parseNumber(input.returnRate) / 100;
  const employerMatch = Math.max(parseNumber(input.employerMatch), 0) / 100;
  const maxMatch = Math.max(parseNumber(input.maxMatch), 0) / 100;
  const currentContribution = Math.max(parseNumber(input.currentContribution), 0) / 100;
  const proposedContribution = Math.max(parseNumber(input.proposedContribution), 0) / 100;

  let currentBalance = startingBalance;
  let proposedBalance = startingBalance;
  let currentSalary = income;
  const yearly = [];

  for (let y = 1; y <= years; y += 1) {
    const currentContrib = currentSalary * currentContribution;
    const proposedContrib = currentSalary * proposedContribution;

    const currentMatch = Math.min(currentContribution, maxMatch) * currentSalary * employerMatch;
    const proposedMatch = Math.min(proposedContribution, maxMatch) * currentSalary * employerMatch;

    currentBalance += currentContrib + currentMatch;
    proposedBalance += proposedContrib + proposedMatch;

    currentBalance *= (1 + returnRate);
    proposedBalance *= (1 + returnRate);

    yearly.push({
      year: y,
      salary: currentSalary,
      currentContributionAmount: currentContrib,
      proposedContributionAmount: proposedContrib,
      currentEmployerMatch: currentMatch,
      proposedEmployerMatch: proposedMatch,
      currentBalance,
      proposedBalance,
      difference: proposedBalance - currentBalance,
    });

    currentSalary *= (1 + salaryIncrease);
  }

  const finalYear = yearly[yearly.length - 1];
  return {
    years,
    inputs: {
      income,
      salaryIncrease,
      startingBalance,
      returnRate,
      employerMatch,
      maxMatch,
      currentContribution,
      proposedContribution,
    },
    yearly,
    currentFinal: finalYear?.currentBalance || 0,
    proposedFinal: finalYear?.proposedBalance || 0,
    totalDifference: finalYear?.difference || 0,
  };
}

function formatInput(field, value) {
  if (field === 'frequency') return String(value);
  const parsed = parseNumber(value);
  if (!parsed) return '';
  if (field === 'years') return String(clamp(Math.round(parsed), 1, 50));
  return String(parsed);
}

function MiniComparisonBars({ yearly }) {
  const maxValue = Math.max(...yearly.map((row) => Math.max(row.currentBalance, row.proposedBalance)), 1);
  const sampleRows = yearly.length <= 12
    ? yearly
    : yearly.filter((row, index) => {
      if (index === 0 || index === yearly.length - 1) return true;
      const step = Math.max(Math.floor(yearly.length / 10), 1);
      return (index + 1) % step === 0;
    });

  return (
    <div className="increased-contribution-mini-chart" role="img" aria-label="Yearly retirement balance comparison">
      <div className="increased-contribution-mini-legend">
        <span><i className="is-current" /> Current contribution</span>
        <span><i className="is-proposed" /> Proposed contribution</span>
      </div>
      <div className="increased-contribution-mini-rows">
        {sampleRows.map((row) => (
          <div key={`year-${row.year}`} className="increased-contribution-mini-row">
            <div className="increased-contribution-mini-year">Year {row.year}</div>
            <div className="increased-contribution-mini-track">
              <div
                className="increased-contribution-mini-fill is-current"
                style={{ width: `${(row.currentBalance / maxValue) * 100}%` }}
              />
              <div
                className="increased-contribution-mini-fill is-proposed"
                style={{ width: `${(row.proposedBalance / maxValue) * 100}%` }}
              />
            </div>
            <div className="increased-contribution-mini-values">
              <strong>{formatMoney(row.proposedBalance)}</strong>
              <span>{formatMoney(row.currentBalance)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IncreasedContributionCalculatorWidget() {
  const { getDisclosureValue } = useDisclosures();
  const disclosure = getDisclosureValue(
    'calculator-increased-contribution-disclosure',
    'Educational estimate only. This projection is based on your assumptions and simplified annual compounding; results do not guarantee future performance.',
  );
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [hasCalculated, setHasCalculated] = useState(false);

  const projection = useMemo(() => runProjection(fields), [fields]);

  const finalRow = projection.yearly[projection.yearly.length - 1];
  const contributionIncreasePct = Math.max(
    projection.inputs.proposedContribution - projection.inputs.currentContribution,
    0,
  ) * 100;

  const handleFieldChange = (field) => (event) => {
    setFields((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFieldBlur = (field) => () => {
    setFields((prev) => ({ ...prev, [field]: formatInput(field, prev[field]) }));
  };

  return (
    <div className="native-financial-tool increased-contribution-tool">
      <p className="native-financial-tool-lead">
        See how increasing your contribution changes your retirement balance year by year.
      </p>

      <div className="financial-tool-groups-grid increased-contribution-input-grid">
        <section className="financial-tool-group">
          <h3>Common Assumptions</h3>
          <div className="financial-tool-input-list">
            <label className="financial-tool-input-row">
              <span>Years until retirement (1-50)</span>
              <input type="number" min="1" max="50" value={fields.years} onChange={handleFieldChange('years')} onBlur={handleFieldBlur('years')} />
            </label>
            <label className="financial-tool-input-row">
              <span>Current annual income ($)</span>
              <input type="number" min="0" value={fields.income} onChange={handleFieldChange('income')} onBlur={handleFieldBlur('income')} />
            </label>
            <label className="financial-tool-input-row">
              <span>Annual salary increases (%)</span>
              <input type="number" min="0" max="10" step="0.1" value={fields.salaryIncrease} onChange={handleFieldChange('salaryIncrease')} onBlur={handleFieldBlur('salaryIncrease')} />
            </label>
          </div>
        </section>

        <section className="financial-tool-group">
          <h3>Plan Information</h3>
          <div className="financial-tool-input-list">
            <label className="financial-tool-input-row">
              <span>Current 403(b) balance ($)</span>
              <input type="number" min="0" value={fields.balance} onChange={handleFieldChange('balance')} onBlur={handleFieldBlur('balance')} />
            </label>
            <label className="financial-tool-input-row">
              <span>Annual before-tax return on savings (%)</span>
              <input type="number" min="-12" max="12" step="0.1" value={fields.returnRate} onChange={handleFieldChange('returnRate')} onBlur={handleFieldBlur('returnRate')} />
            </label>
            <label className="financial-tool-input-row">
              <span>Pay period frequency</span>
              <select value={fields.frequency} onChange={handleFieldChange('frequency')}>
                <option value="12">Monthly</option>
                <option value="24">Bi-Weekly</option>
                <option value="26">Every 2 Weeks</option>
                <option value="52">Weekly</option>
              </select>
            </label>
            <label className="financial-tool-input-row">
              <span>Employer match (%)</span>
              <input type="number" min="0" max="300" step="1" value={fields.employerMatch} onChange={handleFieldChange('employerMatch')} onBlur={handleFieldBlur('employerMatch')} />
            </label>
            <label className="financial-tool-input-row">
              <span>Maximum employer match (%)</span>
              <input type="number" min="0" max="20" step="0.1" value={fields.maxMatch} onChange={handleFieldChange('maxMatch')} onBlur={handleFieldBlur('maxMatch')} />
            </label>
          </div>
        </section>

        <section className="financial-tool-group increased-contribution-full">
          <h3>Contribution Information</h3>
          <div className="financial-tool-input-list increased-contribution-contrib-grid">
            <label className="financial-tool-input-row">
              <span>Current 403(b) contribution (%)</span>
              <input type="number" min="0" max="100" step="0.1" value={fields.currentContribution} onChange={handleFieldChange('currentContribution')} onBlur={handleFieldBlur('currentContribution')} />
            </label>
            <label className="financial-tool-input-row">
              <span>Proposed 403(b) contribution (%)</span>
              <input type="number" min="0" max="100" step="0.1" value={fields.proposedContribution} onChange={handleFieldChange('proposedContribution')} onBlur={handleFieldBlur('proposedContribution')} />
            </label>
          </div>
        </section>
      </div>

      <div className="financial-tool-actions">
        <button type="button" className="service-native-btn" onClick={() => setHasCalculated(true)}>
          Calculate Impact
        </button>
      </div>

      {hasCalculated ? (
        <div className="financial-tool-results">
          <p className="financial-tool-result-text">
            Increasing contributions from {PERCENT_FORMATTER.format(projection.inputs.currentContribution * 100)}% to {PERCENT_FORMATTER.format(projection.inputs.proposedContribution * 100)}% could add {formatMoney(projection.totalDifference)} by retirement.
          </p>

          <div className="financial-tool-metrics">
            <div className="financial-tool-metric">
              <div className="financial-tool-metric-label">Projected balance (current rate)</div>
              <div className="financial-tool-metric-value">{formatMoney(projection.currentFinal)}</div>
            </div>
            <div className="financial-tool-metric is-good">
              <div className="financial-tool-metric-label">Projected balance (proposed rate)</div>
              <div className="financial-tool-metric-value">{formatMoney(projection.proposedFinal)}</div>
            </div>
            <div className="financial-tool-metric is-warn">
              <div className="financial-tool-metric-label">Difference at retirement</div>
              <div className="financial-tool-metric-value">{formatMoney(projection.totalDifference)}</div>
              <div className="financial-tool-metric-sub">
                +{PERCENT_FORMATTER.format(contributionIncreasePct)} percentage points contribution rate
              </div>
            </div>
          </div>

          <MiniComparisonBars yearly={projection.yearly} />

          {finalRow ? (
            <div className="financial-tool-plan">
              <h4>Final Year Snapshot</h4>
              <div className="financial-tool-plan-grid">
                <div>
                  <span>Estimated salary in final year</span>
                  <strong>{formatMoney(finalRow.salary)}</strong>
                </div>
                <div>
                  <span>Current annual employee contribution</span>
                  <strong>{formatMoney(finalRow.currentContributionAmount)}</strong>
                </div>
                <div>
                  <span>Proposed annual employee contribution</span>
                  <strong>{formatMoney(finalRow.proposedContributionAmount)}</strong>
                </div>
                <div>
                  <span>Current employer match</span>
                  <strong>{formatMoney(finalRow.currentEmployerMatch)}</strong>
                </div>
                <div>
                  <span>Proposed employer match</span>
                  <strong>{formatMoney(finalRow.proposedEmployerMatch)}</strong>
                </div>
                <div>
                  <span>Additional projected balance</span>
                  <strong>{formatMoney(finalRow.difference)}</strong>
                </div>
              </div>
            </div>
          ) : null}

          <div className="financial-tool-table-wrap">
            <table className="financial-tool-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Current Balance</th>
                  <th>Proposed Balance</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {projection.yearly.map((row) => (
                  <tr key={`ic-${row.year}`}>
                    <td>{row.year}</td>
                    <td>{formatMoney(row.currentBalance)}</td>
                    <td>{formatMoney(row.proposedBalance)}</td>
                    <td>{formatMoney(row.difference)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <p className="financial-tool-fineprint">
        {disclosure}
      </p>
    </div>
  );
}
