import { createElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { homePageBlocks } from '../data/pageBlocks/homeBlocks';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
import { normalizeDynamicHeroSettings } from '../context/ContentAdminContext';
import { inspectHeroRender } from './heroRenderGuardrails';

vi.mock('../context/ContentAdminContext', async () => {
  const actual = await vi.importActual('../context/ContentAdminContext.jsx');
  return {
    ...actual,
    useContentAdmin: () => ({
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    }),
  };
});

import PageBlocksRenderer from '../components/blocks/PageBlocksRenderer';

function getHomeHeroTemplate() {
  const block = homePageBlocks.find((entry) => entry?.type === 'hero');
  if (!block) {
    throw new Error('Home hero template not found.');
  }
  return block;
}

function getHomeHeroSeedSettings() {
  const block = (contentBlockBlueprintsByPath['/'] || []).find((entry) => (
    entry?.id === 'hero'
    && entry?.kind === 'hero'
    && entry?.mode === 'dynamic'
  ));
  if (!block) {
    throw new Error('Home dynamic hero seed not found.');
  }
  return block.settings || {};
}

function renderHomeHero(settings) {
  const heroBlock = {
    ...getHomeHeroTemplate(),
    id: 'hero',
    kind: 'hero',
    mode: 'dynamic',
    ...settings,
  };

  return render(
    createElement(
      MemoryRouter,
      null,
      createElement(PageBlocksRenderer, { blocks: [heroBlock] }),
    ),
  );
}

describe('hero render guardrails', () => {
  it('accepts the rendered seeded home hero', () => {
    const { container } = renderHomeHero(normalizeDynamicHeroSettings('/', getHomeHeroSeedSettings()));

    const report = inspectHeroRender(container, '/', {
      styleReader: (node) => ({
        color: node.classList.contains('is-atlantean')
          ? 'rgb(0, 173, 187)'
          : node.classList.contains('is-mango')
            ? 'rgb(250, 163, 26)'
            : '',
      }),
    });

    expect(report.hasDrift).toBe(false);
    expect(report.issues).toHaveLength(0);
  });

  it('flags highlight color drift on the rendered home hero', () => {
    const { container } = renderHomeHero(normalizeDynamicHeroSettings('/', getHomeHeroSeedSettings()));

    const report = inspectHeroRender(container, '/', {
      styleReader: () => ({
        color: 'rgb(65, 64, 66)',
      }),
    });

    expect(report.hasDrift).toBe(true);
    expect(report.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
      'line1HighlightColor1',
      'line2HighlightColor1',
    ]));
  });
});
