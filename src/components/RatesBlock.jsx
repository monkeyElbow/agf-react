import CertificateRatesSheet from './CertificateRatesSheet';
import InfoTableSheet from './InfoTableSheet';
import IraRatesSheet from './IraRatesSheet';

function resolve403bRows(rates, ratesMeta) {
  const proxyRateRow = Array.isArray(rates)
    ? (rates.find((row) => row?.id === '1-year') || rates.find((row) => row?.product === '1-YEAR') || rates[0])
    : null;
  const rate = ratesMeta?.retirement403bMbaRate || proxyRateRow?.premiumRate || proxyRateRow?.standardRate || '4.000%';
  const apy = ratesMeta?.retirement403bMbaApy || proxyRateRow?.premiumApy || proxyRateRow?.standardApy || '4.07%';
  return [['MBA Income Fund', rate, apy]];
}

export function RatesBlockPreview({ runtime, rates = [], iraRates = [], ratesMeta = {} }) {
  const dataset = String(runtime?.dataset || '').trim().toLowerCase();
  const rows = dataset === '403b'
    ? resolve403bRows(rates, ratesMeta)
    : dataset === 'ira'
      ? (Array.isArray(iraRates) ? iraRates.slice(0, 1).map((row) => [row?.product || 'IRA investment', row?.rate || '—', row?.apy || '—']) : [])
      : (Array.isArray(rates) ? rates.slice(0, 1).map((row) => [row?.product || 'Certificate', row?.standardRate || '—', row?.standardApy || '—']) : []);

  return (
    <div
      className="admin-rates-editor-preview"
      data-rates-preview-dataset={dataset || undefined}
      data-rates-preview-panel-id={runtime?.panelId || undefined}
    >
      <span className="admin-rates-editor-preview__eyebrow">Preview</span>
      <strong>{runtime?.displayName || 'Rates'}</strong>
      <span>{rows[0]?.[0] || 'Dataset selected'}</span>
      <span>{rows[0]?.[1] || '—'} · {rows[0]?.[2] || '—'}</span>
    </div>
  );
}

export default function RatesBlock({
  runtime,
  rates = [],
  iraRates = [],
  ratesMeta = {},
  className = '',
  id = '',
}) {
  const dataset = String(runtime?.dataset || '').trim().toLowerCase();
  const rootClassName = ['rates-block', `rates-block--${dataset || 'unknown'}`, className].filter(Boolean).join(' ');

  if (!runtime || !['certificates', 'ira', '403b'].includes(dataset)) {
    return null;
  }

  return (
    <div
      id={id || undefined}
      className={rootClassName}
      data-rates-block="true"
      data-rates-dataset={dataset}
      data-rates-panel-id={runtime.panelId || undefined}
      data-rates-anchor={runtime.anchorId || undefined}
      data-rates-display-name={runtime.displayName || undefined}
    >
      {dataset === 'certificates' ? <CertificateRatesSheet rates={rates} /> : null}
      {dataset === 'ira' ? <IraRatesSheet rates={iraRates} /> : null}
      {dataset === '403b' ? (
        <div className="retirement-403b-rate-widget">
          <div className="native-info-table-wrap">
            <InfoTableSheet
              headers={['Investment Type', 'Rate', 'APY*']}
              rows={resolve403bRows(rates, ratesMeta)}
              valueAlignment="right"
            />
          </div>
          <p className="service-native-note">*Annual Percentage Yield</p>
          <p className="service-native-note">Effective {ratesMeta?.certificatesEffectiveDate || 'January 1, 2025'}</p>
        </div>
      ) : null}
    </div>
  );
}
