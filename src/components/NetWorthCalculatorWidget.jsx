import { useMemo, useState } from 'react';
import { useDisclosures } from '../context/DisclosuresContext';

const MONEY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

const NET_WORTH_ASSET_GROUPS = [
  {
    key: 'tangible',
    title: 'Tangible Assets',
    summaryLabel: 'Tangible Assets',
    fields: [
      ['residence', 'Residence'],
      ['vacationHome', 'Vacation Home'],
      ['furnishings', 'Furnishings'],
      ['automobiles', 'Automobiles'],
      ['rentalRealEstate', 'Rental Real Estate'],
      ['valuables', 'Art, Jewelry, and Other Valuables'],
    ],
  },
  {
    key: 'equity',
    title: 'Equity Assets',
    summaryLabel: 'Equity Assets',
    fields: [
      ['stocks', 'Stocks'],
      ['variableAnnuities', 'Variable Annuities'],
      ['limitedPartnerships', 'Limited Partnerships'],
      ['businessInterests', 'Business Interests'],
    ],
  },
  {
    key: 'fixedPrincipal',
    title: 'Fixed-Principal Assets',
    summaryLabel: 'Fixed-Principal Assets',
    fields: [
      ['fixedDollarAnnuities', 'Fixed-Dollar Annuities'],
      ['trustDeeds', 'Trust Deeds'],
      ['otherFixedPrincipal', 'Other Fixed-Principal Assets'],
    ],
  },
  {
    key: 'fixedRate',
    title: 'Fixed-Rate Assets',
    summaryLabel: 'Fixed-Rate Assets',
    fields: [
      ['usGovBonds', 'U.S. Government Bonds'],
      ['municipalBonds', 'Municipal Bonds'],
      ['corporateBonds', 'Corporate Bonds'],
      ['faceAmountCertificates', 'Face-Amount Certificates'],
      ['debtMutualFunds', 'Debt Mutual Funds'],
    ],
  },
  {
    key: 'cash',
    title: 'Cash and Cash Equivalents',
    summaryLabel: 'Cash and Cash Equivalents',
    fields: [
      ['checking', 'Checking Accounts'],
      ['savings', 'Savings Accounts'],
      ['moneyMarket', 'Money Market Funds'],
      ['certificatesDeposit', 'Certificates of Deposit'],
      ['otherCash', 'Other Cash Reserve Accounts'],
    ],
  },
];

const NET_WORTH_LIABILITY_GROUP = {
  key: 'liabilities',
  title: 'Liabilities',
  summaryLabel: 'Liabilities',
  fields: [
    ['homeMortgage', 'Home Mortgage'],
    ['otherMortgage', 'Other Mortgage'],
    ['autoLoans', 'Automobile Loans'],
    ['bankLoans', 'Bank Loans'],
    ['personalLoans', 'Personal Loans'],
    ['chargeDebt', 'Charge Account Debt'],
    ['otherDebts', 'Other Debts'],
  ],
};

function parseAmount(value) {
  return Number(String(value || '').replace(/[^\d.-]/g, '')) || 0;
}

function formatInputAmount(value) {
  const parsed = parseAmount(value);
  return parsed ? NUMBER_FORMATTER.format(parsed) : '';
}

function formatMoney(value) {
  return MONEY_FORMATTER.format(Number(value) || 0);
}

function buildInitialValues() {
  const entries = [];
  NET_WORTH_ASSET_GROUPS.forEach((group) => {
    group.fields.forEach(([id]) => entries.push([id, '']));
  });
  NET_WORTH_LIABILITY_GROUP.fields.forEach(([id]) => entries.push([id, '']));
  return Object.fromEntries(entries);
}

function FinancialInputRow({ label, value, onChange, onBlur }) {
  return (
    <label className="financial-tool-input-row">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="0"
      />
    </label>
  );
}

