import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('admin editor control rounding', () => {
  it('keeps admin and HUD previews aligned with the public button and field geometry', () => {
    const adminSource = `${readSource('../styles.css')}\n${readSource('../styles/admin.css')}`;
    const hudSource = readSource('../styles/front-hud.css');

    expect(adminSource).toContain('.admin-button-preview-row .service-native-btn {');
    expect(adminSource).toContain('font-size: 1rem;');
    expect(adminSource).toContain('min-height: 44px;');
    expect(adminSource).toContain('border-radius: 999px;');
    expect(adminSource).toContain('.admin-content-page-wrap :is(');
    expect(adminSource).toContain('border-radius: var(--ag-field-radius);');
    expect(adminSource).toContain('.admin-content-page-wrap textarea {');
    expect(adminSource).toContain('border-radius: 18px;');

    expect(hudSource).toContain('.admin-billboard-editor-preview-button {');
    expect(hudSource).toContain('.admin-hud-editor-shared-surface .admin-billboard-editor-preview-button,');
    expect(hudSource).toContain('font-size: 1rem !important;');
    expect(hudSource).toContain('.admin-button-preview-surface');
    expect(hudSource).toContain('.admin-hud-editor-shared-surface :is(');
    expect(hudSource).toContain('.admin-front-hud-tool :is(');
    expect(hudSource).toContain('border-radius: var(--ag-field-radius) !important;');
    expect(hudSource).toContain('.admin-front-hud-tool textarea {');
    expect(hudSource).toContain('border-radius: 18px !important;');
  });

  it('gives block editor fields a soft resting shade and white focus state', () => {
    const adminSource = readSource('../styles/admin.css');
    const hudSource = readSource('../styles/front-hud.css');
    const tokenSource = readSource('../styles/tokens.css');

    expect(tokenSource).toContain('--ag-admin-field-bg: #f3f5f6;');
    expect(tokenSource).toContain('--ag-admin-field-bg-focus: #ffffff;');
    expect(tokenSource).toContain('--ag-admin-field-transition: background-color 180ms ease');
    expect(adminSource).toContain('background: var(--ag-admin-field-bg);');
    expect(adminSource).toContain('.admin-content-field-list :is(input, select, textarea):focus');
    expect(hudSource).toContain('background: var(--ag-admin-field-bg) !important;');
    expect(hudSource).toContain('background: var(--ag-admin-field-bg-focus) !important;');
    expect(hudSource).toContain('transition: var(--ag-admin-field-transition);');
    expect(hudSource).toContain('outline: none !important;');
    expect(hudSource).toContain('box-shadow: none !important;');
    expect(hudSource).toContain('border: 1px solid rgba(var(--ag-admin-hud-accent-rgb), 0.28) !important;');
    expect(hudSource).toContain('decorative outline or shadow');
    expect(tokenSource).not.toContain('box-shadow 180ms ease');
    expect(hudSource).toContain('.admin-site-feature-field > :is(input, select, textarea)');
    expect(hudSource).toContain('font-family: var(--ag-font-body) !important;');
    expect(hudSource).toContain('border-radius: 18px !important;');
    expect(hudSource).toContain('.admin-hud-editor-shared-surface :is(');
    expect(hudSource).toContain(':not(.admin-front-hud-hero-live-input)');
    expect(hudSource).toContain(
      "textarea:not(.admin-color-text-inline-input):not(.admin-front-hud-hero-live-input)",
    );
    expect(hudSource).toContain('.admin-hud-editor-shared-surface textarea.admin-color-text-inline-input');
    expect(hudSource).toContain('background: transparent !important;');
  });

  it('keeps every shared admin color palette circular, including rich-body HTML editors', () => {
    const adminSource = readSource('../styles/admin.css');
    const htmlEditorSource = readSource('../components/AdminHtmlEditor.jsx');

    expect(adminSource).toContain('Standard admin circular swatch palette contract.');
    expect(adminSource).toContain('--admin-swatch-option-radius: 50%;');
    expect(adminSource).toContain('--admin-swatch-chip-radius: 50%;');
    expect(adminSource).toContain('.admin-html-editor-color-group .admin-swatch-option');
    expect(adminSource).toContain('border-radius: 50% !important;');
    expect(htmlEditorSource).toContain('is-compact is-icon-only is-circular admin-html-editor-color-group');
  });

  it('keeps Request Form lead copy readable after compact field styling', () => {
    const hudSource = readSource('../styles/front-hud.css');
    const compactTextareaRule = hudSource.indexOf(
      ".admin-hud-editor-shared-surface .admin-request-form-hud-editor\n  :is(.admin-front-hud-field > input[type='text']",
    );
    const leadCopyRule = hudSource.indexOf(
      '.admin-hud-editor-shared-surface .admin-request-form-hud-editor .admin-request-form-lead-field > textarea',
    );

    expect(compactTextareaRule).toBeGreaterThanOrEqual(0);
    expect(leadCopyRule).toBeGreaterThan(compactTextareaRule);
    expect(hudSource.slice(leadCopyRule, leadCopyRule + 500)).toContain('font-size: var(--ag-font-size-body);');
    expect(hudSource.slice(leadCopyRule, leadCopyRule + 500)).toContain('min-height: 7rem;');
  });

  it('keeps Request Form heading and lead content aligned with swatches in the side rail', () => {
    const hudSource = readSource('../styles/front-hud.css');

    expect(hudSource).toContain('.admin-hud-editor-shared-surface .admin-request-form-hud-editor .admin-color-text-editor {');
    expect(hudSource).toContain('grid-template-columns: minmax(0, 1fr) minmax(9rem, 0.42fr);');
    expect(hudSource).toContain('"editor swatches";');
    expect(hudSource).toContain('.admin-hud-editor-shared-surface .admin-request-form-hud-editor .admin-color-text-controls-row {');
  });

  it('gives Hero line swatches room and keeps selection badges beneath them', () => {
    const hudSource = readSource('../styles/front-hud.css');

    expect(hudSource).toContain(
      '.admin-hud-editor-shared-surface .admin-hero-hud-line-inputs {\n  display: grid;\n  grid-template-columns: 1fr;',
    );
    expect(hudSource).toContain(
      '.admin-hud-editor-shared-surface .admin-hero-hud-line-row {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) minmax(12rem, 0.46fr);',
    );
    expect(hudSource).toContain(
      'grid-template-areas:\n    "swatches"\n    "details";',
    );
    expect(hudSource).not.toContain('grid-area: toggle;');
  });

  it('keeps Hero Actions fields compact and filling the available HUD width', () => {
    const hudSource = readSource('../styles/front-hud.css');

    expect(hudSource).toContain('.admin-hud-editor-shared-surface .admin-hero-hud-card--actions .admin-hero-hud-action-grid {');
    expect(hudSource).toContain('grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));');
    expect(hudSource).toContain('.admin-hud-editor-shared-surface .admin-hero-hud-action-group\n  .admin-content-field-list.admin-hero-action-fields');
    expect(hudSource).toContain('font-size: 0.62rem;');
    expect(hudSource).toContain('grid-template-columns: minmax(0, 1fr) minmax(8rem, 0.8fr);');
  });

  it('applies the shared compact contract to every HUD field grid and route link', () => {
    const hudSource = readSource('../styles/front-hud.css');

    expect(hudSource).toContain('.admin-hud-editor-shared-surface\n  :is(.admin-content-field-list, .admin-content-field-list--inline)\n  > label');
    expect(hudSource).toContain('.admin-hud-editor-shared-surface .admin-route-link-new-window {');
    expect(hudSource).toContain('grid-column: 1 / -1;');
    expect(hudSource).toContain('.admin-hud-editor-shared-surface .admin-swatch-list.is-icon-only {');
    expect(hudSource).toContain('--admin-swatch-option-radius: 50%;');
    expect(hudSource).toContain('.admin-hud-editor-shared-surface .admin-html-editor-color-swatch {');
    expect(hudSource).toContain('border-radius: 50% !important;');
  });

  it('anchors HUD swatch circles to the shared palette class', () => {
    const hudSource = readSource('../styles/front-hud.css');

    expect(hudSource).toContain('.admin-front-hud-swatch-row.hud-standard-swatch-palette .admin-front-hud-swatch {');
    expect(hudSource).toContain('.admin-front-hud-swatch-row.hud-standard-swatch-palette .admin-front-hud-swatch-fill {');
  });

  it('keeps block ownership badge copy readable independently of identity color', () => {
    const hudSource = readSource('../styles/front-hud.css');

    expect(hudSource).toContain('.admin-block-ownership-overlay-item strong {\n  color: var(--ag-color-super-grey, #414042);\n}');
  });

  it('keeps every dedicated HUD rich-text editor on the HUD palette', () => {
    const componentSources = [
      readSource('../components/CtaHudEditorPanel.jsx'),
      readSource('../components/IntroHudEditorShared.jsx'),
      readSource('../components/PageContentHudEditorPanel.jsx'),
      readSource('../components/BillboardHudEditorPanel.jsx'),
    ];

    componentSources.forEach((source) => {
      const editorCount = (source.match(/<AdminHtmlEditor/g) || []).length;
      const hudPaletteCount = (source.match(/paletteVariant="hud"/g) || []).length;
      expect(hudPaletteCount).toBeGreaterThanOrEqual(editorCount);
    });
  });

  it('keeps the Request Form button preview at public-button typography', () => {
    const hudSource = readSource('../styles/front-hud.css');
    const compactButtonRule = hudSource.indexOf(
      '.admin-hud-editor-model-layout :is(\n  .admin-front-hud-mini-action,',
    );
    const previewButtonRule = hudSource.indexOf(
      '.admin-hud-editor-shared-surface .admin-request-form-button-preview .service-native-btn',
    );

    expect(compactButtonRule).toBeGreaterThanOrEqual(0);
    expect(previewButtonRule).toBeGreaterThan(compactButtonRule);
    expect(hudSource.slice(previewButtonRule, previewButtonRule + 650)).toContain('font-size: 1rem;');
    expect(hudSource.slice(previewButtonRule, previewButtonRule + 650)).toContain('min-height: 44px;');
  });
});
