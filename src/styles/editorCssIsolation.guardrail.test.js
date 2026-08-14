import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const FRONT_HUD_PAGE_FILES = [
  '../pages/HomePage.jsx',
  '../pages/LoansPage.jsx',
  '../pages/ServicesPage.jsx',
  '../pages/RetirementPage.jsx',
  '../pages/RatesPage.jsx',
  '../pages/InvestmentsPage.jsx',
];

describe('editor CSS isolation', () => {
  it('keeps the first extracted admin shell rules out of the public stylesheet', () => {
    const appSource = readSource('../styles.css');
    const adminSource = readSource('./admin.css');
    const mainSource = readSource('../main.jsx');

    expect(mainSource).not.toContain("import './styles/admin.css';");
    expect(readSource('../context/FastContentAdminProvider.jsx')).toContain("import('../styles/admin.css')");
    [
      '.admin-content-page-wrap .search-page-input {',
      '.admin-content-page-wrap .page-shell {',
      '.admin-content-page-wrap .page-shell-body {',
      '.admin-content-page-wrap .page-shell-body h3 {',
      '.admin-content-page-wrap textarea {',
      '.admin-content-width-overlay {',
      '.admin-dev-identity-badge {',
      '.admin-page-save-bar {',
      '.admin-page-history-drawer {',
      '.admin-consultant-responses-head {',
      '.admin-breadcrumb-preview {',
      '.admin-block-audit-toolbar {',
      '.admin-content-top-actions {',
      '.admin-documents-table-scroll {',
      '.admin-jobs-list {',
      '.admin-resources-toolbar {',
      '.admin-testimonials-workbench {',
      '.admin-testimonials-library-panel {',
      '.admin-disclosures-empty-editor {',
      '.admin-swatch-list {',
      '.admin-swatch-option {',
      '.admin-swatch-chip {',
      '.admin-bg-swatch-option {',
      '.admin-highlight-list-editor {',
      '.admin-highlight-swatch-btn {',
      '.admin-content-field-list {',
      '.admin-hero-editor {',
      '.admin-boolean-pill {',
      '.admin-route-link-control {',
      '.admin-page-save-bar-disabled-action {',
      '.admin-table-select-wrap {',
      '.admin-table-select {',
      '.admin-block-visibility-btn {',
      '.admin-rates-lower-grid {',
      '.admin-rates-chart-panel {',
      '.admin-rates-chart-table {',
      '.admin-hero-color-row {',
      '.admin-hero-preview {',
      '.admin-hero-preview-stage {',
      '.admin-html-editor {',
      '.admin-swatch-row {',
      '.admin-message-preview {',
      '.admin-block-selected-row {',
      '.admin-block-insert-row {',
      '.admin-content-section .data-table {',
      '.admin-hero-inline-controls input,',
      '.admin-hero-inline-stage {',
      '.admin-hero-inline-toolbar {',
      '.admin-content-page-wrap .admin-top-strip-hud-editor {',
      '.admin-request-form-primary-grid {',
      '.admin-color-text-editor {',
      '.admin-testimonials-editor {',
      '.admin-content-grid-two,',
      '.admin-message-grid {',
    ].forEach((selector) => {
      expect(adminSource).toContain(selector);
      expect(appSource).not.toMatch(new RegExp(`^[ \\t]*${escapeRegExp(selector)}[ \\t]*$`, 'm'));
    });
  });

  it('requires every front HUD page to declare the HUD migration root', () => {
    const hudSource = readSource('./front-hud.css');

    expect(hudSource).toContain('browser compatibility');
    FRONT_HUD_PAGE_FILES.forEach((pageFile) => {
      expect(readSource(pageFile)).toContain('admin-front-hud-scope');
    });
  });
});
