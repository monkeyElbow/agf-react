import { useMemo, useState } from 'react';

const MONEY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

const ASSUMPTION_FIELDS = [
  ['income', 'Current gross monthly income ($)', '0'],
  ['currentFunds', 'Current emergency funds available ($)', '5,000'],
  ['months', 'Number of months for funds to last', '6'],
  ['annualReturn', 'Before-tax return on savings (%)', '8'],
  ['taxRate', 'Marginal tax bracket (%)', '22'],
  ['accumMonths', 'Number of months to accumulate funds', '36'],
];

const EXPENSE_FIELDS = [
  ['mortgage', 'Mortgage or Rent ($)'],
  ['vacation', 'Vacation Home ($)'],
  ['autoLoan', 'Auto Loans ($)'],
  ['personalLoan', 'Personal Loans ($)'],
  ['charge', 'Credit/Charge Accounts ($)'],
  ['fedTax', 'Federal Income Taxes ($)'],
  ['stateTax', 'State Income Taxes ($)'],
  ['fica', 'FICA ($)'],
  ['realEstateTax', 'Real Estate Taxes ($)'],
  ['otherTax', 'Other Taxes ($)'],
  ['utilities', 'Utilities ($)'],
  ['repairs', 'Household Repairs ($)'],
  ['food', 'Food ($)'],
  ['clothing', 'Clothing & Laundry ($)'],
  ['education', 'Education ($)'],
  ['childcare', 'Child Care ($)'],
  ['autoExpense', 'Auto Expenses ($)'],
  ['transport', 'Other Transport ($)'],
  ['lifeInsurance', 'Life Insurance ($)'],
  ['homeInsurance', 'Homeowners/Renters Insurance ($)'],
  ['autoInsurance', 'Auto Insurance ($)'],
  ['medical', 'Medical/Dental/Disability ($)'],
  ['entertainment', 'Entertainment & Dining ($)'],
  ['travel', 'Recreation & Travel ($)'],
  ['club', 'Club Dues ($)'],
  ['hobbies', 'Hobbies ($)'],
  ['gifts', 'Gifts ($)'],
  ['homeImprove', 'Home Improvements ($)'],
  ['services', 'Professional Services ($)'],
  ['charity', 'Charitable Contributions ($)'],
  ['other', 'Miscellaneous ($)'],
];

function parseAmount(value) {
  return Number(String(value || '').replace(/[^\d.-]/g, '')) || 0;
}

function formatAmountInput(value) {
  const parsed = parseAmount(value);
  return parsed ? NUMBER_FORMATTER.format(parsed) : '';
}

function parsePercent(value) {
  return Number(String(value || '').replace(/[^\d.-]/g, '')) || 0;
}

function formatPercentInput(value) {
  const parsed = parsePercent(value);
  return Number.isFinite(parsed) && parsed !== 0 ? String(parsed) : '';
}

function formatMoney(value) {
  return MONEY_FORMATTER.format(Number(value) || 0);
}

function futureValueOfSavings(current, monthlyContribution, monthlyRate, months) {
  if (months <= 0) return current;
  if (!monthlyRate) return current + (monthlyContribution * months);
  const growthFactor = (1 + monthlyRate) ** months;
  return (current * growthFactor) + (monthlyContribution * ((growthFactor - 1) / monthlyRate));
}

function solveMonthlyContribution(target, current, monthlyRate, months) {
  if (target <= 0) return 0;
  if (months <= 0) return target;
  if (!monthlyRate) {
    return Math.max((target - current) / months, 0);
  }

  const growthFactor = (1 + monthlyRate) ** months;
  const futureCurrent = current * growthFactor;
  const remaining = Math.max(target - futureCurrent, 0);
  if (remaining <= 0) return 0;
  return remaining * (monthlyRate / (growthFactor - 1));
}

