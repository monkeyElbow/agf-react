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
      'newsletter',
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
        label: 'Columns',
        block: testColumnsBlock,
      }),
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
});
