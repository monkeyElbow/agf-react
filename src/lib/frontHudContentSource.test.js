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

  it('restores the primary block while an explicit authoring route is temporarily empty', () => {
    const authoringBlocks = { '/about-us': [] };
    const publishedBlocks = {
      '/about-us': [
        {
          id: 'intro',
          kind: 'intro',
          mode: 'dynamic',
          settings: {
            bodyHtml: '<p>Our culture is delivering the best financial products and experiences that align with biblical values.</p>',
            extraLine: 'Our mission is your financial health and ministry growth.',
          },
        },
      ],
    };
    const result = selectFrontHudContentSource({
      enabled: true,
      pathname: '/about-us',
      authoringBlocksByPath: authoringBlocks,
      blocksByPath: publishedBlocks,
    });

    expect(result.blocksByPath['/about-us']).toEqual(publishedBlocks['/about-us']);
    expect(result.hasAuthoringBlocksForPath).toBe(true);
  });

  it('keeps a published pinned intro visible when an authoring route is missing that primary block', () => {
    const publishedBlocks = {
      '/about-us': [
        { id: 'intro', kind: 'intro', mode: 'dynamic', settings: { bodyHtml: '<p>Published intro</p>' } },
        { id: 'values', kind: 'card_grid', mode: 'dynamic' },
      ],
    };
    const authoringBlocks = {
      '/about-us': [
        { id: 'values', kind: 'card_grid', mode: 'dynamic' },
      ],
    };

    const result = selectFrontHudContentSource({
      enabled: true,
      pathname: '/about-us',
      authoringBlocksByPath: authoringBlocks,
      blocksByPath: publishedBlocks,
    });

    expect(result.blocksByPath['/about-us'].map((block) => block.id)).toEqual(['intro', 'values']);
    expect(result.blocksByPath['/about-us'].find((block) => block.id === 'intro')?.settings.bodyHtml)
      .toBe('<p>Published intro</p>');
  });

  it('replaces an invalid pinned intro mode instead of letting block-only rendering drop it', () => {
    const publishedBlocks = {
      '/about-us': [
        { id: 'intro', kind: 'intro', mode: 'dynamic', settings: { bodyHtml: '<p>Published intro</p>' } },
      ],
    };
    const authoringBlocks = {
      '/about-us': [
        { id: 'intro', kind: 'content', mode: 'static', settings: {} },
      ],
    };

    const result = selectFrontHudContentSource({
      enabled: true,
      pathname: '/about-us',
      authoringBlocksByPath: authoringBlocks,
      blocksByPath: publishedBlocks,
    });

    expect(result.blocksByPath['/about-us'][0]).toBe(publishedBlocks['/about-us'][0]);
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

  it('keeps HUD and public order identical after the published snapshot converges', () => {
    const convergedBlocks = {
      '/test': [
        { id: 'hero' },
        { id: 'intro_2' },
        { id: 'request_form' },
      ],
    };
    const draftMode = selectFrontHudContentSource({
      enabled: true,
      pathname: '/test',
      authoringBlocksByPath: convergedBlocks,
      blocksByPath: convergedBlocks,
      publishedBlocksByPath: convergedBlocks,
    });
    const publicMode = selectFrontHudContentSource({
      enabled: false,
      pathname: '/test',
      authoringBlocksByPath: convergedBlocks,
      blocksByPath: convergedBlocks,
      publishedBlocksByPath: convergedBlocks,
    });

    expect(draftMode.blocksByPath['/test'].map((block) => block.id))
      .toEqual(publicMode.blocksByPath['/test'].map((block) => block.id));
  });
});
