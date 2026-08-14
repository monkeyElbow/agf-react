import { useMemo } from 'react';
import { useFrontHud } from '../context/FrontHudContext';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import { selectFrontHudContentSource } from '../lib/frontHudContentSource';

/**
 * The single UI boundary for choosing draft or published managed content.
 *
 * Pages may still render custom native sections, but they must not each decide
 * which content snapshot is authoritative. The content-admin context owns the
 * snapshots; this hook owns the mode selection.
 */
export function useManagedContentSource({ pathname = '', fallbackPathname = '' } = {}) {
  const { enabled } = useFrontHud();
  const {
    blocksByPath = {},
    publishedBlocksByPath = null,
    authoringBlocksByPath = {},
    pageHierarchy = {},
    publishedPageHierarchy = null,
    authoringPageHierarchy = {},
  } = useContentAdmin();

  return useMemo(() => selectFrontHudContentSource({
    enabled,
    pathname,
    fallbackPathname,
    authoringBlocksByPath,
    blocksByPath,
    authoringPageHierarchy,
    pageHierarchy,
    publishedBlocksByPath,
    publishedPageHierarchy,
  }), [
    enabled,
    pathname,
    fallbackPathname,
    authoringBlocksByPath,
    blocksByPath,
    authoringPageHierarchy,
    pageHierarchy,
    publishedBlocksByPath,
    publishedPageHierarchy,
  ]);
}
