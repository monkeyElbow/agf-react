import { describe, expect, it } from 'vitest';
import {
  hasAuthoringContentForPaths,
  selectFrontHudContentSource,
} from './frontHudContentSource';

describe('front HUD content source selection', () => {
  it('keeps published content while the authoring provider is still loading', () => {
    const publishedBlocks = { '/services/planned-giving': [{ id: 'hero' }] };
    const result = selectFrontHudContentSource({
      enabled: true,
      pathname: '/services/planned-giving',
      authoringBlocksByPath: {},
      blocksByPath: publishedBlocks,
    });

    expect(result.blocksByPath).toBe(publishedBlocks);
    expect(result.hasAuthoringBlocksForPath).toBe(false);
  });

  it('uses an explicit authoring route even when its block list is empty', () => {
    const authoringBlocks = { '/test': [] };
    const publishedBlocks = { '/test': [{ id: 'hero' }] };
    const result = selectFrontHudContentSource({
      enabled: true,
      pathname: '/test',
      authoringBlocksByPath: authoringBlocks,
      blocksByPath: publishedBlocks,
    });

    expect(result.blocksByPath).toBe(authoringBlocks);
    expect(result.hasAuthoringBlocksForPath).toBe(true);
  });

  it('recognizes a template path when the active path is an alias', () => {
    expect(hasAuthoringContentForPaths(
      { '/services/loans': [{ id: 'hero' }] },
      '/services/loans/legacy',
      '/services/loans',
    )).toBe(true);
  });

  it('does not switch to authoring content when HUD is off', () => {
    const publishedBlocks = { '/': [{ id: 'hero' }] };
    const authoringBlocks = { '/': [{ id: 'edited-hero' }] };
    const result = selectFrontHudContentSource({
      enabled: false,
      pathname: '/',
      authoringBlocksByPath: authoringBlocks,
      blocksByPath: publishedBlocks,
    });

    expect(result.blocksByPath).toBe(publishedBlocks);
  });

  it('uses the explicit published snapshot when HUD closes after a local draft', () => {
    const publishedBlocks = { '/test': [{ id: 'billboard', settings: { title: 'Published' } }] };
    const authoringBlocks = { '/test': [{ id: 'billboard', settings: { title: 'Draft' } }] };
    const result = selectFrontHudContentSource({
      enabled: false,
      pathname: '/test',
      authoringBlocksByPath: authoringBlocks,
      blocksByPath: authoringBlocks,
      publishedBlocksByPath: publishedBlocks,
    });

    expect(result.blocksByPath).toBe(publishedBlocks);
  });
});
