import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native newsletter renderer guardrail', () => {
  it('keeps the shared dynamic newsletter builder in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');
    const compositionSource = readSource('../lib/managedPageComposition.js');

    expect(source).toContain('buildDynamicNewsletterFromBlock,');
    expect(source).toContain('import NewsletterSignupForm from \'./NewsletterSignupForm\';');
    expect(source).toContain('const runtime = buildDynamicNewsletterFromBlock(block);');
    expect(source).toContain("const sectionClassBase = pathname === '/test' ? 'test-dynamic-newsletter' : 'native-dynamic-newsletter';");
    expect(source).toContain('function buildManagedBlockSection(block, {');
    expect(source).toContain("if (renderBlock.kind === 'newsletter') {");
    expect(source).toContain('buildDynamicNewsletterSection(renderBlock, pathname);');
    expect(compositionSource).toContain('const managedEntries = visibleBlocks');
    expect(compositionSource).toContain('buildSection(block, { pathname, isBlockOnlyManagedPage })');
    expect(source).toContain('<NewsletterSignupForm className="is-native-newsletter" />');
  });

  it('keeps shared newsletter copy centering and lead-copy sizing in the native newsletter CSS', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section.native-dynamic-newsletter > .ag-panel-rail,');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);');
    expect(cssSource).toContain('align-items: center;');
    expect(cssSource).toContain('align-content: center;');
    expect(cssSource).toContain('.service-native-section.native-dynamic-newsletter .native-info-section-copy > p,');
    expect(cssSource).toContain('.service-native-section.native-dynamic-newsletter .native-info-section-copy .native-info-rich-html > p:first-child,');
    expect(cssSource).toContain('font-size: clamp(1.22rem, 2vw, 1.52rem);');
  });

  it('keeps the newsletter section HUD anchor in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('const showSectionHud = showFrontHud && Boolean(dynamicSectionPanel) && isDynamicSectionHudTarget;');
    expect(source).toContain('import FrontHudAnchorTag from \'./FrontHudAnchorTag\';');
    expect(source).toContain('<FrontHudAnchorTag');
    expect(source).toContain("label={dynamicSectionPanel?.label || ''}");
    expect(source).toContain("onClick={() => toggleHudPanel(dynamicSectionHudPanelId, { scrollToTarget: true })}");
  });
});
