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

import PageBlocksRenderer, { BillboardBlock } from './PageBlocksRenderer';

function renderBlocks(blocks) {
  return render(
    <MemoryRouter>
      <PageBlocksRenderer blocks={blocks} />
    </MemoryRouter>,
  );
}

describe('PageBlocksRenderer source precedence', () => {
  it('preserves Billboard CTA reveal metadata for the page action renderer', () => {
    const actionRenderer = vi.fn((action, key) => (
      <button key={key} type="button" data-action={action.action} data-target={action.targetBlockId}>
        {action.label}
      </button>
    ));

    render(
      <MemoryRouter>
        <BillboardBlock
          block={{
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Ready to talk?',
              buttonLabel: 'Open the form',
              buttonAction: 'open_cta_form',
              buttonTargetBlockId: 'contact_form',
              buttonStyle: 'outline',
              buttonTone: 'mango',
            },
          }}
          resolveTo={(value) => value}
          actionRenderer={actionRenderer}
        />
      </MemoryRouter>,
    );

    expect(actionRenderer).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Open the form' })).toMatchObject({
      dataset: {
        action: 'open_cta_form',
        target: 'contact_form',
      },
    });
  });

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

  it('keeps the saved billboard body color class on the direct renderer path', () => {
    const { container } = renderBlocks([{
      id: 'billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Edited title',
        bodyHtml: '<p>Color-controlled billboard copy.</p>',
        bodyColorClassName: 'is-atlantean',
        bgTone: 'white',
        textTone: 'dark',
      },
    }]);

    expect(container.querySelector('.native-info-rich-html')?.className).toContain('is-atlantean');
  });

  it('renders saved Billboard subtitle highlight ranges', () => {
    const { container } = renderBlocks([{
      id: 'billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Edited title',
        subtitle: 'Supporting copy',
        subtitleHighlightsJson: '[{"start":0,"end":10,"className":"is-mango","text":"Supporting"}]',
      },
    }]);

    const subtitle = container.querySelector('.home-native-billboard-subtitle');
    expect(subtitle?.querySelector('mark')?.className).toContain('is-mango');
    expect(subtitle?.querySelector('mark')?.textContent).toBe('Supporting');
  });

  it('keeps Billboard anchors and fineprint on the direct renderer path', () => {
    const { container } = renderBlocks([{
      id: 'billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Read the details',
        anchorId: 'billboard-details',
        fineprint: 'Terms and conditions apply.',
      },
    }]);

    const section = container.querySelector('[data-block-id="billboard"]');
    expect(section?.id).toBe('billboard-details');
    expect(screen.getByText('Terms and conditions apply.')).toBeTruthy();
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
