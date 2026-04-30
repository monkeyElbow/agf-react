import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native card family breakpoint guardrail', () => {
  it('keeps migrated native grid and columns families on the same scoped gap and breakpoint contract', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain('--native-card-family-gap: clamp(0.95rem, 2vw, 1.3rem);');
    expect(source).toContain('gap: var(--native-card-family-gap);');
    expect(source).toContain("@media (max-width: 980px) {");
    expect(source).toContain("@media (max-width: 760px) {");
    expect(source).toContain("--native-card-family-gap: clamp(0.9rem, 1.8vw, 1.15rem);");
    expect(source).toContain('--native-card-family-gap: 1rem;');
    expect(source).toContain('.service-native-section.native-dynamic-grid .service-native-grid,');
    expect(source).toContain('.native-info-page--test .service-native-section.test-dynamic-grid .service-native-grid,');
    expect(source).toContain('.native-columns-grid.is-three,');
    expect(source).toContain('.native-columns-grid.is-four {');
    expect(source).toContain('.native-columns-grid.is-two,');
  });
});
