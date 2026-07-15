import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentAdminProvider, useContentAdmin } from '../context/ContentAdminContext';
import { homePageBlocks } from '../data/pageBlocks/homeBlocks';
import HomePage from './HomePage';

void [MemoryRouter, ContentAdminProvider, HomePage];

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

function HomeColumnsModeSwitchHarness() {
  const { updateBlock } = useContentAdmin();

  return (
    <button
      type="button"
      onClick={() => updateBlock('/', 'home_do_the_math', { mode: 'dynamic' })}
    >
      Switch math dynamic
    </button>
  );
}

void [HomeColumnsModeSwitchHarness];

function expectHomeMathBlockTitle() {
  expect(screen.getByText((_, node) => String(node?.textContent || '').trim() === '(let us) Do the math.')).toBeTruthy();
}

function expectHomeMathBillboardWithoutPhoto() {
  const block = document.querySelector('.home-native-billboard[data-block-id="home_do_the_math"]');
  expect(block).toBeTruthy();
  expect(screen.queryByAltText('Calculator and notebook')).toBeNull();
  expect(block.querySelector('.ag-panel-rail')).toBeTruthy();
  expect(block.querySelector('[data-home-math-badge="true"]')).toBeTruthy();
  expect(block.querySelectorAll('.home-math-badge-button')).toHaveLength(4);
  expect(block.querySelector('h2 mark.is-atlantean')).toBeTruthy();
  const action = block.querySelector('.service-native-action-row .service-native-btn');
  expect(action).toBeTruthy();
  expect(action.textContent).toContain('Use the calculators');
  expect(action.getAttribute('href')).toBe('/calculators');
}

function expectHomeMhaBillboard() {
  expect(screen.getByText('Ministry allies.')).toBeTruthy();
  expect(document.querySelector('.home-native-billboard[data-block-id="home_ministry_allies"]')).toBeTruthy();
}

function renderHomeWithProvider() {
  return render(
    <ContentAdminProvider>
      <MemoryRouter>
        <HomeColumnsModeSwitchHarness />
        <HomePage />
      </MemoryRouter>
    </ContentAdminProvider>,
  );
}

describe('HomePage home columns mode switch', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps both home columns visible when only do the math switches to dynamic', () => {
    renderHomeWithProvider();

    expectHomeMhaBillboard();
    expectHomeMathBlockTitle();
    expectHomeMathBillboardWithoutPhoto();

    fireEvent.click(screen.getByRole('button', { name: 'Switch math dynamic' }));

    expectHomeMhaBillboard();
    expectHomeMathBlockTitle();
    expectHomeMathBillboardWithoutPhoto();
  });

  it('keeps the home do-the-math seed canonical as a billboard block', () => {
    const block = homePageBlocks.find((entry) => entry?.id === 'home_do_the_math');

    expect(block).toMatchObject({
      id: 'home_do_the_math',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: '(let us) Do the math.',
        buttonLabel: 'Use the calculators',
      },
    });
    expect(block?.type).toBeUndefined();
    expect(block?.settings?.col1Type).toBeUndefined();
  });
});
