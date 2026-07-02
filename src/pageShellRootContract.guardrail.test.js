import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('shared page-shell root contract', () => {
  it('keeps the shared ag-page-shell marker on Home and native content roots', () => {
    const homeSource = readSource('./pages/HomePage.jsx');
    const nativePageSource = readSource('./components/NativeContentPage.jsx');
    const nativeFunctionalSource = readSource('./components/nativeFunctionalRouteRenderers.jsx');

    expect(homeSource).toContain('className={`ag-page-shell home-native-page');
    expect(nativePageSource).toContain('className={`ag-page-shell service-native-page native-info-page');
    expect(nativeFunctionalSource).toContain('className={`ag-page-shell service-native-page native-info-page native-info-page--sitemap');
    expect(nativeFunctionalSource).toContain('className={`ag-page-shell service-native-page native-info-page${compactClass}${pageClass}${hasOpenHudPanel ? \' has-active-front-hud-panel\' : \'\'}');
    expect(nativeFunctionalSource).toContain('className={`ag-page-shell service-native-page native-info-page${compactClass}${pageClass}`');
  });

  it('uses the shared ag-page-shell marker for the mobile gutter helper', () => {
    const cssSource = readSource('./styles.css');

    expect(cssSource).toContain('@media (max-width: 860px) {');
    expect(cssSource).toContain('.ag-page-shell {');
    expect(cssSource).toContain('--ag-panel-effective-gutter: var(--ag-panel-mobile-gutter);');
    expect(cssSource).not.toContain(':is(.service-native-page, .rates-page, .native-info-page) {');
  });
});
