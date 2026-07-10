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
  it('routes the investments certificates section through the shared certificate rates sheet and centralized disclosures', () => {
    const source = readSource('./InvestmentsPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(source).toContain("import CertificateRatesSheet from '../components/CertificateRatesSheet';");
    expect(source).toContain("import { useDisclosures } from '../context/DisclosuresContext';");
    expect(source).toContain('<CertificateRatesSheet rates={rates} className="investments-native-certificate-rates-sheet" />');
    expect(source).toContain('AGFinancial Investment Certificates Rates');
    expect(source).toContain("getDisclosureValue('investments-certificates-rates-details-html'");
    expect(source).toContain("'investments-shared-risk-warning'");
    expect(source).toContain("'investments-shared-affiliation'");
    expect(cssSource).toContain('.service-native-section h2.investments-native-rates-title {');
    expect(cssSource).toContain('font-size: clamp(1.82rem, 3.25vw, 2.63rem);');
  });
});
