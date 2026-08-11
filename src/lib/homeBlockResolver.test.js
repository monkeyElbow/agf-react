import { describe, expect, it } from 'vitest';
import { buildResolvedHomeBlocks } from './homeBlockResolver';

function buildContext(managedBlocks) {
  return {
    managedBlocks,
    managedBlocksById: new Map(managedBlocks.map((block) => [block.id, block])),
    homeServicesFeatureIsActive: false,
  };
}

describe('home dynamic block resolution', () => {
  it('renders active managed dynamic blocks without a native fallback source', () => {
    const blocks = buildResolvedHomeBlocks(buildContext([
      {
        id: 'hero',
        kind: 'hero',
        mode: 'dynamic',
        settings: { line1Text: 'Edited home hero.' },
      },
    ]));

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      type: 'hero',
      line1Text: 'Edited home hero.',
    });
  });

  it('drops retired static records instead of selecting them as a fallback', () => {
    const blocks = buildResolvedHomeBlocks(buildContext([
      {
        id: 'hero',
        kind: 'hero',
        mode: 'static',
        settings: { line1Text: 'Retired static hero.' },
      },
    ]));

    expect(blocks).toEqual([]);
  });

  it('preserves empty dynamic settings rather than restoring old copy', () => {
    const blocks = buildResolvedHomeBlocks(buildContext([
      {
        id: 'home_do_the_math',
        kind: 'billboard',
        mode: 'dynamic',
        settings: { title: '', body: '', buttonLabel: '' },
      },
    ]));

    expect(blocks).toHaveLength(1);
    expect(blocks[0].settings).toEqual({ title: '', body: '', buttonLabel: '' });
  });

  it('keeps the impact feature ahead of the animated services feature', () => {
    const blocks = buildResolvedHomeBlocks(buildContext([
      {
        id: 'home_services_feature_animation',
        kind: 'site_feature',
        mode: 'dynamic',
        settings: { featureId: 'home_services_feature_animation' },
      },
      {
        id: 'impact_stat',
        kind: 'impact_stat',
        mode: 'dynamic',
        settings: { titlePrefix: 'What you do here', highlight: 'matters' },
      },
    ]));

    expect(blocks.map((block) => block.id)).toEqual([
      'impact_stat',
      'home_services_feature_animation',
    ]);
  });
});
