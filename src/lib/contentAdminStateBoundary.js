import { normalizeContentAdminState } from './contentAdminNormalization';

/**
 * Normalize a state received from the content authority.
 *
 * This is intentionally schema-only. It canonicalizes paths, block settings,
 * collaboration metadata, and legacy field shapes, but it never consults a
 * blueprint, restores a missing block, deduplicates an admin-chosen list, or
 * changes its order. Authority state is already the result of an explicit
 * save/migration boundary; rendering and polling must not invent repairs.
 */
export function normalizeContentAdminAuthorityState(rawState) {
  return normalizeContentAdminState(rawState);
}

