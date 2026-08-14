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

  it('can keep hidden dynamic blocks available to the HUD without changing the default', () => {
    const blocks = [
      { id: 'hero', kind: 'hero', mode: 'dynamic', hidden: true },
      { id: 'intro', kind: 'intro', mode: 'dynamic', hidden: false },
    ];

    expect(buildHudPanelsFromBlocks(blocks).map((panel) => panel.blockId)).toEqual(['intro']);
    expect(buildHudPanelsFromBlocks(blocks, { includeHidden: true }).map((panel) => panel.blockId)).toEqual(['hero', 'intro']);
    expect(buildHudPanelsFromBlocks(blocks, { includeHidden: true })[0].isHidden).toBe(true);
  });

  it('keeps distinct same-kind blocks on distinct HUD panels by default', () => {
    const panels = buildHudPanelsFromBlocks(
      [
        { id: 'home_ministry_allies', kind: 'billboard', mode: 'dynamic' },
        { id: 'home_do_the_math', kind: 'billboard', mode: 'dynamic' },
      ],
    );

    expect(panels.map((panel) => panel.blockId)).toEqual(['home_ministry_allies', 'home_do_the_math']);
    expect(panels.map((panel) => panel.id)).toEqual(['block:home_ministry_allies', 'block:home_do_the_math']);
  });

  it('ignores kind-wide panel-id overrides for non-singleton kinds', () => {
    const panels = buildHudPanelsFromBlocks(
      [
        { id: 'home_ministry_allies', kind: 'billboard', mode: 'dynamic' },
        { id: 'home_do_the_math', kind: 'billboard', mode: 'dynamic' },
      ],
      {
        panelIdByKind: {
          billboard: 'shared-billboard-panel',
        },
      },
    );

    expect(panels.map((panel) => panel.id)).toEqual(['block:home_ministry_allies', 'block:home_do_the_math']);
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
      templateId: 'card_grid',
    }).label).toBe('Card Grid · Investment options');
  });

  it('keeps dashboard login on the Billboard family without creating a pseudo-kind', () => {
    expect(getBlockHudDefinition({
      id: 'dashboard_login_cta',
      kind: 'billboard',
      mode: 'dynamic',
      presetId: 'dashboard-login',
      templateId: 'billboard',
    }).label).toBe('Billboard · Dashboard login');
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

  it('keeps the canonical home do-the-math billboard labeled explicitly in the HUD', () => {
    expect(getBlockHudDefinition({
      id: 'home_do_the_math',
      kind: 'billboard',
      mode: 'dynamic',
    })).toMatchObject({
      label: 'Do the Math',
      editorType: 'billboard',
    });
  });

  it('keeps the block kind label first when an admin nickname is present', () => {
    expect(getBlockHudDefinition({
      id: 'pricing_billboard',
      kind: 'billboard',
      mode: 'dynamic',
      adminName: 'Pricing',
    }).label).toBe('Billboard - Pricing');
  });

  it('uses the billboard editor contract for home ministry allies while keeping the explicit label', () => {
    expect(getBlockHudDefinition({
      id: 'home_ministry_allies',
      kind: 'billboard',
      mode: 'dynamic',
    })).toMatchObject({
      label: 'Housing',
      editorType: 'billboard',
    });
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
