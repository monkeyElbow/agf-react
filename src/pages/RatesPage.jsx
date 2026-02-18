import { useRef } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { useRates } from '../context/RatesContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';

export default function RatesPage() {
  const { rates, iraRates, ratesMeta } = useRates();
  const pageRef = useRef(null);
  useNativeEnhancements(pageRef);

  return (
    <div ref={pageRef} className="rates-page">
      <PageShell title="AGFinancial Investment Certificates Rates" source={pageByPath['/rates'].source}>
        <p className="rates-page-intro">
          Competitive rates plus commitment to our core faith values.
        </p>
        <div className="table-scroll fade-up">
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

        <div className="rates-disclaimer fade-up">
          <p>
            *Annual Percentage Yield
            <br />
            **Premium rates may be available for investments of $250,000 or greater.
            <br />
            Effective {ratesMeta?.certificatesEffectiveDate || 'January 1, 2026'}.
          </p>
          <p>
            Demand certificates are investments that do not represent cash and are payable within 30 days after
            demand by the investor. Penalties may apply to redemptions prior to maturity.
          </p>
          <p>
            This is not an offer to sell securities. The offering is made only by the Offering Circular, which
            includes risk factors.
          </p>
          <p>Not FDIC or SIPC insured. Not a bank deposit. No AGFinancial guarantee.</p>
        </div>

        <h2 style={{ marginTop: '2rem' }}>IRA Investment Rates</h2>
        <div className="table-scroll fade-up">
          <table className="ag-table has-fixed-layout">
            <thead>
              <tr>
                <th>Investment Type</th>
                <th>Rate</th>
                <th>APY*</th>
              </tr>
            </thead>
            <tbody>
              {iraRates.map((row) => (
                <tr key={row.id}>
                  <td>{row.product}</td>
                  <td>{row.rate}</td>
                  <td>{row.apy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rates-disclaimer fade-up">
          <p>
            *Annual Percentage Yield
            <br />
            Effective {ratesMeta?.iraEffectiveDate || 'January 1, 2026'}.
          </p>
          <p>
            Demand certificates are investments that do not represent cash and are payable within 30 days after
            demand by the investor. Penalties may apply to redemptions prior to maturity.
          </p>
          <p>
            This is not an offer to sell securities. The offering is made only by the Offering Circular, which
            includes risk factors.
          </p>
          <p>Not FDIC or SIPC insured. Not a bank deposit. No AGFinancial guarantee.</p>
        </div>
      </PageShell>
    </div>
  );
}
