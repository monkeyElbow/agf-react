import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockBlocksByPath = {};

vi.mock('../context/ContentAdminContext', () => ({
  inspectDynamicHeroSettings: () => ({ hasDrift: false, issues: [], normalizedSettings: {} }),
  normalizeDynamicHeroSettings: (_pathname, settings) => settings || {},
  useContentAdmin: () => ({
    blocksByPath: mockBlocksByPath,
    updateBlockSetting: vi.fn(),
    resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
  }),
}));

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({ enabled: false, opacity: 15 }),
}));

vi.mock('../hooks/useNativeEnhancements', () => ({
  default: () => {},
}));

vi.mock('../lib/heroDriftWarnings', () => ({
  logHeroDriftWarningOnce: () => {},
}));

vi.mock('../lib/heroRenderGuardrails', () => ({
  inspectHeroRender: () => ({ hasDrift: false, issues: [] }),
  logHeroRenderWarningOnce: () => {},
}));

vi.mock('../lib/heroHudMode', () => ({
  shouldRenderHeroInlineEditor: () => false,
}));

import HomePage from './HomePage';

void [MemoryRouter, HomePage];

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

function expectHomeMathBlockTitle() {
  expect(screen.getByText((_, node) => String(node?.textContent || '').trim() === '(let us) Do the math.')).toBeTruthy();
}

function expectHomeMhaBillboard() {
  expect(screen.getByText('Ministry allies.')).toBeTruthy();
  expect(document.querySelector('.home-native-billboard[data-block-id="home_ministry_allies"]')).toBeTruthy();
}

function expectHomeMathBillboardWithoutPhoto({ requireHighlight = true } = {}) {
  const block = document.querySelector('.home-native-billboard[data-block-id="home_do_the_math"]');
  expect(block).toBeTruthy();
  expect(screen.queryByAltText('Calculator and notebook')).toBeNull();
  expect(block.querySelector('.ag-panel-rail')).toBeTruthy();
  if (requireHighlight) {
    expect(block.querySelector('h2 mark.is-atlantean')).toBeTruthy();
  }
  const action = block.querySelector('.service-native-action-row .service-native-btn');
  expect(action).toBeTruthy();
  expect(action.textContent).toContain('Use the calculators');
  expect(action.getAttribute('href')).toBe('/calculators');
}

