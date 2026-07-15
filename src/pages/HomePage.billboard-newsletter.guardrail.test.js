import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home billboard and newsletter guardrail', () => {
  it('keeps do-the-math aligned to the ministry-allies headline scale and opens the calculator CTA spacing', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.service-native-section.home-native-billboard[data-block-id="home_do_the_math"] .native-info-section-copy > h2 {');
    expect(cssSource).toContain('font-size: clamp(calc(5.25rem * 0.58), 8vw, 5.25rem) !important;');
    expect(cssSource).toContain('.service-native-section.home-native-billboard[data-block-id="home_do_the_math"] .native-info-section-copy {');
    expect(cssSource).toContain('justify-items: start;');
    expect(cssSource).toContain('.service-native-section.home-native-billboard[data-block-id="home_do_the_math"] .home-math-badge {');
    expect(cssSource).toContain('.service-native-section.home-native-billboard[data-block-id="home_do_the_math"] .home-math-badge.is-pressing .home-math-badge-button {');
    expect(cssSource).toContain('padding-top: clamp(3.68rem, 6.4vw, 5.12rem);');
    expect(cssSource).toContain('width: clamp(5.25rem, 7.5vw, 6.6rem);');
    expect(cssSource).toContain('stroke-width: 2.55px;');
    expect(cssSource).toContain('@keyframes home-math-badge-press {');
    expect(cssSource).toContain('.service-native-section.home-native-billboard[data-block-id="home_do_the_math"] .service-native-action-row {');
    expect(cssSource).toContain('margin-top: clamp(1.6rem, 3vw, 2rem);');
  });

  it('keeps the newsletter header scaled up and the submit button stacked below the field', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-native-newsletter > .ag-panel-rail > h2 {');
    expect(cssSource).toContain('font-size: clamp(calc(5.25rem * 0.58), 8vw, 5.25rem);');
    expect(cssSource).toContain('.home-native-newsletter-embed .newsletter-signup-form-row {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('.home-native-newsletter-embed .newsletter-signup-form-submit {');
    expect(cssSource).toContain('justify-self: center;');
  });

  it('keeps the home CTA headline on the tighter tracking override', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-native-page .service-native-section.native-dynamic-cta .native-info-section-copy > h2 {');
    expect(cssSource).toContain('letter-spacing: -0.035em;');
  });
});
