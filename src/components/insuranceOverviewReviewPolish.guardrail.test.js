import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readRuleBlock(source, selector) {
  const exactNeedle = `${selector} {`;
  let exactStart = source.indexOf(exactNeedle);
  let nextExactStart = exactStart >= 0 ? source.indexOf(exactNeedle, exactStart + exactNeedle.length) : -1;
  while (nextExactStart >= 0) {
    exactStart = nextExactStart;
    nextExactStart = source.indexOf(exactNeedle, exactStart + exactNeedle.length);
  }
  const start = exactStart >= 0 ? exactStart : source.indexOf(selector);
  expect(start).toBeGreaterThanOrEqual(0);
  const blockStart = source.indexOf('{', start);
  expect(blockStart).toBeGreaterThan(start);
  const end = source.indexOf('\n}', blockStart);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

function readFirstRuleBlock(source, selector) {
  const start = source.indexOf(selector);
  expect(start).toBeGreaterThanOrEqual(0);
  const blockStart = source.indexOf('{', start);
  expect(blockStart).toBeGreaterThan(start);
  const end = source.indexOf('\n}', blockStart);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('insurance overview review polish guardrail', () => {
  it('keeps insurance coverage cards neutral while leaving impact proof gradients scoped to impact panels', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card {');
    expect(cssSource).toContain('border-radius: 16px;');
    expect(cssSource).toContain('padding: 0;');
    expect(cssSource).toContain('display: flex;');
    expect(cssSource).toContain('flex-direction: column;');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).toContain('--insurance-coverage-card-cap-height: clamp(8.2rem, 13vw, 10.2rem);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card::after {');
    expect(cssSource).toContain('display: none;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card > div:first-child {');
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
    expect(cssSource).toContain('font-size: clamp(2.35rem, 3.6vw, 2.95rem);');
    expect(cssSource).toContain('clamp(1.9rem, 4vw, 2.5rem);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card h3 mark,');
    expect(cssSource).toContain('color: #ffffff !important;');
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
    expect(cssSource).toContain('background: linear-gradient(145deg, var(--ag-color-sand) 0%, var(--ag-color-sandstone) 100%);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-inner {');
    expect(cssSource).toContain('grid-template-columns: clamp(18rem, 30vw, 25rem) minmax(0, 1fr);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-media {');
    expect(cssSource).toContain('aspect-ratio: 4 / 3;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-copy {');
    expect(cssSource).toContain('justify-items: flex-start;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .native-info-feature-logo {');
    expect(cssSource).toContain('width: min(320px, 94%);');
    expect(cssSource).toContain('.impact-proof-story-proof.is-tone-atlantean {');
    expect(cssSource).toContain('.impact-proof-story-proof.is-tone-mango {');
    expect(cssSource).toContain('.impact-proof-story-proof.is-tone-super-grey {');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-quote h2 {');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .native-info-section-copy > h2 {');
    expect(cssSource).toContain('font-size: clamp(3.25rem, 6.4vw, 4.625rem);');
    expect(cssSource).toContain('letter-spacing: -2.5px;');
    expect(cssSource).toContain('line-height: 0.9;');
    expect(cssSource).toContain('margin-bottom: clamp(0.65rem, 1.5vw, 1rem);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-quote .native-info-section-subtitle {');
    expect(cssSource).toContain('letter-spacing: -1.35px;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-certificate-proof {');
    expect(cssSource).toContain('background: linear-gradient(145deg, var(--ag-color-super-grey) 0%, #636265 100%);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-risk .service-native-dark-feature-copy h3 mark.is-melon {');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-risk .service-native-dark-feature-inner,');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-inner {\n  min-height: 0;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-copy {\n  min-height: 0;');
  });

  it('keeps the Mission Assure logo attached when dynamic feature blocks use the native page renderer', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("import MissionAssureLogo from './MissionAssureLogo';");
    expect(source).toContain("logoComponent: runtime.logoKey === 'mission-assure' ? MissionAssureLogo : undefined,");
  });

  it('keeps the insurance Mission Assure heading and copy aligned to the 403(b) housing allowance reference', () => {
    const cssSource = readSource('../styles/service-native.css');
    const missionHeadingRule = readRuleBlock(
      cssSource,
      '.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-copy h3',
    );
    const missionCopyRule = readRuleBlock(
      cssSource,
      '.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-copy p',
    );
    const housingHeadingRule = readRuleBlock(
      cssSource,
      '.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance',
    );
    const housingSharedCopyRule = readFirstRuleBlock(
      cssSource,
      '.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance .native-columns-copy p',
    );
    const housingCopyRule = readRuleBlock(
      cssSource,
      '.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance .native-columns-copy p',
    );

    expect(missionHeadingRule).toContain('max-width: 22em;');
    expect(missionHeadingRule).toContain('font-size: clamp(2rem, 4.6vw, 3.1rem);');
    expect(missionHeadingRule).toContain('text-wrap: balance;');
    expect(cssSource).toContain('grid-template-columns: clamp(18rem, 30vw, 25rem) minmax(0, 1fr);');
    expect(cssSource).toContain('gap: clamp(1rem, 3vw, 2.8rem);');
    expect(housingHeadingRule).toContain('--dynamic-columns-column-title-size: clamp(2rem, 4.6vw, 3.1rem);');
    expect(housingHeadingRule).toContain('--dynamic-columns-photo-max-width: 26rem;');
    expect(housingHeadingRule).toContain('--dynamic-columns-photo-aspect: 1 / 1;');
    expect(missionCopyRule).toContain('font-size: 20.12px;');
    expect(missionCopyRule).toContain('line-height: 29px;');
    expect(missionCopyRule).toContain('letter-spacing: -0.012em;');
    expect(housingSharedCopyRule).toContain('font-size: 20.12px;');
    expect(housingSharedCopyRule).toContain('line-height: 29px;');
    expect(housingCopyRule).toContain('letter-spacing: -0.012em;');
  });

  it('keeps the insurance risk heading the same size as the 403(b) housing allowance heading', () => {
    const cssSource = readSource('../styles/service-native.css');
    const riskHeadingRule = readRuleBlock(
      cssSource,
      '.native-info-page--insurance .insurance-native-risk .service-native-dark-feature-copy h3',
    );
    const housingPresetRule = readRuleBlock(
      cssSource,
      '.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance',
    );

    expect(riskHeadingRule).toContain('font-size: clamp(2rem, 4.6vw, 3.1rem);');
    expect(housingPresetRule).toContain('--dynamic-columns-column-title-size: clamp(2rem, 4.6vw, 3.1rem);');
  });

  it('keeps ministers group life plan detail cards centered with breathing room under the buttons', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card {');
    expect(cssSource).toContain('padding: clamp(1.35rem, 2.5vw, 1.95rem) clamp(1.5rem, 3vw, 2.2rem) clamp(2.5rem, 4.5vw, 3.4rem);');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card > div:first-child {');
    expect(cssSource).toContain('justify-items: center;');
    expect(cssSource).toContain('padding-top: clamp(0.85rem, 1.6vw, 1.25rem);');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card h3 {');
    expect(cssSource).toContain('min-height: 0 !important;');
    expect(cssSource).toContain('display: block;');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('padding-bottom: 0 !important;');
    expect(cssSource).toContain('text-align: center;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card h3::after {');
    expect(cssSource).toContain('display: none !important;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card .service-native-action-row:last-child {');
    expect(cssSource).toContain('margin-bottom: clamp(0.85rem, 1.6vw, 1.25rem);');
  });
});
