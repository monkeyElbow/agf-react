import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
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

    expect(mainSource).toContain("import './styles/admin.css';");
    [
      '.admin-content-page-wrap .search-page-input {',
      '.admin-content-page-wrap .page-shell {',
      '.admin-content-page-wrap .page-shell-body {',
      '.admin-content-page-wrap .page-shell-body h3 {',
      '.admin-content-page-wrap textarea {',
    ].forEach((selector) => {
      expect(adminSource).toContain(selector);
      expect(appSource).not.toContain(selector);
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
