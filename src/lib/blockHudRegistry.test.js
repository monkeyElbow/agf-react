import { describe, expect, it } from 'vitest';
import { buildHudPanelsFromBlocks, getBlockHudDefinition } from './blockHudRegistry';

describe('buildHudPanelsFromBlocks', () => {
  it('keeps only one HUD panel per block id', () => {
    const panels = buildHudPanelsFromBlocks([
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'intro', kind: 'intro', mode: 'dynamic' },
    ]);

    expect(panels.map((panel) => panel.blockId)).toEqual(['hero', 'intro']);
  });

  it('keeps distinct same-kind blocks on distinct HUD panels by default', () => {
    const panels = buildHudPanelsFromBlocks(
      [
        { id: 'columns_mha', kind: 'columns', mode: 'dynamic' },
        { id: 'columns_math', kind: 'columns', mode: 'dynamic' },
      ],
    );

    expect(panels.map((panel) => panel.blockId)).toEqual(['columns_mha', 'columns_math']);
    expect(panels.map((panel) => panel.id)).toEqual(['block:columns_mha', 'block:columns_math']);
  });

  it('ignores kind-wide panel-id overrides for non-singleton kinds', () => {
    const panels = buildHudPanelsFromBlocks(
      [
        { id: 'columns_mha', kind: 'columns', mode: 'dynamic' },
        { id: 'columns_math', kind: 'columns', mode: 'dynamic' },
      ],
      {
        panelIdByKind: {
          columns: 'shared-columns-panel',
        },
      },
    );

    expect(panels.map((panel) => panel.id)).toEqual(['block:columns_mha', 'block:columns_math']);
  });

  it('still allows singleton kinds to share an explicit kind-level panel id', () => {
    const panels = buildHudPanelsFromBlocks(
      [
        { id: 'hero_primary', kind: 'hero', mode: 'dynamic' },
        { id: 'hero_secondary', kind: 'hero', mode: 'dynamic' },
      ],
      {
        panelIdByKind: {
          hero: 'shared-hero-panel',
        },
      },
    );

    expect(panels).toHaveLength(1);
    expect(panels[0]?.id).toBe('shared-hero-panel');
    expect(panels[0]?.blockId).toBe('hero_primary');
  });

  it('keeps card-grid preset labels explicit in the HUD without creating pseudo-kinds', () => {
    expect(getBlockHudDefinition({
      id: 'investment_strategy_options',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'investment-options',
      templateId: 'investment_strategy_options',
    }).label).toBe('Card Grid · Investment options');
  });

  it('keeps cta-band preset labels explicit in the HUD without creating pseudo-kinds', () => {
    expect(getBlockHudDefinition({
      id: 'investor_cta',
      kind: 'cta_band',
      mode: 'dynamic',
      presetId: 'dashboard-login',
      templateId: 'investor_cta',
    }).label).toBe('CTA Band · Dashboard login');
  });

  it('keeps canonical generic columns labeled as one family with an explicit preset', () => {
    expect(getBlockHudDefinition({
      id: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      presetId: 'default',
      templateId: 'columns',
    }).label).toBe('Columns · Flexible columns');
  });

  it('keeps site-feature HUD labels sourced from the reviewed catalog entry', () => {
    expect(getBlockHudDefinition({
      id: 'site_feature',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'editorial_spotlight',
      },
    }).label).toBe('Site Feature · Editorial spotlight');
  });
});