function EmergencyInputRow({ label, value, onChange, onBlur, type = 'amount' }) {
  return (
    <label className="financial-tool-input-row">
      <span>{label}</span>
      <input
        type="text"
        inputMode={type === 'amount' ? 'decimal' : 'numeric'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="0"
      />
    </label>
  );
}

export default function EmergencyFundCalculatorWidget() {
  const [assumptions, setAssumptions] = useState({
    income: '0',
    currentFunds: '5,000',
    months: '6',
    annualReturn: '8',
    taxRate: '22',
    accumMonths: '36',
  });
  const [totalExpensesInput, setTotalExpensesInput] = useState('2,500');
  const [expenseItems, setExpenseItems] = useState(() => Object.fromEntries(EXPENSE_FIELDS.map(([id]) => [id, ''])));

  const assumptionValues = useMemo(() => ({
    income: parseAmount(assumptions.income),
    currentFunds: parseAmount(assumptions.currentFunds),
    months: parseAmount(assumptions.months),
    annualReturn: parsePercent(assumptions.annualReturn),
    taxRate: parsePercent(assumptions.taxRate),
    accumMonths: parseAmount(assumptions.accumMonths),
  }), [assumptions]);

  const itemizedExpensesTotal = useMemo(
    () => EXPENSE_FIELDS.reduce((sum, [id]) => sum + parseAmount(expenseItems[id]), 0),
    [expenseItems],
  );
  const enteredTotalExpenses = parseAmount(totalExpensesInput);
  const usingItemized = enteredTotalExpenses === 0 && itemizedExpensesTotal > 0;
  const monthlyExpenses = enteredTotalExpenses > 0 ? enteredTotalExpenses : itemizedExpensesTotal;

  const requiredFund = monthlyExpenses * Math.max(assumptionValues.months, 0);
  const shortfall = Math.max(requiredFund - assumptionValues.currentFunds, 0);
  const surplus = Math.max(assumptionValues.currentFunds - requiredFund, 0);
  const afterTaxAnnualRate = Math.max(assumptionValues.annualReturn * (1 - (assumptionValues.taxRate / 100)), 0);
  const monthlyRate = afterTaxAnnualRate / 100 / 12;
  const monthlySavingsNeeded = solveMonthlyContribution(
    requiredFund,
    assumptionValues.currentFunds,
    monthlyRate,
    Math.max(assumptionValues.accumMonths, 0),
  );
  const projectedFundAtTargetDate = futureValueOfSavings(
    assumptionValues.currentFunds,
    monthlySavingsNeeded,
    monthlyRate,
    Math.max(assumptionValues.accumMonths, 0),
  );
  const savingsAsPctIncome = assumptionValues.income > 0 ? (monthlySavingsNeeded / assumptionValues.income) * 100 : 0;
  const currentFundsPct = requiredFund > 0 ? Math.min((assumptionValues.currentFunds / requiredFund) * 100, 100) : 0;
  const shortfallPct = requiredFund > 0 ? Math.min((shortfall / requiredFund) * 100, 100) : 0;

  const updateAssumption = (fieldId, type = 'amount') => (event) => {
    const next = event.target.value;
    setAssumptions((prev) => ({ ...prev, [fieldId]: next }));
  };

  const formatAssumptionOnBlur = (fieldId, type = 'amount') => () => {
    setAssumptions((prev) => ({
      ...prev,
      [fieldId]: type === 'percent' || fieldId === 'months' || fieldId === 'accumMonths'
        ? formatPercentInput(prev[fieldId])
        : formatAmountInput(prev[fieldId]),
    }));
  };

  const updateExpense = (fieldId) => (event) => {
    setExpenseItems((prev) => ({ ...prev, [fieldId]: event.target.value }));
  };

  const formatExpenseOnBlur = (fieldId) => () => {
    setExpenseItems((prev) => ({ ...prev, [fieldId]: formatAmountInput(prev[fieldId]) }));
  };

  return (
    <div className="native-financial-tool emergency-fund-tool">
      <p className="native-financial-tool-lead">
        Estimate an emergency fund target based on your monthly expenses, then see how much more you may need to save and a simple accumulation plan.
      </p>

      <div className="financial-tool-section">
        <h3>Assumptions</h3>
        <div className="financial-tool-input-list">
          {ASSUMPTION_FIELDS.map(([fieldId, label]) => {
            const type = ['annualReturn', 'taxRate', 'months', 'accumMonths'].includes(fieldId) ? 'percent' : 'amount';
            return (
              <EmergencyInputRow
                key={fieldId}
                label={label}
                value={assumptions[fieldId]}
                onChange={updateAssumption(fieldId, type)}
                onBlur={formatAssumptionOnBlur(fieldId, type)}
                type={type === 'percent' ? 'percent' : 'amount'}
              />
            );
          })}
        </div>
      </div>

      <div className="financial-tool-section">
        <h3>Expenses</h3>
        <p className="financial-tool-note">
          Enter a monthly total or leave total at 0 and itemize below.
        </p>
        <div className="financial-tool-input-list">
          <EmergencyInputRow
            label="Total monthly living expenses ($)"
            value={totalExpensesInput}
            onChange={(event) => setTotalExpensesInput(event.target.value)}
            onBlur={() => setTotalExpensesInput((prev) => formatAmountInput(prev))}
          />
        </div>
        <div className="financial-tool-itemized-grid">
          {EXPENSE_FIELDS.map(([fieldId, label]) => (
            <EmergencyInputRow
              key={fieldId}
              label={label}
              value={expenseItems[fieldId]}
              onChange={updateExpense(fieldId)}
              onBlur={formatExpenseOnBlur(fieldId)}
            />
          ))}
        </div>
      </div>

      <div className="financial-tool-results">
        <div className="financial-tool-metrics">
          <div className="financial-tool-metric">
            <div className="financial-tool-metric-label">Monthly Expenses Used</div>
            <div className="financial-tool-metric-value">{formatMoney(monthlyExpenses)}</div>
            <div className="financial-tool-metric-sub">{usingItemized ? 'From itemized expenses' : 'From total monthly expenses'}</div>
          </div>
          <div className="financial-tool-metric">
            <div className="financial-tool-metric-label">Emergency Fund Goal</div>
            <div className="financial-tool-metric-value">{formatMoney(requiredFund)}</div>
            <div className="financial-tool-metric-sub">{NUMBER_FORMATTER.format(Math.max(assumptionValues.months, 0))} months coverage</div>
          </div>
          <div className={`financial-tool-metric ${shortfall > 0 ? 'is-warn' : 'is-good'}`}>
            <div className="financial-tool-metric-label">{shortfall > 0 ? 'Still Needed' : 'Currently Funded Above Goal'}</div>
            <div className="financial-tool-metric-value">{formatMoney(shortfall > 0 ? shortfall : surplus)}</div>
            <div className="financial-tool-metric-sub">Current funds: {formatMoney(assumptionValues.currentFunds)}</div>
          </div>
        </div>

        <p className="financial-tool-result-text">
          {shortfall > 0
            ? `You need ${formatMoney(requiredFund)} to cover ${NUMBER_FORMATTER.format(Math.max(assumptionValues.months, 0))} months. You still need ${formatMoney(shortfall)} after current savings.`
            : `Your current emergency savings of ${formatMoney(assumptionValues.currentFunds)} covers the ${formatMoney(requiredFund)} target.`}
        </p>

        <div className="financial-tool-stacked-bar" aria-label="Emergency fund goal progress">
          <div className="financial-tool-stacked-bar-track">
            <div
              className="financial-tool-stacked-bar-segment is-current"
              style={{ width: `${currentFundsPct}%` }}
              title={`Current funds: ${formatMoney(assumptionValues.currentFunds)}`}
            />
            {shortfall > 0 ? (
              <div
                className="financial-tool-stacked-bar-segment is-gap"
                style={{ width: `${shortfallPct}%` }}
                title={`Still needed: ${formatMoney(shortfall)}`}
              />
            ) : null}
          </div>
          <div className="financial-tool-stacked-legend">
            <span><i className="is-current" /> Current Funds ({formatMoney(assumptionValues.currentFunds)})</span>
            <span><i className="is-gap" /> Still Needed ({formatMoney(shortfall)})</span>
          </div>
        </div>

        <div className="financial-tool-plan">
          <h4>Accumulation Plan (Estimate)</h4>
          <div className="financial-tool-plan-grid">
            <div>
              <span>After-tax savings rate (annual)</span>
              <strong>{afterTaxAnnualRate.toFixed(2)}%</strong>
            </div>
            <div>
              <span>Months to accumulate</span>
              <strong>{NUMBER_FORMATTER.format(Math.max(assumptionValues.accumMonths, 0))}</strong>
            </div>
            <div>
              <span>Estimated monthly savings needed</span>
              <strong>{formatMoney(monthlySavingsNeeded)}</strong>
            </div>
            <div>
              <span>As % of gross monthly income</span>
              <strong>{assumptionValues.income > 0 ? `${savingsAsPctIncome.toFixed(1)}%` : '—'}</strong>
            </div>
            <div>
              <span>Projected fund at target date</span>
              <strong>{formatMoney(projectedFundAtTargetDate)}</strong>
            </div>
            <div>
              <span>Itemized expense total</span>
              <strong>{formatMoney(itemizedExpensesTotal)}</strong>
            </div>
          </div>
        </div>
      </div>

      <p className="financial-tool-fineprint">
        Estimates are for illustration only and do not include inflation or all possible tax outcomes. Review with your financial and tax advisors.
      </p>
    </div>
  );
}
