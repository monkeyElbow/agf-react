import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native logo renderer guardrail', () => {
  it('supports component-based section and feature logos in the native page renderer', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("const SectionLogoComponent = typeof section.logoComponent === 'function' ? section.logoComponent : null;");
    expect(source).toContain("const FeatureLogoComponent = typeof feature.logoComponent === 'function' ? feature.logoComponent : null;");
    expect(source).toContain('<FeatureLogoComponent');
    expect(source).toContain('<SectionLogoComponent');
  });
});
