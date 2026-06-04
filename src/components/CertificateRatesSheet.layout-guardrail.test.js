import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('certificate rates sheet layout guardrail', () => {
  it('keeps desktop standard and premium bands separate while preserving a unified mobile comparison shell with a default APY toggle and component-owned band-title typography', () => {
    const componentSource = readSource('./CertificateRatesSheet.jsx');
    const cssSource = readSource('./CertificateRatesSheet.css');
    const serviceNativeCssSource = readSource('../styles/service-native.css');
    const appCssSource = readSource('../styles.css');

    expect(componentSource).toContain('data-rates-layout="bands-and-cards"');
    expect(componentSource).toContain('data-rates-desktop="bands"');
    expect(componentSource).toContain('data-rates-mobile="term-cards"');
    expect(componentSource).toContain("const [mobileMetric, setMobileMetric] = useState('apy');");
    expect(componentSource).toContain('Investment Type');
    expect(componentSource).toContain('Standard APY*');
    expect(componentSource).toContain('Standard Rate');
    expect(componentSource).toContain('Premium APY*');
    expect(componentSource).toContain('Premium Rate**');
    expect(componentSource).toContain('className="certificate-rates-sheet__mobile-toolbar"');
    expect(componentSource).toContain('className="certificate-rates-sheet__mobile-toggle"');
    expect(componentSource).toContain('className={`certificate-rates-sheet__mobile-toggle-button${isApyMode ? \' is-active\' : \'\'}');
    expect(componentSource).toContain('className={`certificate-rates-sheet__mobile-toggle-button${!isApyMode ? \' is-active\' : \'\'}');
    expect(componentSource).toContain('className="certificate-rates-sheet__term-card"');
    expect(componentSource).toContain('className="certificate-rates-sheet__term-compare"');
    expect(componentSource).toContain('className="certificate-rates-sheet__term-side certificate-rates-sheet__term-side--standard"');
    expect(componentSource).toContain('className="certificate-rates-sheet__term-side certificate-rates-sheet__term-side--premium"');
    expect(componentSource).toContain('className="certificate-rates-sheet__term-side-label"');
    expect(componentSource).toContain('className="certificate-rates-sheet__term-metric-label"');
    expect(componentSource).toContain('className="certificate-rates-sheet__term-metric"');
    expect(componentSource).toContain("key={`standard-${row.id}`}");
    expect(componentSource).toContain("key={`premium-${row.id}`}");
    expect(componentSource).toContain("key={`mobile-${row.id}`}");
    expect(cssSource).toContain('max-width: 64rem;');
    expect(cssSource).toContain('margin-inline: auto;');
    expect(cssSource).toContain('.certificate-rates-sheet__desktop {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1.46fr) minmax(15rem, 0.84fr);');
    expect(cssSource).toContain('.certificate-rates-sheet__band--standard {');
    expect(cssSource).toContain('--certificate-rates-band-accent: linear-gradient(135deg, var(--ag-color-atlantean-dark) 0%, var(--ag-color-atlantean) 100%);');
    expect(cssSource).toContain('.certificate-rates-sheet__band--premium {');
    expect(cssSource).toContain('--certificate-rates-band-accent: linear-gradient(135deg, #f7b229 0%, var(--ag-color-mango) 100%);');
    expect(cssSource).toContain('.certificate-rates-sheet .certificate-rates-sheet__band-title {');
    expect(cssSource).toContain('font-size: clamp(1.18rem, 1.22vw, 1.28rem);');
    expect(cssSource).toContain('line-height: 1.05;');
    expect(cssSource).toContain('padding: 0.46rem 0.8rem;');
    expect(cssSource).toContain('.certificate-rates-sheet__table tbody th,');
    expect(cssSource).toContain('padding: 0.64rem 0.84rem;');
    expect(cssSource).toContain('.certificate-rates-sheet__table--standard tbody td:nth-child(2) {');
    expect(cssSource).toContain('.certificate-rates-sheet__table--premium thead th,');
    expect(cssSource).toContain('.certificate-rates-sheet__mobile-toggle {');
    expect(cssSource).toContain('.certificate-rates-sheet__mobile-toggle-button.is-active {');
    expect(cssSource).toContain('.certificate-rates-sheet__mobile {');
    expect(cssSource).toContain('.certificate-rates-sheet__term-compare {');
    expect(cssSource).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(cssSource).toContain('.certificate-rates-sheet__term-metric .certificate-rates-sheet__value.is-mobile-rate {');
    expect(cssSource).toContain('@media (max-width: 720px) {');
    expect(cssSource).toContain('.certificate-rates-sheet__desktop {');
    expect(cssSource).toContain('display: none;');
    expect(cssSource).toContain('.certificate-rates-sheet__mobile {');
    expect(cssSource).toContain('display: block;');
    expect(cssSource).toContain('@media (max-width: 340px) {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(componentSource).not.toContain('Not FDIC');
    expect(serviceNativeCssSource).not.toContain('certificate-rates-sheet__band-title');
    expect(appCssSource).not.toContain('certificate-rates-sheet__band-title');
  });
});
