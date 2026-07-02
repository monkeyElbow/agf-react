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
          id: 'columns_mha',
          kind: 'columns',
          mode: 'dynamic',
          settings: {
            bgTone: 'sand',
            contentWidth: 'content',
            columns: 'two',
            col1Type: 'photo',
            col1ImageUrl: 'mha-photo.jpg',
            col1ImageAlt: 'Retired couple reviewing financial paperwork',
            col2Type: 'text',
            col2Title: 'Ministers Housing Allowance',
            col2Body: 'This significant tax-saving benefit is available to retired ministers through the AGFinancial 403(b) plan.',
            col2ButtonLabel: 'See the details',
            col2ButtonUrl: '/services/retirement/403b#housing',
          },
        },
        {
          id: 'columns_math',
          kind: 'columns',
          mode: 'static',
          settings: {
            bgTone: 'white',
            contentWidth: 'content',
            columns: 'two',
            col1Type: 'text',
            col1Title: '(let us) Do the math.',
            col1Body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
            col1ButtonLabel: 'Use the calculators',
            col1ButtonUrl: '/calculators',
            col2Type: 'photo',
            col2ImageUrl: 'math-photo.jpg',
            col2ImageAlt: 'Calculator and notebook',
          },
        },
      ],
    };

    renderHomePage();

    expect(screen.getByText('Ministers Housing Allowance')).toBeTruthy();
    expectHomeMathBlockTitle();
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

  it('keeps static home columns visible even if a managed static record is hidden', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'columns_mha',
          kind: 'columns',
          mode: 'static',
          hidden: true,
          settings: {
            bgTone: 'sand',
            contentWidth: 'content',
            columns: 'two',
            col1Type: 'photo',
            col1ImageUrl: 'mha-photo.jpg',
            col1ImageAlt: 'Retired couple reviewing financial paperwork',
            col2Type: 'text',
            col2Title: 'Ministers Housing Allowance',
          },
        },
        {
          id: 'columns_math',
          kind: 'columns',
          mode: 'static',
          settings: {
            bgTone: 'white',
            contentWidth: 'content',
            columns: 'two',
            col1Type: 'text',
            col1Title: '(let us) Do the math.',
            col2Type: 'photo',
            col2ImageUrl: 'math-photo.jpg',
          },
        },
      ],
    };

    renderHomePage();

    expect(screen.getByText('Ministers Housing Allowance')).toBeTruthy();
    expectHomeMathBlockTitle();
  });

  it('falls back to the static home columns layout when managed settings become unusable', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'columns_mha',
          kind: 'columns',
          mode: 'static',
          settings: {
            bgTone: 'sand',
            contentWidth: 'content',
            columns: 'two',
            col1Type: 'photo',
            col1ImageUrl: 'mha-photo.jpg',
            col1ImageAlt: 'Retired couple reviewing financial paperwork',
            col2Type: 'photo',
            col2ImageUrl: 'bad-second-photo.jpg',
            col2ImageAlt: 'Incorrect second photo',
            col2Title: '',
            col2Body: '',
            col2ButtonLabel: '',
          },
        },
        {
          id: 'columns_math',
          kind: 'columns',
          mode: 'dynamic',
          settings: {
            bgTone: 'white',
            contentWidth: 'content',
            columns: 'two',
            col1Type: 'photo',
            col1ImageUrl: 'bad-first-photo.jpg',
            col1ImageAlt: 'Incorrect first photo',
            col1Title: '',
            col1Body: '',
            col1ButtonLabel: '',
            col2Type: 'photo',
            col2ImageUrl: 'math-photo.jpg',
            col2ImageAlt: 'Calculator and notebook',
            col2Title: '',
            col2Body: '',
            col2ButtonLabel: '',
          },
        },
      ],
    };

    renderHomePage();

    expect(screen.getByText('Ministers Housing Allowance')).toBeTruthy();
    expectHomeMathBlockTitle();
  });

  it('keeps richer dynamic home columns visible when the layout switches away from the legacy split', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'columns_mha',
          kind: 'columns',
          mode: 'static',
          settings: {
            bgTone: 'sand',
            contentWidth: 'content',
            columns: 'two',
            col1Type: 'photo',
            col1ImageUrl: 'mha-photo.jpg',
            col1ImageAlt: 'Retired couple reviewing financial paperwork',
            col2Type: 'text',
            col2Title: 'Ministers Housing Allowance',
          },
        },
        {
          id: 'columns_math',
          kind: 'columns',
          mode: 'dynamic',
          settings: {
            columnsStyle: 'loans-value',
            bgTone: 'white',
            contentWidth: 'browser',
            columns: 'three',
            title: 'Compare the paths.',
            leadLine: 'Tune the whole section from the HUD.',
            followupLine: 'This should not fall back to the static split.',
            col1Enabled: true,
            col1Type: 'text',
            col1Title: 'First option',
            col1Body: 'Test one',
            col2Enabled: true,
            col2Type: 'text',
            col2Title: 'Second option',
            col2Body: 'Test two',
            col3Enabled: true,
            col3Type: 'text',
            col3Title: 'Third option',
            col3Body: 'Test three',
            col4Enabled: false,
          },
        },
      ],
    };

    renderHomePage();

    expect(screen.getByText('Compare the paths.')).toBeTruthy();
    expect(screen.getByText('Tune the whole section from the HUD.')).toBeTruthy();
    expect(screen.getByText('Third option')).toBeTruthy();
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
