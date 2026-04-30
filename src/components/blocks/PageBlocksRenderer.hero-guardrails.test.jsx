import { createElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { homePageBlocks } from '../../data/pageBlocks/homeBlocks';
import { contentBlockBlueprintsByPath } from '../../data/contentBlockBlueprints';
import { normalizeDynamicHeroSettings } from '../../context/ContentAdminContext';

vi.mock('../../context/ContentAdminContext', async () => {
  const actual = await vi.importActual('../../context/ContentAdminContext.jsx');
  return {
    ...actual,
    useContentAdmin: () => ({
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    }),
  };
});

import PageBlocksRenderer from './PageBlocksRenderer';

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

describe('home hero render guardrails', () => {
  it('renders the seeded home hero highlight colors', () => {
    const { container } = renderHomeHero(normalizeDynamicHeroSettings('/', getHomeHeroSeedSettings()));

    expect(container.querySelector('.home-native-hero .home-native-eyebrow')).toBeTruthy();
    expect(container.querySelector('.home-native-hero .home-native-title.line1.line2')).toBeTruthy();
    expect(container.querySelector('.home-native-hero mark.is-atlantean')?.textContent).toBe('investment');
    expect(container.querySelector('.home-native-hero mark.is-mango')?.textContent).toBe('church');
  });

  it('still renders the seeded highlight colors when hero settings are sparse', () => {
    const seeded = getHomeHeroSeedSettings();
    const sparse = {
      line1Text: seeded.line1Text,
      line1ClassName: '',
      line1HighlightsJson: '[]',
      line2Text: seeded.line2Text,
      line2ClassName: '',
      line2HighlightsJson: '[]',
      line3Text: '',
      line3ClassName: '',
      line3HighlightsJson: '[]',
      button1Label: '',
      button1PageRef: '',
      button1Url: '',
      button1Style: '',
      button1Tone: '',
    };

    const { container } = renderHomeHero(normalizeDynamicHeroSettings('/', sparse));

    expect(container.querySelector('.home-native-hero .home-native-eyebrow')).toBeTruthy();
    expect(container.querySelector('.home-native-hero .home-native-title.line1.line2')).toBeTruthy();
    expect(container.querySelector('.home-native-hero mark.is-atlantean')?.textContent).toBe('investment');
    expect(container.querySelector('.home-native-hero mark.is-mango')?.textContent).toBe('church');
  });

  it('preserves home hero tag structure and highlight marks in HUD edit mode', () => {
    const heroBlock = {
      ...getHomeHeroTemplate(),
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      ...normalizeDynamicHeroSettings('/', getHomeHeroSeedSettings()),
    };

    const { container } = render(
      createElement(
        MemoryRouter,
        null,
        createElement(PageBlocksRenderer, {
          blocks: [heroBlock],
          heroHud: {
            isEditing: true,
            activeLineKey: 'line1',
            onLineTextChange: vi.fn(),
            onLineInteract: vi.fn(),
            setLineInputRef: vi.fn(),
          },
        }),
      ),
    );

    expect(container.querySelector('.home-native-hero p.home-native-eyebrow')).toBeTruthy();
    expect(container.querySelector('.home-native-hero h1.home-native-title.line1.line2')).toBeTruthy();
    expect(container.querySelector('.home-native-hero p.home-native-eyebrow mark.is-atlantean')?.textContent).toBe('investment');
    expect(container.querySelector('.home-native-hero h1.home-native-title.line1.line2 mark.is-mango')?.textContent).toBe('church');
  });
});
