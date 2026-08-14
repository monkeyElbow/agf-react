import { describe, expect, it } from 'vitest';
import { composeManagedPage } from './managedPageComposition';
import { selectFrontHudContentSource } from './frontHudContentSource';

function block(id, kind = 'billboard', hidden = false) {
  return { id, kind, mode: 'dynamic', hidden };
}

describe('managed page composition', () => {
  it('keeps managed sections in block order and preserves stable block identity', () => {
    const result = composeManagedPage({
      pathname: '/test',
      blocks: [block('hero', 'hero'), block('intro_2', 'intro'), block('request_form', 'request_form'), block('intro_3', 'intro')],
      buildSection: (entry) => ({ id: `section-${entry.id}`, blockId: entry.id }),
    });

    expect(result.sections.map((section) => section.blockId)).toEqual([
      'request_form',
      'intro_3',
    ]);
    expect(result.primaryHeroBlock.id).toBe('hero');
    expect(result.primaryIntroBlock.id).toBe('intro_2');
  });

  it('renders every block in order for block-only pages', () => {
    const result = composeManagedPage({
      pathname: '/services/planned-giving/qualified-charitable-distribution',
      isBlockOnlyManagedPage: true,
      blocks: [block('hero', 'hero'), block('intro', 'intro'), block('steps', 'columns')],
      buildSection: (entry) => ({ id: `section-${entry.id}`, blockId: entry.id }),
    });

    expect(result.sections.map((section) => section.blockId)).toEqual(['hero', 'intro', 'steps']);
  });

  it('does not let hidden blocks leave native sections behind', () => {
    const result = composeManagedPage({
      blocks: [block('hero', 'hero', true)],
      baseContent: { sections: [{ blockId: 'hero', id: 'hero', title: 'stale native hero' }] },
    });

    expect(result.sections).toEqual([]);
    expect(result.hideHero).toBe(true);
  });

  it('includes hidden blocks only for authoring render and marks them for HUD styling', () => {
    const result = composeManagedPage({
      includeHidden: true,
      blocks: [block('hidden_billboard', 'billboard', true)],
      buildSection: (entry) => ({ blockId: entry.id }),
    });

    expect(result.managedBlocks.map((entry) => entry.id)).toEqual(['hidden_billboard']);
    expect(result.sections).toEqual([{
      blockId: 'hidden_billboard',
      isAdminHiddenBlock: true,
      className: 'is-admin-hidden-block',
    }]);
  });

  it('does not replace a native section merely because its DOM id matches a block id', () => {
    const result = composeManagedPage({
      blocks: [block('intro', 'intro'), block('billboard', 'billboard')],
      baseContent: {
        sections: [{ id: 'intro', title: 'native intro section' }],
      },
      buildSection: (entry) => ({ blockId: entry.id, title: `managed ${entry.id}` }),
    });

    expect(result.sections).toEqual([
      { id: 'intro', title: 'native intro section' },
      { blockId: 'billboard', title: 'managed billboard' },
    ]);
  });

  it('replaces a native section only through an explicit managed block identity', () => {
    const result = composeManagedPage({
      blocks: [block('billboard', 'billboard')],
      baseContent: {
        sections: [{ id: 'legacy-billboard', blockId: 'billboard', title: 'legacy bridge' }],
      },
      buildSection: (entry) => ({ blockId: entry.id, title: `managed ${entry.id}` }),
    });

    expect(result.sections).toEqual([
      { blockId: 'billboard', title: 'managed billboard' },
    ]);
  });

  it('keeps HUD and public rendering in the same order after publish convergence', () => {
    const converged = {
      '/test': [block('hero', 'hero'), block('intro', 'intro'), block('columns', 'columns')],
    };
    const render = (enabled) => {
      const source = selectFrontHudContentSource({
        enabled,
        pathname: '/test',
        authoringBlocksByPath: converged,
        blocksByPath: converged,
        publishedBlocksByPath: converged,
      });
      return composeManagedPage({
        pathname: '/test',
        isBlockOnlyManagedPage: true,
        blocks: source.blocksByPath['/test'],
        buildSection: (entry) => ({ blockId: entry.id }),
      }).sections.map((section) => section.blockId);
    };

    expect(render(true)).toEqual(['hero', 'intro', 'columns']);
    expect(render(false)).toEqual(['hero', 'intro', 'columns']);
  });
});
