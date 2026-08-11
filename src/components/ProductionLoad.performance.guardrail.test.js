import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('production load stability contracts', () => {
  it('keeps lazy-route fallback content out of the footer viewport', () => {
    const cssSource = readSource('../styles.css');
    expect(cssSource).toContain('.route-page-loading {');
    expect(cssSource).toContain('min-height: 100svh;');
    expect(cssSource).toContain('contain: layout paint;');
  });

  it('keeps the full admin provider activation-driven', () => {
    const providerSource = readSource('../context/FastContentAdminProvider.jsx');
    expect(providerSource).toContain("if (!shouldLoadHeavy) {");
    expect(providerSource).toContain('if (shouldLoadHeavy || !import.meta.env.DEV');
    expect(providerSource).toContain('activateAdminProvider');
    expect(providerSource).toContain("import('./ContentAdminContext')");
  });

  it('keeps the Home hero visible in the first useful render', () => {
    const homeSource = readSource('../pages/HomePage.jsx');
    expect(homeSource).toContain('const HOME_HERO_TEMPORARILY_HIDDEN = false;');
  });

  it('loads Typekit without making the application stylesheet import it synchronously', () => {
    const appStyles = readSource('../styles.css');
    const indexHtml = readSource('../../index.html');
    expect(appStyles).not.toContain("@import url('https://use.typekit.net/nmy3epc.css');");
    expect(indexHtml).toContain('media="print"');
    expect(indexHtml).toContain('https://use.typekit.net/nmy3epc.css');
  });

  it('keeps Home return-assist resources behind the explicit return-assist boundary', () => {
    const homeSource = readSource('../pages/HomePage.jsx');
    const returnAssistSource = readSource('../components/HomeReturnAssist.jsx');
    expect(homeSource).not.toContain("from '../context/ResourcesContext'");
    expect(homeSource).not.toContain("from '../components/SiteSearchPanel'");
    expect(homeSource).toContain("import('../components/HomeReturnAssist')");
    expect(returnAssistSource).toContain("from '../context/ResourcesContext'");
  });

  it('keeps HUD presentation CSS behind HUD activation', () => {
    const homeSource = readSource('../pages/HomePage.jsx');
    const workflowSource = readSource('../components/FrontHudPageWorkflow.jsx');
    const serviceCss = readSource('../styles/service-native.css');
    const hudCss = readSource('../styles/front-hud.css');
    expect(homeSource).not.toContain("from '../components/FrontHudPageWorkflow'");
    expect(homeSource).not.toContain("from '../components/FrontHudPanelShell'");
    expect(workflowSource).toContain("import '../styles/front-hud.css'");
    expect(serviceCss).not.toContain('.admin-front-hud-layer');
    expect(hudCss).toContain('.admin-front-hud-layer');
  });

  it('keeps the managed login link named when editable copy is blank', () => {
    const rendererSource = readSource('./blocks/PageBlocksRenderer.jsx');
    const layoutSource = readSource('./SiteLayout.jsx');
    expect(rendererSource).toContain("const loginLabel = String(runtime.loginLabel || '').trim() || 'Secure Login';");
    expect(layoutSource).toContain('aria-label="Secure Login"');
  });
});
