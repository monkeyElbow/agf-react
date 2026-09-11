import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import HudInputDiagnostics from './HudInputDiagnostics';
import {
  formatHudDiagnosticValue,
  getHudInputDiagnosticKey,
  updateHudInputDiagnostic,
} from '../lib/hudInputDiagnostics';

describe('HudInputDiagnostics', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows current authority state and propagated boundary events', () => {
    const diagnosticKey = getHudInputDiagnosticKey('/services/loans', 'loan_options');
    updateHudInputDiagnostic(diagnosticKey, {
      lastControlEvent: {
        settingKey: 'cardTitleSizeRem',
        incomingValue: '1.4',
        timestamp: '2026-09-09T12:00:00.000Z',
      },
      lastEditorCallback: {
        fired: true,
        outcome: 'accepted',
        reason: '',
        timestamp: '2026-09-09T12:00:00.000Z',
      },
      lastPagePatch: {
        received: true,
        settingKey: 'cardTitleSizeRem',
        value: '1.4',
        timestamp: '2026-09-09T12:00:00.000Z',
      },
      lastLocalDraftUpdate: {
        blockChanged: true,
      },
    });

    render(
      <HudInputDiagnostics
        diagnosticKey={diagnosticKey}
        route="/services/loans"
        block={{ id: 'loan_options', kind: 'card_grid' }}
        activePanelId="loan-options"
        currentClient={{ userId: 'dev-user-2', displayName: 'Nathan' }}
        collaboration={{ lockedBy: { userId: 'dev-user-2', displayName: 'Nathan' } }}
        ownership={{ state: 'editing-self', owner: { userId: 'dev-user-2' } }}
        canEdit
        isOwnedByMe
        callbackMode="REAL callback"
        defaultOpen
      />,
    );

    expect(screen.getAllByText('dev-user-2 (Nathan)')).toHaveLength(2);
    expect(screen.getByText('editing-self')).toBeTruthy();
    expect(screen.getByText('cardTitleSizeRem = 1.4 @ 2026-09-09T12:00:00.000Z')).toBeTruthy();
    expect(screen.getByText('yes / accepted')).toBeTruthy();
    expect(screen.getByText('yes / cardTitleSizeRem = 1.4')).toBeTruthy();
    expect(screen.getByText('block changed yes')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy HUD input diagnostics' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Hide HUD input diagnostics' }));
    expect(screen.getByRole('button', { name: 'DEV · HUD diagnostics' })).toBeTruthy();
  });

  it('redacts sensitive values from the diagnostic readout', () => {
    expect(formatHudDiagnosticValue('nathan@example.com', 'email')).toBe('[redacted]');
    expect(formatHudDiagnosticValue('Bearer abc123', 'setting')).toBe('[redacted]');
    expect(formatHudDiagnosticValue('visible value', 'title')).toBe('visible value');
  });

});
