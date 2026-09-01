import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
import { buildNativeHudPanels } from './nativeHudPanels';

describe('buildNativeHudPanels', () => {
  it('orders native HUD panels to match the visible block order on the test route', () => {
    const testBlocks = (contentBlockBlueprintsByPath['/test'] || [])
      .filter((block) => block?.mode === 'dynamic');
    const panels = buildNativeHudPanels({ blocks: testBlocks });

    expect(panels.map((panel) => panel.block.id)).toEqual([
      'hero',
      'intro',
      'billboard',
      'card_grid',
      'cta_form',
      'columns',
    ]);
  });

  it('keeps the /test dynamic columns block in the native HUD dock', () => {
    const testColumnsBlock = (contentBlockBlueprintsByPath['/test'] || [])
      .find((block) => block?.id === 'columns' && block?.mode === 'dynamic');

    const panels = buildNativeHudPanels({
      blocks: [testColumnsBlock],
    });

    expect(testColumnsBlock).toBeTruthy();
    expect(panels).toEqual([
      expect.objectContaining({
        id: 'block:columns',
        label: 'Columns · Flexible columns',
        block: testColumnsBlock,
      }),
    ]);
  });

  it('keeps the 403(b) HUD order aligned with the public block order', () => {
    const blocks = (contentBlockBlueprintsByPath['/services/retirement/403b'] || [])
      .filter((block) => block?.mode === 'dynamic');
    const panels = buildNativeHudPanels({ blocks });

    expect(panels.map((panel) => panel.block.id)).toEqual([
      'hero',
      'intro',
      'benefits_cards',
      'investment_strategy_heading',
      'investment_strategy_options',
      'rate_table',
      'who_qualifies',
      'contribution_limits',
      'start_enrollment',
      'loan_details',
      'loan_apply',
      'rollover_billboard',
      'housing_feature',
      'online_contributions',
      'cta_form',
    ]);
  });

  it('keeps the insurance overview hero block in the native HUD dock', () => {
    const insuranceHeroBlock = (contentBlockBlueprintsByPath['/services/insurance'] || [])
      .find((block) => block?.id === 'hero' && block?.mode === 'dynamic');

    const panels = buildNativeHudPanels({
      blocks: [insuranceHeroBlock],
    });

    expect(insuranceHeroBlock).toBeTruthy();
    expect(panels).toEqual([
      expect.objectContaining({
        id: 'hero-main',
        label: 'Hero',
        block: insuranceHeroBlock,
      }),
    ]);
  });

  it('gives each same-kind native block instance its own panel id and HUD entry', () => {
    const panels = buildNativeHudPanels({
      blocks: [
        { id: 'who_qualifies', kind: 'card_grid', mode: 'dynamic' },
        { id: 'loan_apply', kind: 'card_grid', mode: 'dynamic' },
      ],
    });

    expect(panels.map((panel) => panel.blockId)).toEqual(['who_qualifies', 'loan_apply']);
    expect(panels.map((panel) => panel.id)).toEqual(['block:who_qualifies', 'block:loan_apply']);
    expect(new Set(panels.map((panel) => panel.icon)).size).toBe(1);
  });

  it('anchors every repeated Intro instance by block ID rather than a shared kind selector', () => {
    const panels = buildNativeHudPanels({
      blocks: [
        { id: 'intro_2', kind: 'intro', mode: 'dynamic' },
        { id: 'intro', kind: 'intro', mode: 'dynamic' },
        { id: 'intro_3', kind: 'intro', mode: 'dynamic' },
      ],
    });

    expect(panels.map((panel) => panel.anchorSelector)).toEqual([
      '[data-block-id="intro_2"]',
      '[data-block-id="intro"]',
      '[data-block-id="intro_3"]',
    ]);
  });
});
