import { describe, expect, it } from 'vitest';
import { defaultIraRates, defaultRates, defaultRatesMeta } from '../data/ratesDefault';
import {
  CERTIFICATES_RATES_BLOCK_ID,
  IRA_RATES_BLOCK_ID,
  buildRatesBlockSettingsPatch,
  readRatesTablesFromBlocks,
} from './ratesBlockData';

describe('rates block authority', () => {
  it('uses defaults only until the existing /rates blocks carry saved rows', () => {
    expect(readRatesTablesFromBlocks([])).toEqual({
      rates: defaultRates,
      iraRates: defaultIraRates,
      ratesMeta: defaultRatesMeta,
    });
  });

  it('round-trips saved rate rows and metadata through the two rate blocks', () => {
    const source = {
      rates: [{ id: 'certificate', product: 'CERTIFICATE', standardRate: '7.000%' }],
      iraRates: [{ id: 'ira', product: 'IRA', rate: '6.000%', apy: '6.10%' }],
      ratesMeta: {
        certificatesEffectiveDate: 'September 1, 2026',
        iraEffectiveDate: 'September 2, 2026',
        retirement403bMbaRate: '5.000%',
        retirement403bMbaApy: '5.11%',
      },
    };
    const certificateBlock = {
      id: CERTIFICATES_RATES_BLOCK_ID,
      settings: { dataset: 'certificates' },
    };
    const iraBlock = {
      id: IRA_RATES_BLOCK_ID,
      settings: { dataset: 'ira' },
    };

    const result = readRatesTablesFromBlocks([
      { ...certificateBlock, settings: buildRatesBlockSettingsPatch(certificateBlock, source) },
      { ...iraBlock, settings: buildRatesBlockSettingsPatch(iraBlock, source) },
    ]);

    expect(result).toEqual(source);
  });

  it('rejects malformed saved row data instead of letting it break the public table', () => {
    const tables = readRatesTablesFromBlocks([
      { id: CERTIFICATES_RATES_BLOCK_ID, settings: { rowsJson: '{not json' } },
      { id: IRA_RATES_BLOCK_ID, settings: { rowsJson: '{}' } },
    ]);

    expect(tables.rates).toEqual(defaultRates);
    expect(tables.iraRates).toEqual(defaultIraRates);
  });
});
