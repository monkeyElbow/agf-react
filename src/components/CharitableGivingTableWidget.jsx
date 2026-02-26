const CG_HEADERS = [
  'Type of Giving',
  "How it's Funded",
  'Minimum Required',
  'Donor Benefits',
  'Ministry Benefits',
  'Potential Tax Benefits',
];

const CG_ROWS = [
  [
    'Donor Advised Fund',
    'Cash, stocks, bonds or property',
    '$10K cash or securities, $100K real estate',
    'Tax benefit',
    'Flexible grant support over time',
    'Full income tax deduction, savings on capital gains tax',
  ],
  [
    'Endowment',
    'Cash, stocks, bonds or property',
    '$10K cash or securities, $100K real estate',
    'Tax benefit',
    'Long-term ministry support',
    'Full income tax deduction, savings on capital gains tax',
  ],
  [
    'Charitable Gift Annuity',
    'Cash, stocks or bonds',
    '$10K',
    'Annuity payments for life',
    'After beneficiary death, actuarial value of annuity to ministry',
    'Partial income tax deduction, partial tax-free payment',
  ],
  [
    'Charitable Remainder Trust',
    'Cash or appreciated property, stocks or bonds',
    '$50K cash or securities, $100K real estate',
    'Unitrust payment to donor or others',
    'After death of donor or trust termination',
    'Partial income tax deduction, savings on capital gains tax',
  ],
  [
    'Deferred Charitable Gift Annuity',
    'Cash, stocks or bonds',
    '$10K',
    'Annuity payments for life',
    'After beneficiary death, actuarial value of annuity to ministry',
    'Partial income tax deduction, partial tax-free payment',
  ],
  [
    'Charitable Remainder Annuity Trust',
    'Cash or appreciated stocks or bonds',
    '$50K cash or securities',
    'Annuity fixed payment to donor or others',
    'After death of donor',
    'Partial income tax deduction, minimal savings on capital gains tax',
  ],
  [
    'Charitable Lead Trust',
    'Cash, property, or income-producing securities',
    '$50K cash or securities, $100K real estate',
    'After # of years, 100% of principal returned to donor or others',
    'Immediate, annuity or unitrust payment for stated term',
    'Partial income tax deduction, savings on capital gains tax',
  ],
];

export default function CharitableGivingTableWidget() {
  return (
    <div className="cga-charitable-giving-table-widget">
      <div className="native-info-table-wrap">
        <table className="ag-table has-fixed-layout">
          <thead>
            <tr>
              {CG_HEADERS.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CG_ROWS.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={`${row[0]}-${cell}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