export default function NetWorthCalculatorWidget() {
  const { getDisclosureValue } = useDisclosures();
  const disclosure = getDisclosureValue(
    'calculator-net-worth-disclosure',
    'Illustration only. Estimates depend on the values entered and should not be used as financial, legal, or tax advice.',
  );
  const [values, setValues] = useState(() => buildInitialValues());
  const [didCalculate, setDidCalculate] = useState(false);

  const handleChange = (fieldId) => (event) => {
    setValues((prev) => ({ ...prev, [fieldId]: event.target.value }));
  };

  const handleBlur = (fieldId) => () => {
    setValues((prev) => ({ ...prev, [fieldId]: formatInputAmount(prev[fieldId]) }));
  };

  const assetGroups = useMemo(
    () => NET_WORTH_ASSET_GROUPS.map((group) => {
      const total = group.fields.reduce((sum, [id]) => sum + parseAmount(values[id]), 0);
      return { ...group, total };
    }),
    [values],
  );

  const liabilitiesTotal = useMemo(
    () => NET_WORTH_LIABILITY_GROUP.fields.reduce((sum, [id]) => sum + parseAmount(values[id]), 0),
    [values],
  );

  const totalAssets = assetGroups.reduce((sum, group) => sum + group.total, 0);
  const netWorth = totalAssets - liabilitiesTotal;
  const maxMetric = Math.max(totalAssets, liabilitiesTotal, Math.abs(netWorth), 1);

  const summaryRows = [
    ...assetGroups.map((group) => ({
      label: group.summaryLabel,
      amount: group.total,
      percent: totalAssets ? (group.total / totalAssets) * 100 : 0,
      isLiability: false,
    })),
    {
      label: NET_WORTH_LIABILITY_GROUP.summaryLabel,
      amount: liabilitiesTotal,
      percent: liabilitiesTotal ? 100 : 0,
      isLiability: true,
    },
  ];

  return (
    <div className="native-financial-tool net-worth-tool">
      <p className="native-financial-tool-lead">
        Add your assets and liabilities to estimate your current net worth and review where your balance sheet is concentrated.
      </p>

      <div className="financial-tool-groups-grid">
        {NET_WORTH_ASSET_GROUPS.map((group) => (
          <section key={group.key} className="financial-tool-group">
            <h3>{group.title}</h3>
            <div className="financial-tool-input-list">
              {group.fields.map(([fieldId, label]) => (
                <FinancialInputRow
                  key={fieldId}
                  label={label}
                  value={values[fieldId]}
                  onChange={handleChange(fieldId)}
                  onBlur={handleBlur(fieldId)}
                />
              ))}
            </div>
          </section>
        ))}

        <section className="financial-tool-group is-liability">
          <h3>{NET_WORTH_LIABILITY_GROUP.title}</h3>
          <div className="financial-tool-input-list">
            {NET_WORTH_LIABILITY_GROUP.fields.map(([fieldId, label]) => (
              <FinancialInputRow
                key={fieldId}
                label={label}
                value={values[fieldId]}
                onChange={handleChange(fieldId)}
                onBlur={handleBlur(fieldId)}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="financial-tool-actions">
        <button type="button" className="service-native-btn" onClick={() => setDidCalculate(true)}>
          Calculate Net Worth
        </button>
        <button
          type="button"
          className="service-native-btn is-ghost"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.print();
            }
          }}
        >
          Print / Save PDF
        </button>
      </div>

      {didCalculate ? (
        <div className="financial-tool-results">
          <div className="financial-tool-metrics">
            <div className="financial-tool-metric">
              <div className="financial-tool-metric-label">Total Assets</div>
              <div className="financial-tool-metric-value">{formatMoney(totalAssets)}</div>
            </div>
            <div className="financial-tool-metric is-warn">
              <div className="financial-tool-metric-label">Total Liabilities</div>
              <div className="financial-tool-metric-value">{formatMoney(liabilitiesTotal)}</div>
            </div>
            <div className={`financial-tool-metric ${netWorth >= 0 ? 'is-good' : 'is-bad'}`}>
              <div className="financial-tool-metric-label">Estimated Net Worth</div>
              <div className="financial-tool-metric-value">{formatMoney(netWorth)}</div>
            </div>
          </div>

          <div className="financial-tool-bars" aria-label="Balance summary">
            {[
              { label: 'Assets', value: totalAssets, className: 'is-assets' },
              { label: 'Liabilities', value: liabilitiesTotal, className: 'is-liabilities' },
              { label: 'Net Worth', value: Math.abs(netWorth), className: netWorth >= 0 ? 'is-net' : 'is-net-negative', sign: netWorth < 0 ? '-' : '' },
            ].map((item) => (
              <div key={item.label} className="financial-tool-bar-row">
                <div className="financial-tool-bar-label">{item.label}</div>
                <div className="financial-tool-bar-track">
                  <div
                    className={`financial-tool-bar-fill ${item.className}`}
                    style={{ width: `${(Math.abs(item.value) / maxMetric) * 100}%` }}
                  />
                </div>
                <div className="financial-tool-bar-value">
                  {item.sign || ''}
                  {formatMoney(Math.abs(item.value))}
                </div>
              </div>
            ))}
          </div>

          <div className="financial-tool-table-wrap">
            <table className="financial-tool-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{formatMoney(row.amount)}</td>
                    <td>{row.isLiability ? (liabilitiesTotal ? '100.0%' : '0.0%') : `${row.percent.toFixed(1)}%`}</td>
                  </tr>
                ))}
                <tr className="is-total">
                  <td>Net Worth</td>
                  <td>{formatMoney(netWorth)}</td>
                  <td />
                </tr>
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
