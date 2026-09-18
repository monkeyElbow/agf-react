import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';

describe('retirement rollovers step-card seed contract', () => {
  it('keeps the rollover form action in step 1 and the mailing address in step 2', () => {
    const processBlock = (contentBlockBlueprintsByPath['/services/retirement/rollovers'] || [])
      .find((block) => block?.id === 'rollover_process');
    const settings = processBlock?.settings || {};

    expect(processBlock).toMatchObject({ kind: 'card_grid', presetId: 'step-cards' });
    expect(settings.card1ButtonLabel).toBe('Rollover/Transfer Form');
    expect(settings.card1ButtonDocumentId).toBe('document-retirement-rollover-transfer-form');
    expect(settings.card2Body).toContain('AGFinancial');
    expect(settings.card2Body).toContain('PO Box 2515');
    expect(settings.card2CopyLabel).toBe('Copy mailing address');
    expect(settings.card2CopyText).toBe('AGFinancial\nPO Box 2515\nSpringfield MO 65801');
    expect(settings.buttonLabel || '').toBe('');
    expect(settings.addressLines || '').toBe('');
  });
});
