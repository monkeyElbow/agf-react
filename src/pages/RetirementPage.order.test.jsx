import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';

const state = vi.hoisted(() => ({ blocks: [] }));

vi.mock('../context/ContentAdminContextCore', () => ({
  useContentAdmin: () => ({
    blocksByPath: { '/services/retirement': state.blocks },
    pageHierarchy: {
      '/services/retirement': { path: '/services/retirement', title: 'Retirement' },
      '/services/retirement/403b': { path: '/services/retirement/403b', title: '403(b)' },
    },
    resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    setActiveBlockLock: vi.fn(() => ({ ok: true })),
    getBlockCollaboration: vi.fn(() => null),
    devIdentity: null,
    claimBufferedBlockEdit: vi.fn(() => false),
    commitBlockSettingsPatch: vi.fn(() => false),
    registerExternalDraftFlushHandler: vi.fn(),
    registerExternalDraftStatusHandler: vi.fn(),
  }),
}));

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({ enabled: false, opacity: 15 }),
}));

vi.mock('../context/TestimonialsContext', () => ({
  useTestimonials: () => ({ testimonials: [] }),
}));

vi.mock('../hooks/useNativeEnhancements', () => ({
  default: () => {},
}));

vi.mock('../hooks/useHudDockOrder', () => ({
  default: () => ({
    orderedPanels: [],
    getDockTabDragProps: () => ({}),
    isPanelDragging: () => false,
    isPanelDragOver: () => false,
    getPanelDropPosition: () => '',
    isDockDragging: false,
  }),
}));

import RetirementPage from './RetirementPage';

function cloneRetirementBlocks() {
  return contentBlockBlueprintsByPath['/services/retirement'].map((block) => ({
    ...block,
    hidden: false,
    settings: { ...(block.settings || {}) },
  }));
}

describe('RetirementPage managed order', () => {
  it('renders the saved block sequence in DOM order', () => {
    const sourceBlocks = cloneRetirementBlocks();
    const savedOrder = [
      'columns_math',
      'cta_form',
      'hero',
      'testimonials',
      'intro',
      'billboard',
      'retirement_plan_feature',
      'rollover_billboard',
      'split_options',
    ];
    state.blocks = savedOrder.map((id) => sourceBlocks.find((block) => block.id === id));

    const { container } = render(
      <MemoryRouter>
        <RetirementPage />
      </MemoryRouter>,
    );
    const managedRoot = container.querySelector('.retirement-native-page-content');
    const renderedOrder = Array.from(managedRoot.children)
      .map((element) => element.getAttribute('data-block-id'))
      .filter(Boolean);

    expect(renderedOrder).toEqual(savedOrder);
  });
});
