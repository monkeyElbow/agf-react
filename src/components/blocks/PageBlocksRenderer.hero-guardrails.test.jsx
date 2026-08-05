import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { homePageBlocks } from '../../data/pageBlocks/homeBlocks';
import { contentBlockBlueprintsByPath } from '../../data/contentBlockBlueprints';
import { normalizeDynamicHeroSettings } from '../../context/ContentAdminContext';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

vi.mock('../../context/ContentAdminContextCore', async () => {
  const actual = await vi.importActual('../../context/ContentAdminContextCore');
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

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
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
  it('renders the seeded home hero line text, colors, and per-line sizing split', () => {
    const { container } = renderHomeHero(normalizeDynamicHeroSettings('/', getHomeHeroSeedSettings()));
    const line1 = container.querySelector('.home-native-hero .home-native-eyebrow.is-atlantean');
    const line2 = container.querySelector('.home-native-hero .home-native-title.line1.line2.is-mango');
    const line3 = container.querySelector('.home-native-hero .home-native-title.line3.is-super-grey');
    const source = readSource('./PageBlocksRenderer.jsx');

    expect(line1?.textContent).toBe('Convenient.');
    expect(line2?.textContent).toBe('Tax-efficient.');
    expect(line3?.textContent).toBe('Frictionless.');
    expect(source).toContain("const HOME_HERO_PRIMARY_LINE_SIZE_CSS = 'clamp(3.4rem, 11vw, 8rem)'");
    expect(source).toContain("fontSize: HOME_HERO_PRIMARY_LINE_SIZE_CSS,");
    expect(source).toContain("fontSize: heroTitleSize,");
  });

  it('does not restore starter classes when an active hero explicitly clears them', () => {
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

    const lineTexts = Array.from(container.querySelectorAll('.home-native-hero p, .home-native-hero h1'))
      .map((node) => node.textContent);
    expect(lineTexts).toEqual(expect.arrayContaining(['Convenient.', 'Tax-efficient.']));
    expect(container.querySelector('.home-native-hero .home-native-eyebrow.is-atlantean')).toBeNull();
    expect(container.querySelector('.home-native-hero .home-native-title.line1.line2.is-mango')).toBeNull();
    expect(container.querySelector('.home-native-hero .home-native-title.line3.is-super-grey')).toBeNull();
  });

  it('preserves home hero tag structure, line classes, and per-line sizing in HUD edit mode', () => {
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

    const line1 = container.querySelector('.home-native-hero p.home-native-eyebrow.is-atlantean');
    const line2 = container.querySelector('.home-native-hero h1.home-native-title.line1.line2.is-mango');
    const line3 = container.querySelector('.home-native-hero h1.home-native-title.line3.is-super-grey');
    const line1Input = container.querySelector('.home-native-hero textarea[aria-label="Line 1"]');
    const line2Input = container.querySelector('.home-native-hero textarea[aria-label="Line 2"]');
    const rendererSource = readSource('./PageBlocksRenderer.jsx');
    const editorSource = readSource('../HeroHudEditorShared.jsx');

    expect(line1?.textContent).toBe('Convenient.');
    expect(line2?.textContent).toBe('Tax-efficient.');
    expect(line3?.textContent).toBe('Frictionless.');
    expect(line1Input).toBeTruthy();
    expect(line2Input).toBeTruthy();
    expect(rendererSource).toContain("fontSize: HOME_HERO_PRIMARY_LINE_SIZE_CSS,");
    expect(editorSource).toContain("fontSize: typeof line?.fontSize === 'string' && line.fontSize.trim()");
  });

  it('routes home hero spacing through the shared line-gap helper for both HUD and block render', () => {
    const rendererSource = readSource('./PageBlocksRenderer.jsx');

    expect(rendererSource).toContain("import {\n  buildHeroLineStyle,\n  normalizeHeroLineGapEm,\n} from '../../lib/heroLineStyle';");
    expect(rendererSource).toContain('const lineGap = normalizeHeroLineGapEm(source.lineGap);');
    expect(rendererSource).toContain('lineGap={lineGap}');
    expect(rendererSource).toContain('style={buildHeroLineStyle({');
    expect(rendererSource).toContain('lineIndex: 1,');
    expect(rendererSource).toContain('lineIndex: 2,');
  });
});
