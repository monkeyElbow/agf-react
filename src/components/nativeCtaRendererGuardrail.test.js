import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native CTA renderer guardrail', () => {
  it('keeps native CTA runtime sourced from the shared canonical builder and still renders form title/callout', () => {
    const source = readSource('./NativeContentPage.jsx');
    const runtimeSource = readSource('../lib/dynamicPageBlocks.js');

    expect(source).toContain('const runtime = buildDynamicCtaFormFromBlock(block);');
    expect(runtimeSource).toContain('export function buildDynamicCtaFormFromBlock');
    expect(runtimeSource).toContain('const configuredFields = buildDynamicCtaFieldsFromSource(settings, fallbackSettings);');
    expect(source).toContain('{config?.title ? <h5>{config.title}</h5> : null}');
    expect(source).toContain('{config?.subtitle ? <h6>{config.subtitle}</h6> : null}');
  });

  it('renders dynamic CTA blocks directly instead of targeting native sections', () => {
    const source = readSource('./NativeContentPage.jsx');
    const compositionSource = readSource('../lib/managedPageComposition.js');

    expect(source).toContain('function buildManagedBlockSection(block, {');
    expect(source).toContain("if (renderBlock.kind === 'cta_form') {");
    expect(source).toContain('buildDynamicCtaSection(renderBlock, pathname);');
    expect(compositionSource).toContain('const managedEntries = visibleBlocks');
    expect(compositionSource).toContain('buildSection(block, { pathname, isBlockOnlyManagedPage })');
    expect(source).not.toContain('const targetedDynamicCtaSections = new Map();');
    expect(source).not.toContain("const targetKey = String(mappedSection?.targetSectionKey || '').trim();");
    expect(source).not.toContain("targetedDynamicCtaSections.set(targetKey, { block, mappedSection });");
    expect(source).not.toContain('mappedFields');
    expect(source).not.toContain('normalizeTargetSectionKey(block?.settings?.targetSectionKey)');
  });

  it('keeps CTA sections out of the request shell and resolves the CTA form heading from CTA content', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('const isInlineCtaSection = isInlineCtaSectionShape(section);');
    expect(source).toContain('title: String(section.form.title || section.title || \'\').trim()');
    expect(source).toContain('subtitle: String(section.form.subtitle || section.subtitle || \'\').trim()');
    expect(source).toContain('const showSectionCopy = !section.hideCopy && (!isInlineCtaSection || !ctaPresentation.isExternalInlineReveal);');
    expect(source).toContain('&& (!isInlineCtaSection || !ctaPresentation.isExternalInlineReveal)');
    expect(source).toContain('const hasInlineCtaShell = isInlineCtaSection;');
  });

  it('keeps CTA sandstone heading support aligned between HUD preview and runtime CSS', () => {
    const cssSource = `${readSource('../styles/service-native.css')}\n${readSource('../styles/front-hud.css')}`;

    expect(cssSource).toContain('.admin-cta-hud-live-heading.is-sandstone,');
    expect(cssSource).toContain('.admin-cta-hud-live-heading mark.is-sandstone {');
    expect(cssSource).toContain('.service-native-section.native-dynamic-cta .native-info-section-copy > h2.is-sandstone,');
    expect(cssSource).toContain('.service-native-section.native-dynamic-cta .native-info-section-copy > h2 mark.is-sandstone,');
    expect(cssSource).toContain('.service-native-section.test-dynamic-cta .native-info-section-copy > h2.is-sandstone,');
    expect(cssSource).toContain('.service-native-section.test-dynamic-cta .native-info-section-copy > h2 mark.is-sandstone {');
  });

  it('keeps dynamic CTA blocks on a centered bordered form shell', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page .service-native-section.has-inline-cta-shell > .ag-panel-rail,');
    expect(cssSource).toContain('flex-direction: column;');
    expect(cssSource).toContain('align-items: center;');
    expect(cssSource).toContain('width: min(680px, 100%);');
    expect(cssSource).toContain('margin: clamp(1rem, 2vw, 1.5rem) 0 0;');
    expect(cssSource).toContain('border: 1px solid rgba(17, 53, 75, 0.14);');
  });
});
