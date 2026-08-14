import { describe, expect, it } from 'vitest';
import { groupHomeRenderItems, planHomeRenderItems } from './homePageRenderPlan';

describe('homePageRenderPlan', () => {
  it('inserts the return assist slot immediately after the hero block', () => {
    const items = planHomeRenderItems([
      { id: 'top_strip', kind: 'top_strip' },
      { id: 'hero', kind: 'hero' },
      { id: 'cta_form', kind: 'cta_form' },
    ], { showReturnAssist: true });

    expect(items).toEqual([
      { type: 'block', block: { id: 'top_strip', kind: 'top_strip' } },
      { type: 'block', block: { id: 'hero', kind: 'hero' } },
      { type: 'slot', slot: 'return_assist' },
      { type: 'block', block: { id: 'cta_form', kind: 'cta_form' } },
    ]);
  });

  it('preserves the legacy no-hero fallback by placing return assist before the first block', () => {
    const items = planHomeRenderItems([
      { id: 'top_strip', kind: 'top_strip' },
      { id: 'cta_form', kind: 'cta_form' },
    ], { showReturnAssist: true });

    expect(items).toEqual([
      { type: 'slot', slot: 'return_assist' },
      { type: 'block', block: { id: 'top_strip', kind: 'top_strip' } },
      { type: 'block', block: { id: 'cta_form', kind: 'cta_form' } },
    ]);
  });

  it('groups adjacent block items into render runs while keeping slot boundaries intact', () => {
    const groups = groupHomeRenderItems([
      { type: 'block', block: { id: 'top_strip', kind: 'top_strip' } },
      { type: 'block', block: { id: 'hero', kind: 'hero' } },
      { type: 'slot', slot: 'return_assist' },
      { type: 'block', block: { id: 'cta_form', kind: 'cta_form' } },
    ]);

    expect(groups).toEqual([
      {
        type: 'block_run',
        blocks: [
          { id: 'top_strip', kind: 'top_strip' },
          { id: 'hero', kind: 'hero' },
        ],
        deferred: false,
      },
      { type: 'slot', slot: 'return_assist' },
      {
        type: 'block_run',
        blocks: [
          { id: 'cta_form', kind: 'cta_form' },
        ],
        deferred: false,
      },
    ]);
  });

  it('marks the block run after the Home feature for viewport-driven loading', () => {
    const groups = groupHomeRenderItems([
      { type: 'block', block: { id: 'hero', kind: 'hero' } },
      { type: 'block', block: { id: 'home_services_feature_animation', kind: 'feature' } },
      { type: 'block', block: { id: 'home_impact_story', kind: 'impact_story' } },
    ]);

    expect(groups).toEqual([
      {
        type: 'block_run',
        blocks: [
          { id: 'hero', kind: 'hero' },
          { id: 'home_services_feature_animation', kind: 'feature' },
        ],
        deferred: false,
      },
      {
        type: 'block_run',
        blocks: [{ id: 'home_impact_story', kind: 'impact_story' }],
        deferred: true,
      },
    ]);
  });

  it('does not defer pages without the Home feature anchor', () => {
    const groups = groupHomeRenderItems([
      { type: 'block', block: { id: 'hero', kind: 'hero' } },
      { type: 'block', block: { id: 'intro', kind: 'intro' } },
    ]);

    expect(groups.every((group) => group.deferred === false)).toBe(true);
  });
});
