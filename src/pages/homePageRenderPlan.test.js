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
      },
      { type: 'slot', slot: 'return_assist' },
      {
        type: 'block_run',
        blocks: [
          { id: 'cta_form', kind: 'cta_form' },
        ],
      },
    ]);
  });
});
