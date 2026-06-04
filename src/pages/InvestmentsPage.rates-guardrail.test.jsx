import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('investments rates sheet guardrail', () => {
  it('routes the investments certificates section through the shared certificate rates sheet while preserving the existing disclosure copy and the shared rates heading scale', () => {
    const source = readSource('./InvestmentsPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(source).toContain("import CertificateRatesSheet from '../components/CertificateRatesSheet';");
    expect(source).toContain('<CertificateRatesSheet rates={rates} className="investments-native-certificate-rates-sheet" />');
    expect(source).toContain('AGFinancial Investment Certificates Rates');
    expect(source).toContain('Rates subject to change. Demand certificates are investments that do not represent cash and are payable');
    expect(source).toContain('This is not an offer to sell securities referred to herein and we are not soliciting you to purchase');
    expect(source).toContain("A limited offering is available in Washington. Not available in Ohio.");
    expect(source).toContain('Not FDIC or SIPC Insured. Not a Bank Deposit. No AGFinancial Guarantee.');
    expect(cssSource).toContain('.service-native-section h2.investments-native-rates-title {');
    expect(cssSource).toContain('font-size: clamp(1.82rem, 3.25vw, 2.63rem);');
  });
});
