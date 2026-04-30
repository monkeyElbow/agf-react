import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native testimonials renderer guardrail', () => {
  it('keeps the shared dynamic testimonials builder in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicTestimonialsFromBlock,');
    expect(source).toContain('const runtime = buildDynamicTestimonialsFromBlock(block, {');
    expect(source).toContain("const sectionClassBase = pathname === '/test' ? 'test-dynamic-testimonials' : 'native-dynamic-testimonials';");
    expect(source).toContain('const testimonialsSection = buildDynamicTestimonialsSection(block, activePath, testimonialsLibrary);');
    expect(source).toContain('const targetedDynamicTestimonialsSections = new Map();');
    expect(source).toContain('const targetedDynamicTestimonialsFineprintSections = new Map();');
    expect(source).toContain("const targetKey = String(mappedSection?.targetSectionKey || '').trim();");
    expect(source).toContain("const fineprintTargetKey = String(mappedSection?.targetFineprintSectionKey || '').trim();");
    expect(source).not.toContain('normalizeTargetSectionKey(block?.settings?.targetFineprintSectionKey)');
  });
});
