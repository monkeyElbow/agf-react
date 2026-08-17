import { PRESET_FAMILY_CONTRACT } from './presetFamilyContract.shared';

function normalizePresetId(value) {
  const token = String(value || '').trim().toLowerCase();
  return token.replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'default';
}

/**
 * The small, inspectable contract between managed content and the DOM.
 *
 * Blueprints and snapshots decide what a block is. The renderer must expose
 * enough of that decision in the DOM for a browser check to prove that the
 * active snapshot actually reached the page.
 */
export const RENDER_CONVERGENCE_CONTRACT_VERSION = 1;

export function buildRenderConvergenceBlockContract(block) {
  const kind = String(block?.kind || '').trim();
  const blockId = String(block?.id || '').trim();
  const mode = String(block?.mode || '').trim();
  const family = PRESET_FAMILY_CONTRACT[kind] || null;

  if (!blockId || !kind || !family) {
    return {
      version: RENDER_CONVERGENCE_CONTRACT_VERSION,
      blockId: blockId || undefined,
      kind: kind || undefined,
      mode: mode || undefined,
      presetId: undefined,
      rootClassName: family?.rootClassName || undefined,
      runtimeClassName: undefined,
    };
  }

  const presetId = normalizePresetId(block?.renderPresetId || block?.presetId || 'default');
  return {
    version: RENDER_CONVERGENCE_CONTRACT_VERSION,
    blockId,
    kind,
    mode,
    presetId,
    rootClassName: family.rootClassName,
    runtimeClassName: family.runtimePresetClassPrefix + presetId,
  };
}

export function buildRenderConvergenceRouteContract({
  pathname = '',
  blocks = [],
  source = 'authoring',
  revision = '',
} = {}) {
  return {
    version: RENDER_CONVERGENCE_CONTRACT_VERSION,
    pathname: String(pathname || '').trim() || '/',
    source: String(source || '').trim() || 'authoring',
    revision: String(revision || '').trim(),
    blocks: (Array.isArray(blocks) ? blocks : [])
      .map(buildRenderConvergenceBlockContract)
      .filter((block) => block.blockId),
  };
}
