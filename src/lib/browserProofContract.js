/**
 * Pure browser-proof assertions shared by the CDP helper and unit tests.
 *
 * Durable rule protected: an authority mismatch is a first-class failure, not
 * an unexplained visual mismatch.
 * Legitimate admin action still allowed: route-specific ownership is valid when
 * the expected renderer/source is explicitly supplied to the proof.
 * Protected layer: runtime observability.
 * Failure symptom: a repair targets one implementation while another wins.
 * Proof method: compare expected authority facts with browser descriptor facts.
 * Retirement condition: none; this is the permanent proof contract.
 */

export function validateBrowserAuthorityExpectation({
  blockId = '',
  actualAuthority = null,
  expectedRenderer = '',
  expectedSource = '',
  expectedHud = null,
  actualHud = null,
} = {}) {
  const failures = [];
  const normalizedBlockId = String(blockId || '').trim() || '(current block)';
  if (!actualAuthority) {
    failures.push(normalizedBlockId + ': runtime authority descriptor unavailable');
    return failures;
  }
  if (expectedRenderer && actualAuthority.renderer !== expectedRenderer) {
    failures.push(
      'wrong renderer for ' + normalizedBlockId + ': expected ' + expectedRenderer
        + ', actual ' + (actualAuthority.renderer || '(unknown)')
        + '. Repair may be targeting the wrong implementation.',
    );
  }
  if (expectedSource && actualAuthority.source !== expectedSource) {
    failures.push(
      'wrong source for ' + normalizedBlockId + ': expected ' + expectedSource
        + ', actual ' + (actualAuthority.source || '(unknown)')
        + '. Repair may be targeting the wrong snapshot.',
    );
  }
  if (expectedHud !== null && Boolean(actualHud) !== Boolean(expectedHud)) {
    failures.push('HUD state is ' + Boolean(actualHud) + ', expected ' + Boolean(expectedHud));
  }
  return failures;
}

export function buildComputedStyleProof({
  elementExists = false,
  selector = '',
  computedStyles = {},
  cssVariables = {},
  inlineStyles = {},
  matchedRules = [],
} = {}) {
  return {
    selector: String(selector || '').trim(),
    elementExists: Boolean(elementExists),
    computedStyles: { ...(computedStyles || {}) },
    cssVariables: { ...(cssVariables || {}) },
    inlineStyles: { ...(inlineStyles || {}) },
    matchedRules: Array.isArray(matchedRules) ? matchedRules : [],
  };
}
