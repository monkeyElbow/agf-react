import { defaultIraRates, defaultRates, defaultRatesMeta } from '../data/ratesDefault';

export const RATES_CONTENT_PATH = '/rates';
export const CERTIFICATES_RATES_BLOCK_ID = 'certificates_table';
export const IRA_RATES_BLOCK_ID = 'ira_table';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseRows(value, fallback) {
  if (Array.isArray(value)) {
    return clone(value);
  }
  if (typeof value !== 'string' || !value.trim()) {
    return clone(fallback);
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function findRatesBlock(blocks, blockId) {
  return Array.isArray(blocks)
    ? blocks.find((block) => String(block?.id || '').trim() === blockId) || null
    : null;
}

/**
 * The two visible /rates blocks are the single persisted authority for the
 * rate tables. Defaults only cover an unseeded block; saved data always wins.
 */
export function readRatesTablesFromBlocks(blocks) {
  const certificatesBlock = findRatesBlock(blocks, CERTIFICATES_RATES_BLOCK_ID);
  const iraBlock = findRatesBlock(blocks, IRA_RATES_BLOCK_ID);
  const certificates = certificatesBlock?.settings || {};
  const ira = iraBlock?.settings || {};

  return {
    rates: parseRows(certificates.rowsJson, defaultRates),
    iraRates: parseRows(ira.rowsJson, defaultIraRates),
    ratesMeta: {
      ...defaultRatesMeta,
      certificatesEffectiveDate: String(
        certificates.effectiveDate || defaultRatesMeta.certificatesEffectiveDate,
      ),
      iraEffectiveDate: String(ira.effectiveDate || defaultRatesMeta.iraEffectiveDate),
      retirement403bMbaRate: String(
        certificates.retirement403bMbaRate || defaultRatesMeta.retirement403bMbaRate,
      ),
      retirement403bMbaApy: String(
        certificates.retirement403bMbaApy || defaultRatesMeta.retirement403bMbaApy,
      ),
    },
  };
}

export function buildRatesBlockSettingsPatch(block, rateTables) {
  const blockId = String(block?.id || '').trim();
  const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
  const tables = rateTables || {};

  if (blockId === CERTIFICATES_RATES_BLOCK_ID) {
    return {
      ...settings,
      rowsJson: JSON.stringify(Array.isArray(tables.rates) ? tables.rates : defaultRates),
      effectiveDate: String(
        tables.ratesMeta?.certificatesEffectiveDate || defaultRatesMeta.certificatesEffectiveDate,
      ),
      retirement403bMbaRate: String(
        tables.ratesMeta?.retirement403bMbaRate || defaultRatesMeta.retirement403bMbaRate,
      ),
      retirement403bMbaApy: String(
        tables.ratesMeta?.retirement403bMbaApy || defaultRatesMeta.retirement403bMbaApy,
      ),
    };
  }

  if (blockId === IRA_RATES_BLOCK_ID) {
    return {
      ...settings,
      rowsJson: JSON.stringify(Array.isArray(tables.iraRates) ? tables.iraRates : defaultIraRates),
      effectiveDate: String(
        tables.ratesMeta?.iraEffectiveDate || defaultRatesMeta.iraEffectiveDate,
      ),
    };
  }

  return settings;
}
