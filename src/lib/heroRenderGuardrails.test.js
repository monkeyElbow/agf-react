import { createElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
import { normalizeDynamicHeroSettings } from '../context/ContentAdminContext';
import { inspectHeroRender } from './heroRenderGuardrails';

vi.mock('../context/ContentAdminContextCore', async () => {
  const actual = await vi.importActual('../context/ContentAdminContextCore');
  return {
    ...actual,
    useContentAdmin: () => ({
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    }),
  };
});

import PageBlocksRenderer from '../components/blocks/PageBlocksRenderer';

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
    id: 'hero',
    kind: 'hero',
    mode: 'dynamic',
    type: 'hero',
    settings: { ...settings },
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
    const highlightedSettings = normalizeDynamicHeroSettings('/', {
      ...getHomeHeroSeedSettings(),
      line1Text: "Today's investment.",
      line1ClassName: 'home-native-eyebrow',
      line1HighlightsJson: '[{"text":"investment","className":"is-atlantean"}]',
      line2Text: "Tomorrow's church.",
      line2ClassName: 'home-native-title line1 line2',
      line2HighlightsJson: '[{"text":"church","className":"is-mango"}]',
      line3Text: '',
      line3ClassName: 'home-native-title line3',
      line3HighlightsJson: '',
    });
    const { container } = renderHomeHero(highlightedSettings);

    const report = inspectHeroRender(container, '/', {
      heroContract: {
        bgTone: 'white',
        justify: 'left',
        lines: [
          {
            text: "Today's investment.",
            className: 'home-native-eyebrow',
            highlightsJson: [{ text: 'investment', className: 'is-atlantean' }],
          },
          {
            text: "Tomorrow's church.",
            className: 'home-native-title line1 line2',
            highlightsJson: [{ text: 'church', className: 'is-mango' }],
          },
        ],
        actions: [
          {
            label: 'Explore investments',
          },
        ],
      },
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

  it('accepts a runtime hero contract override for customized home hero content', () => {
    const customizedSettings = normalizeDynamicHeroSettings('/', {
      ...getHomeHeroSeedSettings(),
      line1Text: "Today's investment.",
      line1ClassName: 'home-native-eyebrow',
      line1HighlightsJson: '[{"text":"investment","className":"is-atlantean"}]',
      line2Text: "Tomorrow's church.",
      line2ClassName: 'home-native-title line1 line2',
      line2HighlightsJson: '[{"text":"church","className":"is-mango"}]',
      line3Text: '',
      line3ClassName: 'home-native-title line3',
      line3HighlightsJson: '',
    });
    const { container } = renderHomeHero(customizedSettings);

    const report = inspectHeroRender(container, '/', {
      heroContract: {
        bgTone: 'white',
        justify: 'left',
        lines: [
          {
            text: "Today's investment.",
            className: 'home-native-eyebrow',
            highlightsJson: [{ text: 'investment', className: 'is-atlantean' }],
          },
          {
            text: "Tomorrow's church.",
            className: 'home-native-title line1 line2',
            highlightsJson: [{ text: 'church', className: 'is-mango' }],
          },
        ],
        actions: [
          {
            label: 'Explore investments',
          },
        ],
      },
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
});
