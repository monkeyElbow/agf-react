import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('loans options heading styles', () => {
  it('keeps the options heading sizing owned by scoped CSS instead of inline overrides', () => {
    const pageSource = readSource('./LoansPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(pageSource).toContain("loanOptionsGrid.titleClassName || 'loans-native-display-heading loans-native-options-title'");
    expect(pageSource).toContain('className="loans-native-display-heading loans-native-options-subtitle"');
    expect(pageSource).toContain('className="loans-native-options-lead native-info-rich-html"');
    expect(pageSource).not.toContain("fontSize: '54.5px'");
    expect(pageSource).not.toContain("fontSize: '38.4px'");
    expect(pageSource).not.toContain("marginBottom: 'clamp(2.1rem, 4.5vw, 3.3rem)'");
    expect(pageSource).not.toContain("style={{ width: 'min(100%, 58rem)'");

    expect(cssSource).toContain('.service-native-section.loans-native-options .loans-native-options-title');
    expect(cssSource).toContain('.service-native-section.loans-native-options .loans-native-options-subtitle');
    expect(cssSource).toContain('.service-native-section.loans-native-options .loans-native-options-lead');
    expect(cssSource).toContain('--loans-native-options-title-size');
    expect(cssSource).toContain('--loans-native-options-subtitle-size');
    expect(cssSource).toContain('grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));');
    expect(cssSource).not.toContain('--loans-native-option-card-min-height');
    expect(cssSource).not.toContain('min-height: var(--loans-native-option-card-min-height);');
    expect(cssSource).not.toContain('.loans-native-options-grid > .service-native-card:nth-last-child(3):nth-child(4n + 1),');
    expect(cssSource).not.toContain('grid-column: span 4;');
  });
});
