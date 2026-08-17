import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('online contributions review polish guardrail', () => {
  it('keeps the setup route visibly structured as overview, steps, and help', () => {
    const cssSource = readSource('../styles/service-native.css');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');

    expect(blueprintSource).toContain("'/online-contributions': [");
    expect(blueprintSource).toContain("sectionClassName: 'online-contrib-native-overview'");
    expect(blueprintSource).toContain("sectionClassName: 'online-contrib-native-steps'");
    expect(blueprintSource).toContain("sectionClassName: 'online-contrib-native-help'");
    expect(blueprintSource).toContain("id: 'setup_steps',\n      name: 'Setup Steps',\n      presetId: 'step-cards'");
    expect(blueprintSource).toContain("title: '01',\n          body: 'Create a new user account for your company.");
    expect(blueprintSource).toContain("title: '02',\n          body: 'Select \"403(b) Employer\" as the Account Type.");
    expect(blueprintSource).toContain("title: '03',\n          body: 'Get your Employer Code.");
    expect(cssSource).toContain('.native-info-page--online-contributions .online-contrib-native-overview {');
    expect(cssSource).toContain('padding-top: clamp(4.2rem, 7vw, 5.8rem);');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-step-cards .service-native-card:not(.investments-native-cert-card):not(.retirement-account-card--certificate) {');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-step-cards .service-native-grid {');
    expect(cssSource).toContain('grid-template-columns: clamp(3.35rem, 5vw, 4.15rem) minmax(0, 1fr);');
    expect(cssSource).toContain('font-size: clamp(2.55rem, 4.35vw, 3.2rem);');
    expect(cssSource).toContain('.native-info-page--online-contributions .online-contrib-native-steps .service-native-card {');
    expect(cssSource).toContain('.native-info-page--online-contributions .online-contrib-native-steps > :is(.native-info-full-bleed, .ag-panel-rail, .ag-panel-rail-wide) {');
    expect(cssSource).toContain('max-width: 74rem !important;');
    expect(cssSource).toContain('margin-inline: auto !important;');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr) !important;');
    expect(cssSource).toContain('width: min(100%, 82ch) !important;');
    expect(cssSource).toContain('grid-template-columns: clamp(3.35rem, 5vw, 4.15rem) minmax(0, 1fr);');
    expect(cssSource).toContain('font-size: clamp(2.55rem, 4.35vw, 3.2rem) !important;');
    expect(cssSource).toContain('--ret403b-step-accent: var(--ag-color-atlantean);');
    expect(cssSource).toContain('.native-info-page--online-contributions .online-contrib-native-steps .service-native-card:nth-child(3n + 2) {');
    expect(cssSource).toContain('--ret403b-step-accent: var(--ag-color-mango);');
    expect(cssSource).toContain('.native-info-page--online-contributions .online-contrib-native-steps .service-native-card:nth-child(3n) {');
    expect(cssSource).toContain('--ret403b-step-accent: var(--ag-color-sandstone-dark);');
    expect(cssSource).toContain('border: 2px solid var(--ret403b-step-accent) !important;');
    expect(cssSource).toContain('border-color: var(--ag-color-mango) !important;');
    expect(cssSource).toContain('border-color: var(--ag-color-sandstone-dark) !important;');
    expect(cssSource).toContain('.native-info-page--online-contributions .online-contrib-native-steps .service-native-card:nth-child(3n + 1) h3 {');
    expect(cssSource).toContain('.native-info-page--online-contributions .online-contrib-native-steps .service-native-card:nth-child(3n + 2) h3 {');
    expect(cssSource).toContain('.native-info-page--online-contributions .online-contrib-native-steps .service-native-card:nth-child(3n) h3 {');
    expect(cssSource).toContain('color: var(--ag-color-atlantean) !important;');
    expect(cssSource).toContain('color: var(--ag-color-mango) !important;');
    expect(cssSource).toContain('color: var(--ag-color-sandstone-dark) !important;');
    expect(cssSource).toContain('border-radius: 1.75rem !important;');
    expect(cssSource).toContain('.native-info-page--online-contributions .online-contrib-native-help .native-info-section-copy > h2 {');
    expect(cssSource).toContain('letter-spacing: var(--ag-letter-spacing-helv-heading);');
  });
});
