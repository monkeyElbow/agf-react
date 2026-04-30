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

  it('preserves native CTA form title, subtitle, and missing trailing fields when a dynamic CTA targets a native section', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('const targetedDynamicCtaSections = new Map();');
    expect(source).toContain("const targetKey = String(mappedSection?.targetSectionKey || '').trim();");
    expect(source).toContain("targetedDynamicCtaSections.set(targetKey, { block, mappedSection });");
    expect(source).toContain('const mergedFormFields = mappedFields.length');
    expect(source).toContain("const baseSectionIsCtaShell = String(section?.className || '').includes('cta');");
    expect(source).toContain("title: String(mappedForm.title || fallbackFormTitle || '').trim()");
    expect(source).toContain("subtitle: String(mappedForm.subtitle || fallbackFormSubtitle || '').trim()");
    expect(source).toContain('...baseFields.slice(mappedFields.length)');
    expect(source).not.toContain('normalizeTargetSectionKey(block?.settings?.targetSectionKey)');
  });

  it('keeps CTA sections out of the request shell and resolves the CTA form heading from CTA content', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('const isInlineCtaSection = Boolean(');
    expect(source).toContain('title: String(section.form.title || section.title || \'\').trim()');
    expect(source).toContain('subtitle: String(section.form.subtitle || section.subtitle || \'\').trim()');
    expect(source).toContain('const showSectionCopy = !section.hideCopy && !isInlineCtaSection;');
    expect(source).toContain('&& !isInlineCtaSection');
    expect(source).toContain('const hasInlineCtaShell = isInlineCtaSection;');
  });

  it('keeps CTA sandstone heading support aligned between HUD preview and runtime CSS', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.admin-cta-hud-live-heading.is-sandstone,');
    expect(cssSource).toContain('.admin-cta-hud-live-heading mark.is-sandstone {');
    expect(cssSource).toContain('.service-native-section.native-dynamic-cta .native-info-section-copy > h2.is-sandstone,');
    expect(cssSource).toContain('.service-native-section.native-dynamic-cta .native-info-section-copy > h2 mark.is-sandstone,');
    expect(cssSource).toContain('.native-info-page--test .service-native-section.test-dynamic-cta .native-info-section-copy > h2.is-sandstone,');
    expect(cssSource).toContain('.native-info-page--test .service-native-section.test-dynamic-cta .native-info-section-copy > h2 mark.is-sandstone {');
  });
});
