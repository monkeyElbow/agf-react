import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultIraRates, defaultRates } from '../data/ratesDefault.js';
import {
  applyParsedRowsToImportReport,
  extractSpecialRateMetaFromParsedRows,
  finalizeImportReportMissingRows,
} from './ratesPdfImportCore.js';

function emptyReport() {
  return {
    effectiveDate: '',
    certificates: [],
    ira: [],
    warnings: [],
    unmatchedPdfRows: [],
    missingCertificateRows: [],
    missingIraRows: [],
  };
}

test('maps parsed certificate and IRA rows into correct admin fields', () => {
  const draft = {
    rates: defaultRates,
    iraRates: defaultIraRates,
  };

  const parsedRows = [
    {
      label: 'AGLF 30-Day Demand',
      values: ['3.625%', '3.686%', 'N/A', 'N/A'],
      raw: 'AGLF 30-Day Demand 3.625% 3.686% N/A N/A',
      source: 'paired',
    },
    {
      label: 'AGLF 1-Year Series D',
      values: ['3.750%', '3.815%', '4.000%', '4.074%'],
      raw: 'AGLF 1-Year Series D 3.750% 3.815% 4.000% 4.074%',
      source: 'paired',
    },
    {
      label: 'AGLF 2 -Year Series D',
      values: ['3.750%', '3.815%', '4.000%', '4.074%'],
      raw: 'AGLF 2 -Year Series D 3.750% 3.815% 4.000% 4.074%',
      source: 'paired',
    },
    {
      label: 'AGLF 5-Year Adjustable IRA',
      values: ['3.625%', '3.686%', 'N/A', 'N/A'],
      raw: 'AGLF 5-Year Adjustable IRA 3.625% 3.686% N/A N/A',
      source: 'paired',
    },
    {
      label: 'AGLF 7-Year Fixed IRA',
      values: ['3.750%', '3.815%', 'N/A', 'N/A'],
      raw: 'AGLF 7-Year Fixed IRA 3.750% 3.815% N/A N/A',
      source: 'paired',
    },
  ];

  const report = emptyReport();
  applyParsedRowsToImportReport(parsedRows, draft, report);
  finalizeImportReportMissingRows(draft, report);

  assert.equal(report.certificates.length, 3);
  assert.equal(report.ira.length, 1);

  const demand = report.certificates.find((r) => r.matchedId === 'demand');
  assert.ok(demand);
  assert.equal(demand.standardRate, '3.625%');
  assert.equal(demand.standardApy, '3.686%');
  assert.equal(demand.premiumRate, 'N/A');
  assert.equal(demand.premiumApy, 'N/A');

  const oneYear = report.certificates.find((r) => r.matchedId === '1-year');
  assert.ok(oneYear);
  assert.equal(oneYear.standardRate, '3.750%');
  assert.equal(oneYear.standardApy, '3.815%');
  assert.equal(oneYear.premiumRate, '4.000%');
  assert.equal(oneYear.premiumApy, '4.074%');

  const twoYear = report.certificates.find((r) => r.matchedId === '2-year');
  assert.ok(twoYear);

  const iraAdj = report.ira.find((r) => r.matchedId === 'ira-5-year-adj');
  assert.ok(iraAdj);
  assert.equal(iraAdj.rate, '3.625%');
  assert.equal(iraAdj.apy, '3.686%');

  assert.ok(!report.certificates.some((r) => r.matchedId === 'ira-5-year-adj'));
  assert.ok(report.unmatchedPdfRows.some((r) => r.label === 'AGLF 7-Year Fixed IRA'));

  assert.ok(!report.missingCertificateRows.includes('DEMAND'));
  assert.ok(!report.missingCertificateRows.includes('1-YEAR'));
  assert.ok(!report.missingIraRows.includes('5-YEAR ADJ.'));
});

test('extracts MBA Fixed Income Fund - Select 403(b) rate + APY for 403(b) widget meta', () => {
  const parsedRows = [
    {
      label: 'MBA Fixed Income Fund - Select 403(b)',
      values: ['4.000%', '4.074%'],
      raw: 'MBA Fixed Income Fund - Select 403(b) 4.000% 4.074%',
      source: 'paired',
    },
  ];

  const report = emptyReport();
  const meta = extractSpecialRateMetaFromParsedRows(parsedRows, report);

  assert.equal(meta.retirement403bMbaRate, '4.000%');
  assert.equal(meta.retirement403bMbaApy, '4.074%');
  assert.equal(meta.retirement403bMbaLabel, 'MBA Fixed Income Fund - Select 403(b)');
  assert.equal(report.warnings.length, 0);
});
