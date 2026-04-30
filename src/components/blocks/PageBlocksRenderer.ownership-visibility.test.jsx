import { createElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PageBlocksRenderer from './PageBlocksRenderer';

vi.mock('../../context/ContentAdminContext', () => ({
  useContentAdmin: () => ({
    resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    getBlockCollaboration: () => ({
      savedBy: {
        userId: 'dev-sarah',
        displayName: 'Sarah',
      },
      savedAt: 1710000000000,
    }),
    devIdentity: {
      userId: 'dev-james',
      displayName: 'James',
    },
  }),
}));

function buildHeroBlock() {
  return {
    id: 'hero',
    kind: 'hero',
    mode: 'dynamic',
    bgTone: 'white',
    justify: 'left',
    line1Text: 'Plan with confidence.',
    line1ClassName: 'home-native-eyebrow',
    line1HighlightsJson: '[]',
    line2Text: 'Financial care.',
    line2ClassName: 'home-native-title line1 line2',
    line2HighlightsJson: '[]',
    line3Text: '',
    line3ClassName: 'home-native-title line3',
    line3HighlightsJson: '[]',
    button1Label: '',
    button1Url: '',
    button1PageRef: '',
  };
}

function renderRenderer(props = {}) {
  return render(
    createElement(
      MemoryRouter,
      null,
      createElement(PageBlocksRenderer, {
        blocks: [buildHeroBlock()],
        ...props,
      }),
    ),
  );
}

describe('PageBlocksRenderer ownership visibility', () => {
  it('hides ownership overlays when front HUD ownership is disabled', () => {
    const { container } = renderRenderer({ ownershipEnabled: false });

    expect(container.querySelector('.admin-block-ownership-overlay')).toBeNull();
    expect(container.querySelector('.home-native-hero')?.className).not.toContain('is-admin-owned');
  });

  it('shows ownership overlays when front HUD ownership is enabled', () => {
    const { container } = renderRenderer({ ownershipEnabled: true });

    expect(container.querySelector('.admin-block-ownership-overlay')).toBeTruthy();
    expect(container.querySelector('.home-native-hero')?.className).toContain('is-admin-owned-saved-other');
  });
});
