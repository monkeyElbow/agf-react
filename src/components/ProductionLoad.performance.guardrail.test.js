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

  it('keeps editor chrome out of public route chunks until HUD activation', () => {
    const publicRouteSources = [
      readSource('../pages/LoansPage.jsx'),
      readSource('../pages/RetirementPage.jsx'),
      readSource('../pages/RatesPage.jsx'),
      readSource('../pages/ServicesPage.jsx'),
      readSource('../pages/InvestmentsPage.jsx'),
      readSource('../components/NativeContentPage.jsx'),
    ];

    publicRouteSources.forEach((source) => {
      expect(source).not.toMatch(/from ['"].*\/BlockHudPanelHost['"];/);
      expect(source).not.toMatch(/from ['"].*\/FrontHudPanelShell['"];/);
      expect(source).not.toMatch(/from ['"].*\/FrontHudPageWorkflow['"];/);
      expect(source).not.toMatch(/from ['"].*\/FrontHudStructureControls['"];/);
      expect(source).not.toMatch(/from ['"].*\/resourceArticles['"];/);
    });

    expect(readSource('../components/BlockHudPanelHostLoader.jsx')).toContain('preloadFrontHudChrome');
    expect(readSource('../components/NativeContentPage.jsx')).not.toContain("from './HeroHudEditorShared';");
    expect(readSource('../pages/RetirementPage.jsx')).not.toContain("from '../components/HeroHudEditorShared';");
  });

  it('keeps route-specific data providers out of the global public provider tree', () => {
    const mainSource = readSource('../main.jsx');
    const appSource = readSource('../App.jsx');

    ['ConsultantsProvider', 'ConsultantResponsesProvider', 'CareersJobsProvider'].forEach((providerName) => {
      expect(mainSource).not.toContain(providerName);
      expect(appSource).toContain(`Lazy${providerName}`);
    });
    expect(appSource).toContain("routeKey === '/about-us/careers'");
  });

  it('keeps the shared renderer synchronous for content-bearing blocks', () => {
    const rendererSource = readSource('../components/blocks/PageBlocksRenderer.jsx');

    expect(rendererSource).toContain("import HomeImpactStoryFeature, { HomeImpactStoryStaticContent } from '../HomeImpactStoryFeature';");
    expect(rendererSource).toContain("import DynamicRequestFormSection from '../DynamicRequestFormSection';");
    expect(rendererSource).toContain("import HomeServicesFeatureAnimation from '../HomeServicesFeatureAnimation';");
    expect(rendererSource).not.toContain('Suspense');
  });

  it('keeps the development content authority client out of production startup', () => {
    const source = readSource('../context/FastContentAdminProvider.jsx');
    const runtimeSource = readSource('../lib/devContentAuthorityRuntime.js');
    const publicContextSources = [
      readSource('../context/AnnouncementContext.jsx'),
      readSource('../context/DisclosuresContext.jsx'),
      readSource('../context/RatesContext.jsx'),
    ];

    expect(source).not.toContain("from '../lib/devContentAuthorityClient'");
    expect(source).toContain("from '../lib/devContentAuthorityRuntime'");
    expect(runtimeSource).toContain("import('./devContentAuthorityClient')");
    expect(runtimeSource).toContain('if (!import.meta.env.DEV)');
    expect(runtimeSource).toContain("import.meta.env.MODE !== 'test'");
    publicContextSources.forEach((contextSource) => {
      expect(contextSource).not.toContain("from '../lib/devContentAuthorityClient'");
      expect(contextSource).toContain("from '../lib/devContentAuthorityRuntime'");
    });
    expect(source).toContain('if (shouldLoadHeavy || !import.meta.env.DEV || typeof window === \'undefined\')');
  });

  it('keeps Home from importing the full service stylesheet', () => {
    const homeSheet = readSource('../styles/home-service-public.css');
    const appStyles = readSource('../styles.css');
    const homeSource = readSource('../pages/HomePage.jsx');

    expect(homeSheet).not.toContain("@import './service-native.css';");
    expect(homeSheet.length).toBeLessThan(250_000);
    expect(appStyles).not.toContain("@import './styles/home-native.css';");
    expect(homeSource).toContain("import '../styles/home-native.css';");
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

  it('keeps calculator-only CSS out of ordinary service route styles', () => {
    const serviceCss = readSource('../styles/service-native.css');
    const calculatorCss = readSource('../styles/service-native-calculators.css');
    const nativePageSource = readSource('./NativeContentPage.jsx');

    expect(serviceCss).not.toContain('.calculators-native-collection');
    expect(calculatorCss).toContain('.calculators-native-collection');
    expect(nativePageSource).toContain("import('./CalculatorRouteStyles')");
    expect(nativePageSource).toContain('isCalculatorRoutePath(templatePath)');
  });

  it('keeps functional calculator CSS on the routes that own the widgets', () => {
    const serviceCss = readSource('../styles/service-native.css');
    const functionalCss = readSource('../styles/service-native-functional-tools.css');
    const calculatorFoundationCss = readSource('../styles/calculator-foundation.css');
    const calculatorRouteStyles = readSource('./CalculatorRouteStyles.jsx');
    const loansSource = readSource('../pages/LoansPage.jsx');
    const retirementSource = readSource('../pages/RetirementPage.jsx');

    expect(serviceCss).not.toContain('.native-financial-tool {');
    expect(serviceCss).not.toContain('.financial-tool-groups-grid {');
    expect(serviceCss).not.toContain('.retirement-calc-section {');
    expect(serviceCss).not.toContain('.retirement-calc-title {');
    expect(functionalCss).toContain('.native-financial-tool {');
    expect(functionalCss).toContain('.financial-tool-groups-grid {');
    expect(functionalCss).toContain('.retirement-calc-section {');
    expect(functionalCss).toContain('.retirement-calc-grid {');
    expect(functionalCss).toContain('.retirement-lead-form {');
    expect(calculatorFoundationCss).toContain('.calculator-surface {');
    expect(calculatorRouteStyles).toContain("import '../styles/service-native-functional-tools.css';");
    expect(loansSource).toContain("import '../styles/service-native-functional-tools.css';");
    expect(retirementSource).toContain("import '../styles/service-native-functional-tools.css';");
  });

  it('keeps the investment ladder route-owned while sharing calculator surface treatment', () => {
    const serviceCss = readSource('../styles/service-native.css');
    const calculatorFoundationCss = readSource('../styles/calculator-foundation.css');
    const ladderCss = readSource('../styles/investments-native-ladder.css');
    const investmentsSource = readSource('../pages/InvestmentsPage.jsx');

    expect(serviceCss).not.toContain('.investments-native-ladder-box {');
    expect(ladderCss).toContain('.investments-native-ladder-box {');
    expect(ladderCss).toContain('@media (max-width: 420px)');
    expect(investmentsSource).toContain("import '../styles/investments-native-ladder.css';");
    expect(investmentsSource).toContain('className="investments-native-ladder-box calculator-surface fade-up"');
    expect(calculatorFoundationCss).toContain('.calculator-surface {');
  });

  it('keeps the managed login link named when editable copy is blank', () => {
    const rendererSource = readSource('./blocks/PageBlocksRenderer.jsx');
    const layoutSource = readSource('./SiteLayout.jsx');
    expect(rendererSource).toContain("const loginLabel = String(runtime.loginLabel || '').trim() || 'Secure Login';");
    expect(layoutSource).toContain('aria-label="Secure Login"');
  });
});
