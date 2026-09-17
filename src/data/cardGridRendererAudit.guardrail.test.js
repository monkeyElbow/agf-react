import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildDynamicGridFromBlock } from '../lib/dynamicPageBlocks';

const root = path.resolve(__dirname, '..', '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Card Grid renderer convergence guardrails', () => {
  it('keeps custom page renderers on the canonical Card Grid runtime contract', () => {
    expect(read('src/pages/InvestmentsPage.jsx')).toContain('buildCanonicalBlockRuntime(certificatesBlock || DEFAULT_CERTIFICATES_BLOCK)');
    expect(read('src/pages/ServicesPage.jsx')).toContain('buildCanonicalBlockRuntime(block)');
    expect(read('src/pages/LoansPage.jsx')).toContain("'--dynamic-grid-card-gap': `${loanOptionsGrid.cardGapRem}rem`");
    expect(read('src/pages/ServicesPage.jsx')).toContain("'--dynamic-grid-card-title-justify': servicesBreakdownRuntime.cardTitleJustify");
    expect(read('src/pages/ServicesPage.jsx')).toContain("textAlign: servicesBreakdownRuntime.cardTitleJustify || 'left'");
    expect(read('src/components/NativeContentPage.jsx')).toContain('textAlign: section.cardTitleJustify || undefined');
    expect(read('src/components/blocks/DynamicCardGridSection.jsx')).toContain('textAlign: runtime.cardTitleJustify || undefined');
    expect(read('src/components/blocks/DynamicCardGridSection.jsx')).toContain('buildCanonicalBlockRuntime(block)');
  });

  it('does not allow an authored card grid count or preset to be ignored', () => {
    const block = {
      id: 'audit-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'investment-options',
      settings: {
        columns: 'four',
        cardCount: '2',
        card1Title: 'One',
        card1Body: 'First',
        card2Title: 'Two',
        card2Body: 'Second',
        card3Title: 'Three',
        card3Body: 'Third',
      },
    };
    const runtime = buildDynamicGridFromBlock(block);
    expect(runtime.columns).toBe('one');
    expect(runtime.cardCount).toBe(2);
    expect(runtime.cards).toHaveLength(3);
    expect(read('src/components/blocks/DynamicCardGridSection.jsx')).toContain('cards.filter((card) => Number(card.slot) <= Number(runtime.cardCount))');
  });

  it('keeps previously dead seeded surfaces attached to public rendering', () => {
    expect(read('src/pages/ResourcesPage.jsx')).toContain("block?.id === 'featured_resources'");
    expect(read('src/pages/ResourcesPage.jsx')).toContain('<DynamicCardGridSection');
    expect(read('src/App.jsx')).not.toContain("if (routeKey === '/yourplan')");
    expect(read('src/styles/service-native.css')).toContain('.native-info-page--careers .careers-native-benefits {');
    expect(read('src/styles/service-native.css')).toContain('overflow: clip;');
  });
});
