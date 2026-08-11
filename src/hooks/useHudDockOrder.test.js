import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useHudDockOrder, { mergeCurrentPanelOrder } from './useHudDockOrder';

describe('mergeCurrentPanelOrder', () => {
  it('places a new panel at its page position instead of appending it', () => {
    expect(mergeCurrentPanelOrder(
      ['hero', 'intro', 'billboard', 'cta_form'],
      ['hero', 'intro', 'card_grid', 'billboard', 'cta_form'],
    )).toEqual(['hero', 'intro', 'card_grid', 'billboard', 'cta_form']);
  });

  it('preserves an intentional existing dock reorder while inserting new panels near their page anchor', () => {
    expect(mergeCurrentPanelOrder(
      ['billboard', 'hero', 'intro', 'cta_form'],
      ['hero', 'intro', 'card_grid', 'billboard', 'cta_form'],
    )).toEqual(['card_grid', 'billboard', 'hero', 'intro', 'cta_form']);
  });

  it('follows page order after an arrow-style block reorder', () => {
    const storageKey = 'agf:front-hud:dock-order:test-arrow-reorder';
    window.localStorage.setItem(storageKey, JSON.stringify(['intro', 'billboard', 'hero']));
    const panels = [
      { id: 'hero' },
      { id: 'intro' },
      { id: 'billboard' },
    ];
    const { result, rerender } = renderHook(
      ({ nextPanels }) => useHudDockOrder({ panels: nextPanels, storageKey: 'test-arrow-reorder' }),
      { initialProps: { nextPanels: panels } },
    );

    expect(result.current.orderedPanels.map((panel) => panel.id)).toEqual(['intro', 'billboard', 'hero']);

    rerender({ nextPanels: [panels[2], panels[0], panels[1]] });

    expect(result.current.orderedPanels.map((panel) => panel.id)).toEqual(['billboard', 'hero', 'intro']);
    window.localStorage.removeItem(storageKey);
  });
});
