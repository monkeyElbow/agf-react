import { buildHudPanelsFromBlocks } from './blockHudRegistry';

const NATIVE_PANEL_ID_BY_BLOCK_ID = Object.freeze({
  hero: 'hero-main',
  intro: 'intro-main',
});

const NATIVE_DEFAULT_ANCHOR_SELECTOR_BY_BLOCK_ID = Object.freeze({
  hero: '.service-native-hero',
  intro: '.service-native-intro',
});

export function buildNativeHudPanels({ blocks = [] } = {}) {
  const anchorSelectorById = (Array.isArray(blocks) ? blocks : []).reduce((next, block) => {
    const blockId = String(block?.id || '').trim();
    if (!blockId || next[blockId]) {
      return next;
    }
    next[blockId] = NATIVE_DEFAULT_ANCHOR_SELECTOR_BY_BLOCK_ID[blockId] || `[data-block-id="${blockId}"]`;
    return next;
  }, { ...NATIVE_DEFAULT_ANCHOR_SELECTOR_BY_BLOCK_ID });

  return buildHudPanelsFromBlocks(blocks, {
    panelIdById: NATIVE_PANEL_ID_BY_BLOCK_ID,
    anchorSelectorById,
  });
}
