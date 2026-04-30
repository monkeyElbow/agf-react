import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('page article feature link guardrails', () => {
  it('keeps the investments cash reserves feature tied to the seeded article helper', () => {
    const source = readSource('./InvestmentsPage.jsx');

    expect(source).toContain("slug: 'church-cash-reserves'");
    expect(source).toContain('CHURCH_CASH_RESERVES_ARTICLE_FEATURE.to');
    expect(source).toContain('featurePanelRuntime.imageUrl');
  });

  it('keeps the loans tariffs feature tied to the seeded article helper', () => {
    const source = readSource('./LoansPage.jsx');

    expect(source).toContain("slug: 'tariffs-timing-truth-keep-building-through-the-chaos'");
    expect(source).toContain('LOANS_TARIFFS_ARTICLE_FEATURE.to');
    expect(source).toContain('LOANS_TARIFFS_ARTICLE_FEATURE.image');
  });

  it('keeps the retirement top-3 feature tied to the seeded article helper', () => {
    const source = readSource('./RetirementPage.jsx');

    expect(source).toContain("slug: 'top-3-investing-mistakes-to-avoid'");
    expect(source).toContain('RETIREMENT_TOP_3_ARTICLE_FEATURE.to');
    expect(source).toContain('RETIREMENT_TOP_3_ARTICLE_FEATURE.image');
  });
});
