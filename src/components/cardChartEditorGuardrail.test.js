import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('Card Chart editor contracts', () => {
  it('keeps the visible heading preview and transparent input on one typography and padding contract', () => {
    const source = readSource('../styles/admin.css');

    expect(source).toContain('.admin-color-text-editor.is-card-chart-heading');
    expect(source).toContain('font-size: 1.5rem;');
    expect(source).toContain('line-height: 1.75;');
    expect(source).toContain('padding: 1rem 0.65rem 0.55rem;');
  });

  it('keeps Card Chart selected heading ranges mapped to their semantic render colors', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain('> h2 mark.is-atlantean');
    expect(source).toContain('> h2 mark.is-mango');
    expect(source).toContain('> h2 mark.is-melon');
    expect(source).toContain('color: var(--ag-color-melon);');
  });
});
