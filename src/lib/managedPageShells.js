const BLOCK_ONLY_MANAGED_PAGE_PATHS = new Set([
  // Add paths here only after every visible section on that route is owned by explicit blocks.
  '/services/retirement/403b',
  '/services/retirement/403b/403b-individual-enrollment',
  '/services/retirement/409a',
  '/services/retirement/rollovers',
  '/services/retirement/retirement-consultants',
]);

function normalizeManagedPagePath(pathname) {
  return String(pathname || '').trim() || '/';
}

export function isBlockOnlyManagedPagePath(pathname) {
  return BLOCK_ONLY_MANAGED_PAGE_PATHS.has(normalizeManagedPagePath(pathname));
}

export function shouldSeedBlocksFromNativePageContent(pathname) {
  return !isBlockOnlyManagedPagePath(pathname);
}

export function toBlockOnlyManagedPageShell(content) {
  if (!content || typeof content !== 'object') {
    return {
      hero: null,
      intro: null,
      preIntroSections: [],
      sections: [],
      actions: [],
      forms: [],
    };
  }

  return {
    ...content,
    hero: null,
    intro: null,
    preIntroSections: [],
    sections: [],
    actions: [],
    forms: [],
  };
}

export { BLOCK_ONLY_MANAGED_PAGE_PATHS };
