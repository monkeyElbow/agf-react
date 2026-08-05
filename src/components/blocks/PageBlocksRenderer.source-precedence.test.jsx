import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../context/ContentAdminContextCore', async () => {
  const actual = await vi.importActual('../../context/ContentAdminContextCore');
  return {
    ...actual,
    useContentAdmin: () => ({
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
      getBlockCollaboration: () => null,
    }),
  };
});

import PageBlocksRenderer from './PageBlocksRenderer';

function renderBlocks(blocks) {
  return render(
    <MemoryRouter>
      <PageBlocksRenderer blocks={blocks} />
    </MemoryRouter>,
  );
}

describe('PageBlocksRenderer source precedence', () => {
  it('renders canonical nested title and body instead of stale top-level aliases', () => {
    renderBlocks([{
      id: 'billboard',
      kind: 'billboard',
      mode: 'dynamic',
      title: 'Stale title',
      body: 'Stale body',
      settings: {
        title: 'Edited title',
        body: 'Edited body',
        bgTone: 'white',
        textTone: 'dark',
      },
    }]);

    expect(screen.getByRole('heading', { name: 'Edited title' })).toBeTruthy();
    expect(screen.getByText('Edited body')).toBeTruthy();
    expect(screen.queryByText('Stale title')).toBeNull();
    expect(screen.queryByText('Stale body')).toBeNull();
  });

  it('preserves intentional empty canonical values and does not emit starter copy', () => {
    const { container } = renderBlocks([{
      id: 'newsletter',
      kind: 'newsletter',
      mode: 'dynamic',
      title: 'Stale title',
      body: 'Stale body',
      settings: {
        title: '',
        body: '',
        bodyHtml: '',
      },
    }]);

    expect(container.querySelector('h2')?.textContent).toBe('');
    expect(container.textContent).not.toContain('Stale title');
    expect(container.textContent).not.toContain('Stale body');
  });

  it('keeps an empty canonical hero line from inheriting a legacy alias', () => {
    renderBlocks([{
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      settings: {
        line1Text: '',
        eyebrow: 'Legacy alias',
        line2Text: 'Canonical line',
        bgTone: 'white',
      },
    }]);

    expect(screen.queryByText('Legacy alias')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Canonical line' })).toBeTruthy();
  });

  it('fails closed for a generic block with no visible editable content', () => {
    const { container } = renderBlocks([{
      id: 'billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: '',
        subtitle: '',
        body: '',
        bodyHtml: '',
        buttonLabel: '',
      },
    }]);

    expect(container.querySelector('[data-block-id="billboard"]')).toBeNull();
  });
});
