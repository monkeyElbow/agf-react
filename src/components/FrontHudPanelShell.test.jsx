import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentAdminContext } from '../context/ContentAdminContext';
import { FrontHudContext } from '../context/FrontHudContext';
import FrontHudPanelShell from './FrontHudPanelShell';

describe('FrontHudPanelShell block workflow controls', () => {
  it('keeps the block name bar free of ownership and publish actions', () => {
    const setEnabled = vi.fn();
    const onOwnershipAction = vi.fn();
    const releaseActiveBlockDraft = vi.fn();
    const publishSharedBlockNow = vi.fn();

    render(
      <ContentAdminContext.Provider value={{ releaseActiveBlockDraft, publishSharedBlockNow }}>
        <FrontHudContext.Provider value={{ enabled: true, setEnabled }}>
          <FrontHudPanelShell
            title="Request form"
            blockId="request_form"
            pathname="/services/planned-giving/endowments"
            ownership={{ state: 'drafted-other' }}
            onOwnershipAction={onOwnershipAction}
            onClose={vi.fn()}
          >
            <p>Editor</p>
          </FrontHudPanelShell>
        </FrontHudContext.Provider>
      </ContentAdminContext.Provider>,
    );

    const header = screen.getByText('Request form').closest('.admin-front-hud-tool-head');
    expect(header?.querySelector('.admin-front-hud-header-actions')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Take over draft' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Release draft' })).toBeNull();
    expect(onOwnershipAction).not.toHaveBeenCalled();
    expect(releaseActiveBlockDraft).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Make block live' })).toBeNull();
    expect(setEnabled).not.toHaveBeenCalled();
    expect(publishSharedBlockNow).not.toHaveBeenCalled();
  });

  it('publishes an owned block without requiring page publish', () => {
    const publishSharedBlockNow = vi.fn();

    render(
      <ContentAdminContext.Provider value={{ publishSharedBlockNow }}>
        <FrontHudContext.Provider value={{ enabled: true, setEnabled: vi.fn() }}>
          <FrontHudPanelShell
            title="Hero"
            blockId="hero"
            pathname="/services/loans"
            ownership={{ state: 'owned-self' }}
            onClose={vi.fn()}
          >
            <p>Editor</p>
          </FrontHudPanelShell>
        </FrontHudContext.Provider>
      </ContentAdminContext.Provider>,
    );

    expect(screen.queryByRole('button', { name: 'Make block live' })).toBeNull();
    expect(publishSharedBlockNow).not.toHaveBeenCalled();
  });
});
