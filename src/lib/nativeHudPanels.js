import { buildHudPanelsFromBlocks } from './blockHudRegistry';

const NATIVE_PANEL_ID_BY_BLOCK_ID = Object.freeze({
  hero: 'hero-main',
  intro: 'intro-main',
});

export function buildNativeHudPanels({ blocks = [], includeHidden = false } = {}) {
  const anchorSelectorById = (Array.isArray(blocks) ? blocks : []).reduce((next, block) => {
    const blockId = String(block?.id || '').trim();
    if (!blockId || next[blockId]) {
      return next;
    }
    next[blockId] = `[data-block-id="${blockId}"]`;
    return next;
  }, {});

  return buildHudPanelsFromBlocks(blocks, {
    panelIdById: NATIVE_PANEL_ID_BY_BLOCK_ID,
    anchorSelectorById,
    includeHidden,
  });
}
