import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('insurance overview review polish guardrail', () => {
  it('keeps insurance coverage cards neutral while leaving impact proof gradients scoped to impact panels', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card {');
    expect(cssSource).toContain('border-radius: 16px;');
    expect(cssSource).toContain('padding: 0;');
    expect(cssSource).toContain('background: var(--insurance-coverage-card-cap-bg);');
    expect(cssSource).toContain('--insurance-coverage-card-cap-height: clamp(8.2rem, 13vw, 10.2rem);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card::after {');
    expect(cssSource).toContain('background: linear-gradient(142deg, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.85) 100%);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card p {');
    expect(cssSource).toContain('padding: clamp(1.35rem, 2.8vw, 1.75rem) clamp(2rem, 4vw, 2.65rem) 0;');
    expect(cssSource).toContain('color: var(--ag-color-super-grey);');
    expect(cssSource).toContain('font-size: clamp(1rem, 1.38vw, 1.1rem);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card h3 {');
    expect(cssSource).toContain('color: #ffffff;');
    expect(cssSource).toContain('align-items: flex-end;');
    expect(cssSource).toContain('justify-content: flex-start;');
    expect(cssSource).toContain('text-align: left;');
    expect(cssSource).toContain('font-weight: 700;');
    expect(cssSource).toContain('font-size: clamp(2rem, 3vw, 2.35rem);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage > .ag-panel-rail > .service-native-action-row {');
    expect(cssSource).toContain('background: none;');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('padding: 0.125rem 0.1875rem;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage > .ag-panel-rail > .service-native-action-row .service-native-btn {');
    expect(cssSource).toContain('--btn-color: #ffffff;');
    expect(cssSource).toContain('--btn-bg: transparent;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage > .ag-panel-rail > .service-native-action-row .service-native-btn.is-outline,');
    expect(cssSource).toContain('--btn-hover-bg: transparent;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card .service-native-action-row:last-child {');
    expect(cssSource).toContain('clamp(2rem, 4vw, 2.65rem)');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card:nth-child(1) {');
    expect(cssSource).toContain('--insurance-coverage-card-cap-bg: linear-gradient(135deg, var(--ag-color-atlantean-dark) 0%, var(--ag-color-atlantean) 100%);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card:nth-child(2) {');
    expect(cssSource).toContain('--insurance-coverage-card-cap-bg: linear-gradient(135deg, #0b6b86 0%, var(--ag-color-atlantean-dark) 100%);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card:nth-child(3) {');
    expect(cssSource).toContain('--insurance-coverage-card-cap-bg: linear-gradient(135deg, #ef816a 0%, var(--ag-color-melon) 100%);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card:nth-child(4) {');
    expect(cssSource).toContain('--insurance-coverage-card-cap-bg: linear-gradient(135deg, #4f5053 0%, var(--ag-color-super-grey) 100%);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure {');
    expect(cssSource).toContain('background: linear-gradient(145deg, #f5f0e7 0%, #e8dfd1 58%, #f7f3ed 100%);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-inner {');
    expect(cssSource).toContain('grid-template-columns: minmax(220px, 34%) minmax(0, 1fr);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-media {');
    expect(cssSource).toContain('min-height: clamp(250px, 30vw, 360px);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .native-info-feature-logo {');
    expect(cssSource).toContain('width: min(320px, 94%);');
    expect(cssSource).toContain('.impact-proof-story-proof.is-tone-atlantean {');
    expect(cssSource).toContain('.impact-proof-story-proof.is-tone-mango {');
    expect(cssSource).toContain('.impact-proof-story-proof.is-tone-super-grey {');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-quote h2 {');
    expect(cssSource).toContain('letter-spacing: -0.06em;');
    expect(cssSource).toContain('line-height: 0.76;');
    expect(cssSource).toContain('margin-bottom: 1.2rem;');
  });
});
