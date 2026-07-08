import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentAdminProvider, useContentAdmin } from '../context/ContentAdminContext';
import HomePage from './HomePage';
import AdminContentPage from './AdminContentPage';

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

vi.mock('../context/TestimonialsContext', () => ({
  useTestimonials: () => ({
    testimonials: [],
  }),
}));

function HomeAdminColumnsModeSwitchHarness() {
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

function renderHomeAndAdmin() {
  return render(
    <ContentAdminProvider>
      <MemoryRouter initialEntries={['/admin/content?page=/']}>
        <HomeAdminColumnsModeSwitchHarness />
        <AdminContentPage />
        <HomePage />
      </MemoryRouter>
    </ContentAdminProvider>,
  );
}

function expectHomeMathBlockTitle(container) {
  expect(within(container).getByText((_, node) => String(node?.textContent || '').trim() === '(let us) Do the math.')).toBeTruthy();
}

function expectHomeMathBillboardWithoutPhoto(container) {
  const block = container.querySelector('.home-native-billboard[data-block-id="home_do_the_math"]');
  expect(block).toBeTruthy();
  expect(within(container).queryByAltText('Calculator and notebook')).toBeNull();
  expect(block.querySelector('.ag-panel-rail')).toBeTruthy();
  expect(block.querySelector('h2 mark.is-atlantean')).toBeTruthy();
  const action = block.querySelector('.service-native-action-row .service-native-btn');
  expect(action).toBeTruthy();
  expect(action.textContent).toContain('Use the calculators');
  expect(action.getAttribute('href')).toBe('/calculators');
}

function expectHomeMhaBillboard(container) {
  expect(within(container).getByText('Ministry allies.')).toBeTruthy();
  expect(container.querySelector('.home-native-billboard[data-block-id="home_ministry_allies"]')).toBeTruthy();
}

describe('HomePage admin-driven columns mode switch', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps both home columns visible after reset content admin state', () => {
    renderHomeAndAdmin();

    const homePage = document.querySelector('.home-native-page');
    expect(homePage).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reset from seed' }));

    expectHomeMhaBillboard(homePage);
    expectHomeMathBlockTitle(homePage);
    expectHomeMathBillboardWithoutPhoto(homePage);
  });

  it('keeps both home columns visible when the admin switches do the math to dynamic', () => {
    renderHomeAndAdmin();

    const homePage = document.querySelector('.home-native-page');
    expect(homePage).toBeTruthy();

    expectHomeMhaBillboard(homePage);
    expectHomeMathBlockTitle(homePage);
    expectHomeMathBillboardWithoutPhoto(homePage);

    fireEvent.click(screen.getByRole('button', { name: 'Switch math dynamic' }));

    expectHomeMhaBillboard(homePage);
    expectHomeMathBlockTitle(homePage);
    expectHomeMathBillboardWithoutPhoto(homePage);
  });
});
