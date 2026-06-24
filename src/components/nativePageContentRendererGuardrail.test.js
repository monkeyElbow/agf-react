import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native page content renderer guardrail', () => {
  it('keeps the shared dynamic page content builder in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicPageContentFromBlock,');
    expect(source).toContain('const runtime = buildDynamicPageContentFromBlock(block);');
    expect(source).toContain("className: pathname === '/test' ? 'test-dynamic-page-content' : 'native-dynamic-page-content'");
    expect(source).toContain('const pageContentSection = buildDynamicPageContentSection(block, activePath);');
    expect(source).toContain("if (block.mode === 'dynamic' && block.kind === 'content') {");
    expect(source).toContain("const dynamicSectionPanel = dynamicSectionBlockId ? (hudPanelByBlockId[dynamicSectionBlockId] || null) : null;");
    expect(source).not.toContain("if (block.id === 'page_content') {");
  });

  it('keeps site features on the shared dynamic section path instead of bespoke page ownership', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicSiteFeatureFromBlock,');
    expect(source).toContain('const runtime = buildDynamicSiteFeatureFromBlock(block);');
    expect(source).toContain("className: pathname === '/test' ? 'test-dynamic-site-feature' : 'native-dynamic-site-feature'");
    expect(source).toContain('const siteFeatureSection = buildDynamicSiteFeatureSection(block, activePath);');
    expect(source).toContain("if (block.mode === 'dynamic' && block.kind === 'site_feature') {");
  });

  it('keeps feature panels on the shared dynamic section path so native pages can target legacy shells without bespoke route code', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicFeaturePanelFromBlock,');
    expect(source).toContain('const runtime = buildDynamicFeaturePanelFromBlock(block);');
    expect(source).toContain("className: pathname === '/test' ? 'test-dynamic-feature-panel' : 'native-dynamic-feature-panel'");
    expect(source).toContain('const mappedSection = buildDynamicFeaturePanelSection(block, activePath);');
    expect(source).toContain('const featurePanelSection = buildDynamicFeaturePanelSection(block, activePath);');
    expect(source).toContain("if (block.mode === 'dynamic' && block.kind === 'feature_panel') {");
  });

  it('does not keep a dormant loans legacy bridge in the native page renderer once the custom loans route owns that page', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).not.toContain("import InvestmentsPage from '../pages/InvestmentsPage';");
    expect(source).not.toContain("import LoansPage from '../pages/LoansPage';");
    expect(source).not.toContain("import RetirementPage from '../pages/RetirementPage';");
    expect(source).not.toContain("section?.widget === 'loans-legacy-sections'");
    expect(source).not.toContain('loans-legacy');
  });

  it('keeps live child-route composition on named helpers instead of ad hoc inline 403(b) replacement logic', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("composeRetirement403bSections,");
    expect(source).toContain("composeConsultantSections,");
    expect(source).toContain('const retirement403bComposition = composeRetirement403bSections({');
    expect(source).toContain('let nextSections = composeConsultantSections({');
    expect(source).not.toContain("dynamicSections.find((section) => section?.blockId === 'investment_strategy_heading')");
    expect(source).not.toContain("dynamicSections.find((section) => section?.blockId === 'investment_strategy_options')");
    expect(source).not.toContain("dynamicSections.find((section) => section?.blockId === 'who_qualifies')");
  });

  it('delegates active functional native routes to extracted renderers instead of keeping inline route mini-apps in NativeContentPage', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("} from './nativeFunctionalRouteRenderers';");
    expect(source).toContain('<NativeSitemapRouteRenderer');
    expect(source).toContain('<NativeProspectusRouteRenderer');
    expect(source).toContain('<NativeFormsRouteRenderer');
    expect(source).not.toContain('function SitemapSection() {');
    expect(source).not.toContain('function ProspectusSection({ content }) {');
    expect(source).not.toContain('function FormsLibrarySection({ content }) {');
    expect(source).not.toContain('native-functional-page-head--sitemap');
    expect(source).not.toContain('native-functional-page-head--prospectus');
    expect(source).not.toContain('native-functional-page-head--forms');
  });

  it('delegates careers route shaping and jobs-list rendering to extracted helpers instead of keeping an inline careers mini-app in NativeContentPage', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildCareersRouteSections,');
    expect(source).toContain('isNativeCareersJobsSection,');
    expect(source).toContain('NativeCareersJobsSection,');
    expect(source).toContain('nextSections = buildCareersRouteSections({');
    expect(source).toContain('{isNativeCareersJobsSection(section) ? <NativeCareersJobsSection jobs={section.jobs} /> : null}');
    expect(source).not.toContain("getVisibleJobs().map((job) => ({");
    expect(source).not.toContain("if (section.className !== 'careers-native-jobs-list') {");
    expect(source).not.toContain('careers-native-jobs-list-wrap');
    expect(source).not.toContain('There are currently no open positions to display.');
  });

  it('keeps the remaining NativeContentPage ownership boundary explicit: delegated functional routes, delegated child-route composition, and only named inline path exceptions', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("const resolvedPagePath = String(activePath || templatePath || '/').trim() || '/';");
    expect(source).toContain("const isTestPage = templatePath === '/test';");
    expect(source).toContain("const isLegacyGivingPage = resolvedPagePath === '/services/planned-giving';");
    expect(source).toContain("const testimonialsHudDefaultTag = isLegacyGivingPage ? 'legacy-giving' : '';");
    expect(source).toContain("const retirement403bComposition = composeRetirement403bSections({");
    expect(source).toContain('let nextSections = composeConsultantSections({');
    expect(source).toContain('nextSections = buildCareersRouteSections({');
    expect(source).toContain("if (templatePath === '/sitemap') {");
    expect(source).toContain("if (templatePath === '/prospectus') {");
    expect(source).toContain("if (templatePath === '/forms') {");
    expect(source).not.toContain("templatePath === '/about-us/careers'");
    expect(source).not.toContain("templatePath === '/services/retirement/403b'");
    expect(source).not.toContain("templatePath === '/services/retirement/retirement-consultants'");
  });
});
