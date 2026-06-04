import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('ira rates sheet layout guardrail', () => {
  it('keeps the ira rates on the standardized rates-sheet shell with a table desktop view and mobile cards', () => {
    const componentSource = readSource('./IraRatesSheet.jsx');
    const cssSource = readSource('./IraRatesSheet.css');

    expect(componentSource).toContain('data-ira-rates-layout="table-and-cards"');
    expect(componentSource).toContain('data-ira-rates-desktop="table"');
    expect(componentSource).toContain('data-ira-rates-mobile="cards"');
    expect(componentSource).toContain('className="ira-rates-sheet__desktop-shell"');
    expect(componentSource).toContain('className="ira-rates-sheet__card-grid"');
    expect(componentSource).toContain('Investment Type');
    expect(componentSource).toContain('Rate');
    expect(componentSource).toContain('APY*');
    expect(cssSource).toContain('max-width: 50rem;');
    expect(cssSource).toContain('.ira-rates-sheet__desktop-shell {');
    expect(cssSource).toContain('.ira-rates-sheet__table thead th:nth-child(3),');
    expect(cssSource).toContain('background: rgba(var(--ag-color-atlantean-rgb), 0.075);');
    expect(cssSource).toContain('.ira-rates-sheet__card-grid {');
    expect(cssSource).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(cssSource).toContain('.ira-rates-sheet__card {');
    expect(cssSource).toContain('width: min(100%, 22rem);');
    expect(cssSource).toContain('@media (max-width: 720px) {');
    expect(cssSource).toContain('.ira-rates-sheet__mobile {');
    expect(cssSource).toContain('display: block;');
  });
});
