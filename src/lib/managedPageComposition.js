import { composeManagedBlockOrder } from './managedBlockOrder';

function blockId(block) {
  return String(block?.id || '').trim();
}

function blockKind(block) {
  return String(block?.kind || block?.type || '').trim();
}

function isHidden(block) {
  return Boolean(block?.hidden === true || String(block?.hidden || '').trim().toLowerCase() === 'true');
}

function sectionIdentity(section) {
  // `id` is a native DOM/content identifier, not proof that the section is
  // the managed block with the same name. Replacement is allowed only when a
  // native bridge explicitly declares the managed block identity.
  return String(section?.blockId || section?.managedBlockId || '').trim();
}

/**
 * Compose the page model before React renders it.
 *
 * This function owns block visibility, primary hero/intro slots, managed
 * section order, and replacement of native sections that explicitly identify
 * the same block. Renderers receive the resulting model and do not repair or
 * reorder it.
 */
export function composeManagedPage({
  baseContent = {},
  blocks = [],
  pathname = '',
  isBlockOnlyManagedPage = false,
  includeHidden = false,
  normalizeBlock = (block) => block,
  buildHero = null,
  buildIntro = null,
  buildSection = null,
  composeRouteSections = null,
} = {}) {
  const orderedBlocks = composeManagedBlockOrder(blocks);
  const renderedBlocks = orderedBlocks
    .filter((block) => includeHidden || !isHidden(block))
    .map((block) => normalizeBlock(block))
    .filter(Boolean);
  const blockVisibility = new Map();
  orderedBlocks.forEach((block) => {
    const id = blockId(block);
    if (!id) {
      return;
    }
    const current = blockVisibility.get(id) || { visible: false, hidden: false };
    if (isHidden(block)) {
      current.hidden = true;
    } else {
      current.visible = true;
    }
    blockVisibility.set(id, current);
  });
  const fullyHiddenBlockIds = includeHidden
    ? new Set()
    : new Set(
      Array.from(blockVisibility.entries())
        .filter(([, visibility]) => visibility.hidden && !visibility.visible)
        .map(([id]) => id),
    );
  const primaryHeroBlock = renderedBlocks.find((block) => blockKind(block) === 'hero') || null;
  const primaryIntroBlock = renderedBlocks.find((block) => blockKind(block) === 'intro') || null;
  const primarySlotIds = new Set(
    isBlockOnlyManagedPage
      ? []
      : [blockId(primaryHeroBlock), blockId(primaryIntroBlock)].filter(Boolean),
  );

  let nextContent = { ...baseContent };

  if (!isBlockOnlyManagedPage && primaryHeroBlock && typeof buildHero === 'function') {
    const adminHero = buildHero(primaryHeroBlock);
    if (adminHero) {
      nextContent = {
        ...nextContent,
        hero: {
          ...(nextContent.hero || {}),
          ...adminHero,
          ...(includeHidden && isHidden(primaryHeroBlock) ? { isAdminHiddenBlock: true } : {}),
        },
      };
    }
  }

  if (!isBlockOnlyManagedPage && primaryIntroBlock && typeof buildIntro === 'function') {
    const adminIntro = buildIntro(primaryIntroBlock);
    if (adminIntro) {
      const baseIntro = nextContent.intro;
      const baseIntroObject = baseIntro && typeof baseIntro === 'object'
        ? baseIntro
        : (baseIntro ? { body: baseIntro } : {});
      const mergedClassName = [baseIntroObject.className, adminIntro.className]
        .filter(Boolean)
        .join(' ')
        .trim();
      nextContent = {
        ...nextContent,
        intro: {
          ...baseIntroObject,
          ...adminIntro,
          className: mergedClassName || undefined,
          ...(includeHidden && isHidden(primaryIntroBlock) ? { isAdminHiddenBlock: true } : {}),
        },
      };
    }
  }

  const managedEntries = renderedBlocks
    .filter((block) => isBlockOnlyManagedPage || !primarySlotIds.has(blockId(block)))
    .map((block) => ({
      block,
      section: typeof buildSection === 'function'
        ? buildSection(block, { pathname, isBlockOnlyManagedPage })
        : null,
    }))
    .map((entry) => (
      entry.section && includeHidden && isHidden(entry.block)
        ? {
          ...entry,
          section: {
            ...entry.section,
            isAdminHiddenBlock: true,
            className: [entry.section.className, 'is-admin-hidden-block'].filter(Boolean).join(' '),
          },
        }
        : entry
    ))
    .filter((entry) => entry.section);

  const managedByBlockId = new Map(
    managedEntries
      .map((entry) => [blockId(entry.block), entry])
      .filter(([id]) => id),
  );
  const nativeSections = (Array.isArray(nextContent.sections) ? nextContent.sections : [])
    .filter((section) => !fullyHiddenBlockIds.has(sectionIdentity(section)));
  const placedManagedIds = new Set();
  const orderedSections = nativeSections.map((section) => {
    const identity = sectionIdentity(section);
    const managedEntry = managedByBlockId.get(identity);
    if (!managedEntry) {
      return section;
    }
    placedManagedIds.add(identity);
    return managedEntry.section;
  });

  // Native sections without an explicit block identity remain where the
  // native route placed them. All managed sections that do have block
  // identity are appended in authoritative block order, never sorted by kind
  // or title. This is the safe bridge while legacy native sections are still
  // being migrated to explicit blocks.
  managedEntries.forEach((entry) => {
    const id = blockId(entry.block);
    if (!id || placedManagedIds.has(id)) {
      return;
    }
    orderedSections.push(entry.section);
  });

  const adaptedSections = typeof composeRouteSections === 'function'
    ? composeRouteSections(orderedSections)
    : orderedSections;

  return {
    ...nextContent,
    hideHero: !isBlockOnlyManagedPage && (
      Boolean(nextContent.hideHero)
      || (primaryHeroBlock ? fullyHiddenBlockIds.has(blockId(primaryHeroBlock)) : fullyHiddenBlockIds.has('hero'))
    ),
    hideIntro: !isBlockOnlyManagedPage && (
      Boolean(nextContent.hideIntro)
      || (primaryIntroBlock ? fullyHiddenBlockIds.has(blockId(primaryIntroBlock)) : fullyHiddenBlockIds.has('intro'))
    ),
    sections: Array.isArray(adaptedSections) ? adaptedSections : [],
    managedBlocks: renderedBlocks,
    primaryHeroBlock,
    primaryIntroBlock,
  };
}

export default composeManagedPage;
