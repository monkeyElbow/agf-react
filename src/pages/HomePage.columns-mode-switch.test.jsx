import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentAdminProvider, useContentAdmin } from '../context/ContentAdminContext';
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
      onClick={() => updateBlock('/', 'columns_math', { mode: 'dynamic' })}
    >
      Switch math dynamic
    </button>
  );
}

void [HomeColumnsModeSwitchHarness];

function expectHomeMathBlockTitle() {
  expect(screen.getByText((_, node) => String(node?.textContent || '').trim() === '(let us) Do the math.')).toBeTruthy();
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

    expect(screen.getByText('Ministers Housing Allowance')).toBeTruthy();
    expectHomeMathBlockTitle();

    fireEvent.click(screen.getByRole('button', { name: 'Switch math dynamic' }));

    expect(screen.getByText('Ministers Housing Allowance')).toBeTruthy();
    expectHomeMathBlockTitle();
  });
});
