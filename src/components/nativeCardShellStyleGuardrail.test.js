import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native card shell style guardrail', () => {
  it('keeps shared migrated card-shell spacing tokens aligned between grid and columns families', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain('.service-native-section.native-dynamic-grid,');
    expect(source).toContain('.service-native-section.native-dynamic-columns,');
    expect(source).toContain('--native-card-shell-radius: 14px;');
    expect(source).toContain('--native-card-shell-padding: clamp(1.05rem, 2.2vw, 1.45rem);');
    expect(source).toContain('--native-card-shell-title-gap: 0.62rem;');
    expect(source).toContain('--native-card-shell-action-gap: 1rem;');
    expect(source).toContain('padding: var(--dynamic-grid-card-padding, var(--native-card-shell-padding));');
    expect(source).toContain('border-radius: var(--native-card-shell-radius);');
    expect(source).toContain('margin: 0 0 var(--native-card-shell-title-gap);');
    expect(source).toContain('padding-bottom: var(--native-card-shell-title-padding);');
    expect(source).toContain('padding-top: var(--native-card-shell-action-gap);');
    expect(source).toContain('.native-columns-copy .service-native-action-row {');
    expect(source).toContain('margin-top: var(--native-card-shell-action-gap);');
  });
});
