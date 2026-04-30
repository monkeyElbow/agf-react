import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearHomeReturnAssistState,
  dismissHomeReturnAssist,
  HOME_RETURN_ASSIST_MAX_AGE_MS,
  recordHomeReturnAssistNavigation,
  shouldShowHomeReturnAssist,
} from './homeReturnAssist';

describe('homeReturnAssist', () => {
  const serviceReturnPaths = [
    '/services',
    '/services/loans',
    '/services/investments',
    '/services/retirement',
    '/services/retirement/403b',
    '/services/insurance/mission-assure',
    '/services/legacy-giving/endowments',
  ];

  beforeEach(() => {
    window.sessionStorage.clear();
    clearHomeReturnAssistState();
  });

  it('does not show on a fresh home visit', () => {
    recordHomeReturnAssistNavigation('/');

    expect(shouldShowHomeReturnAssist('/')).toBe(false);
  });

  it.each(serviceReturnPaths)('shows on home after a same-session return from %s', (servicePath) => {
    recordHomeReturnAssistNavigation(servicePath, 1000);
    recordHomeReturnAssistNavigation('/', 1500);

    expect(shouldShowHomeReturnAssist('/', 1600)).toBe(true);
  });

  it.each(serviceReturnPaths)('shows on home during the immediate return render after leaving %s', (servicePath) => {
    recordHomeReturnAssistNavigation(servicePath, 1000);

    expect(shouldShowHomeReturnAssist('/', 1100)).toBe(true);
  });

  it('stays hidden until the user begins a new service return path after dismissal', () => {
    recordHomeReturnAssistNavigation('/services/retirement', 1000);
    recordHomeReturnAssistNavigation('/', 1400);

    dismissHomeReturnAssist();

    expect(shouldShowHomeReturnAssist('/', 1500)).toBe(false);

    recordHomeReturnAssistNavigation('/services/loans', 2000);
    recordHomeReturnAssistNavigation('/', 2300);

    expect(shouldShowHomeReturnAssist('/', 2400)).toBe(true);
  });

  it('expires after the recent-navigation window passes', () => {
    recordHomeReturnAssistNavigation('/services/investments', 1000);
    recordHomeReturnAssistNavigation('/', 1200);

    expect(shouldShowHomeReturnAssist('/', 1000 + HOME_RETURN_ASSIST_MAX_AGE_MS + 10)).toBe(false);
  });
});
