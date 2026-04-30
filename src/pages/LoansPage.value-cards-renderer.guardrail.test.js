import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('loans value cards renderer guardrail', () => {
  it('routes the value-cards preset through the canonical columns renderer instead of a bespoke loans-only grid', () => {
    const source = readSource('./LoansPage.jsx');

    expect(source).toContain("import { ColumnsBlock } from '../components/blocks/PageBlocksRenderer';");
    expect(source).toContain('<ColumnsBlock');
    expect(source).toContain("block={renderedValueCardsBlock}");
    expect(source).toContain("sectionId=\"theresmore\"");
    expect(source).toContain("extraSectionClassName={`loans-native-more${getHudBlockStateClassName('value_cards')}`}");
    expect(source).not.toContain('buildLoanValueCardsConfigFromBlock');
    expect(source).not.toContain('loans-native-more-grid');
    expect(source).not.toContain('loans-native-more-card');
  });
});
