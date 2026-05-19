import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isHeroDriftDebugEnabled,
  logHeroDriftWarningOnce,
  resetHeroDriftWarningsForTests,
  shouldLogHeroDriftWarning,
} from './heroDriftWarnings';

function makeReport(repairedFields) {
  return {
    pathname: '/services/investments',
    hasDrift: true,
    repairedFields,
    signature: repairedFields.map((entry) => entry.field).join('|'),
  };
}

describe('hero drift warnings', () => {
  beforeEach(() => {
    resetHeroDriftWarningsForTests();
    window.localStorage.clear();
    delete window.__AGF_DEBUG_HERO_DRIFT__;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('suppresses warn-level output when only default headline size/tracking repairs were restored', () => {
    const report = makeReport([
      { field: 'titleSizeRem', label: 'Headline size', reason: 'restored' },
      { field: 'titleLetterSpacingEm', label: 'Headline tracking', reason: 'restored' },
    ]);

    expect(shouldLogHeroDriftWarning(report)).toBe(false);
  });

  it('keeps warning when drift includes substantive hero repairs', () => {
    const report = makeReport([
      { field: 'titleSizeRem', label: 'Headline size', reason: 'restored' },
      { field: 'animationPreset', label: 'Animation preset', reason: 'restored' },
    ]);

    expect(shouldLogHeroDriftWarning(report)).toBe(true);
  });

  it('re-enables suppressed drift warnings behind the debug localStorage flag', () => {
    window.localStorage.setItem('agf:debug:hero-drift', 'true');
    const report = makeReport([
      { field: 'titleSizeRem', label: 'Headline size', reason: 'restored' },
      { field: 'titleLetterSpacingEm', label: 'Headline tracking', reason: 'restored' },
    ]);

    expect(isHeroDriftDebugEnabled()).toBe(true);
    expect(shouldLogHeroDriftWarning(report)).toBe(true);
  });

  it('still logs each drift signature at most once per session', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const report = makeReport([
      { field: 'animationPreset', label: 'Animation preset', reason: 'restored' },
    ]);

    logHeroDriftWarningOnce(report, 'Investments hero');
    logHeroDriftWarningOnce(report, 'Investments hero');

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