describe('HomePage columns visibility', () => {
  beforeEach(() => {
    mockBlocksByPath = {};
  });

  it('renders the home impact story through the site-feature path by default', () => {
    const { container } = renderHomePage();

    const heroBlock = container.querySelector('[data-block-id="hero"]');
    const impactBlock = container.querySelector('[data-block-id="home_impact_story"]');
    const featureBlock = container.querySelector('[data-block-id="home_services_feature_animation"]');
    const homePage = container.querySelector('.home-native-page');

    expect(screen.getByRole('heading', { name: /What you do here matters/i })).toBeTruthy();
    expect(screen.getByText('ministries served by loans')).toBeTruthy();
    expect(screen.getByText('distributed to ministries through AG Foundation')).toBeTruthy();
    expect(heroBlock).toBeTruthy();
    expect(homePage?.className).toContain('ag-page-shell');
    expect(homePage?.className).toContain('is-home-hero-temporarily-hidden');
    expect(impactBlock?.compareDocumentPosition(featureBlock) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders managed home columns in static and dynamic modes', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'home_ministry_allies',
          kind: 'billboard',
          mode: 'dynamic',
          settings: {
            title: 'Ministry allies.',
            bodyHtml: "<p>We're serving you, alongside you.</p>",
          },
        },
        {
          id: 'home_do_the_math',
          kind: 'billboard',
          mode: 'static',
          settings: {
            title: '(let us) Do the math.',
            titleHighlightsJson: '[{"text":"(let us)","className":"is-atlantean"}]',
            body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
            buttonLabel: 'Use the calculators',
            buttonUrl: '/calculators',
          },
        },
      ],
    };

    renderHomePage();

    expectHomeMhaBillboard();
    expectHomeMathBlockTitle();
    expectHomeMathBillboardWithoutPhoto({ requireHighlight: false });
  });

  it('renders a managed static home hero instead of falling back to the seed hero copy', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'hero',
          kind: 'hero',
          mode: 'static',
          settings: {
            line1Text: 'Managed.',
            line1ClassName: 'home-native-eyebrow is-atlantean',
            line1HighlightsJson: '',
            line2Text: 'Static for QA.',
            line2ClassName: 'home-native-title line1 line2 is-mango',
            line2HighlightsJson: '',
            line3Text: 'Still deterministic.',
            line3ClassName: 'home-native-title line3 is-super-grey',
            line3HighlightsJson: '',
            button1Label: 'Review hero',
            button1PageRef: '/services/investments',
          },
        },
      ],
    };

    renderHomePage();

    expect(screen.getByText('Managed.')).toBeTruthy();
    expect(screen.getByText('Static for QA.')).toBeTruthy();
    expect(screen.getByText('Still deterministic.')).toBeTruthy();
    expect(screen.queryByText('Convenient.')).toBeNull();
  });

  it('ignores stale static managed home billboard records and keeps the seed billboards visible', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'home_ministry_allies',
          kind: 'billboard',
          mode: 'static',
          hidden: true,
          settings: {
            title: 'Hidden housing title',
          },
        },
        {
          id: 'home_do_the_math',
          kind: 'billboard',
          mode: 'static',
          settings: {
            title: '(let us) Do the math.',
          },
        },
      ],
    };

    renderHomePage();

    expectHomeMhaBillboard();
    expectHomeMathBlockTitle();
    expectHomeMathBillboardWithoutPhoto();
  });

  it('falls back to the static home columns layout when managed settings become unusable', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'home_ministry_allies',
          kind: 'billboard',
          mode: 'static',
          settings: {
            title: '',
            bodyHtml: '',
          },
        },
        {
          id: 'home_do_the_math',
          kind: 'billboard',
          mode: 'dynamic',
          settings: {
            title: '',
            titleHighlightsJson: '',
            body: '',
            buttonLabel: '',
            buttonUrl: '',
          },
        },
      ],
    };

    renderHomePage();

    expectHomeMhaBillboard();
    expectHomeMathBlockTitle();
    expectHomeMathBillboardWithoutPhoto();
  });

  it('renders managed home math billboard content on the canonical renderer contract', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'home_ministry_allies',
          kind: 'billboard',
          mode: 'static',
          settings: {
            title: 'Ministry allies.',
          },
        },
        {
          id: 'home_do_the_math',
          kind: 'billboard',
          mode: 'dynamic',
          settings: {
            title: 'Compare the paths.',
            body: 'Tune the whole section from the HUD.',
          },
        },
      ],
    };

    renderHomePage();

    expect(screen.getByText('Compare the paths.')).toBeTruthy();
    expect(screen.getByText('Tune the whole section from the HUD.')).toBeTruthy();
    expectHomeMathBillboardWithoutPhoto({ requireHighlight: false });
  });

  it('passes through inserted dynamic site features on the shared home renderer path', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'story_shell',
          kind: 'site_feature',
          mode: 'dynamic',
          settings: {
            featureId: 'editorial_spotlight',
          },
        },
      ],
    };

    renderHomePage();

    expect(screen.getByText('Steady stories deserve careful presentation.')).toBeTruthy();
    expect(screen.getByText(/Layout and motion stay in code/i)).toBeTruthy();
  });

  it('does not render stale dynamic impact stat blocks after the canonical home impact story', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'impact_stat',
          kind: 'impact_stat',
          mode: 'dynamic',
          settings: {
            titlePrefix: 'Measured ministry',
            highlight: 'impact',
            body: 'Still supported on the home shared renderer path.',
            countUp: true,
            ctaLabel: 'Tell me more',
            ctaPath: '/about-us/impact',
            stat1Value: '$11 billion',
            stat1Label: 'assets under management',
            stat1Tone: 'mango',
            stat2Value: '1,583',
            stat2Label: 'ministries supported',
            stat2Tone: 'atlantean',
          },
        },
      ],
    };

    renderHomePage();

    expect(screen.queryByRole('heading', { name: /Measured ministry impact/i })).toBeNull();
    expect(screen.queryByText('Still supported on the home shared renderer path.')).toBeNull();
  });
});
