import { createElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteFeatureBlockEditor } from './block-editors/migratedBlockEditors';

function createBlock(overrides = {}) {
  const { settings: rawSettingsOverrides, ...restOverrides } = overrides || {};
  const settingsOverrides = rawSettingsOverrides && typeof rawSettingsOverrides === 'object'
    ? rawSettingsOverrides
    : {};
  return {
    id: 'story_shell',
    kind: 'site_feature',
    mode: 'dynamic',
    settings: {
      featureId: 'editorial_spotlight',
      headline: 'Original headline',
      body: 'Original body copy.',
      buttonLabel: 'Contact AGFinancial',
      buttonUrl: '/contact',
      buttonPageRef: '/contact',
      buttonOpenInNewWindow: false,
      ...settingsOverrides,
    },
    ...restOverrides,
  };
}

describe('SiteFeatureBlockEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('keeps site-feature text drafts stable through stale upstream rerenders', () => {
    const onSettingChange = vi.fn();
    const routeOptions = [{ title: 'Contact', path: '/contact' }];
    const { rerender } = render(
      createElement(SiteFeatureBlockEditor, {
        block: createBlock(),
        onSettingChange,
        routeOptions,
      }),
    );

    const headlineInput = screen.getByLabelText('Headline override');
    fireEvent.change(headlineInput, { target: { value: 'Draft headline' } });

    expect(headlineInput.value).toBe('Draft headline');
    expect(onSettingChange).not.toHaveBeenCalledWith('headline', 'Draft headline');

    rerender(
      createElement(SiteFeatureBlockEditor, {
        block: createBlock({ settings: { headline: 'Original headline' } }),
        onSettingChange,
        routeOptions,
      }),
    );

    expect(screen.getByLabelText('Headline override').value).toBe('Draft headline');

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onSettingChange).toHaveBeenCalledWith('headline', 'Draft headline');
  });

  it('renders the CTA URL editor on its own full-width row and preserves route refs', () => {
    const onSettingChange = vi.fn();
    render(
      createElement(SiteFeatureBlockEditor, {
        block: createBlock(),
        onSettingChange,
        routeOptions: [
          { title: 'Contact', path: '/contact' },
          { title: 'Forms', path: '/forms' },
        ],
      }),
    );

    const ctaUrlInput = screen.getByLabelText('CTA URL / Path override');
    expect(ctaUrlInput.closest('label')?.className).toContain('admin-site-feature-field--full');

    fireEvent.change(ctaUrlInput, { target: { value: '/forms' } });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onSettingChange).toHaveBeenCalledWith('buttonUrl', '/forms');
    expect(onSettingChange).toHaveBeenCalledWith('buttonPageRef', '/forms');
  });

  it('keeps the home impact story editor surface limited to headline, body, and CTA path overrides', () => {
    render(
      createElement(SiteFeatureBlockEditor, {
        block: createBlock({
          settings: {
            featureId: 'home_impact_story',
          },
        }),
        onSettingChange: vi.fn(),
        routeOptions: [],
      }),
    );

    expect(screen.getByLabelText('Headline override')).toBeTruthy();
    expect(screen.getByLabelText('Body override')).toBeTruthy();
    expect(screen.getByLabelText('CTA label override')).toBeTruthy();
    expect(screen.getByLabelText('CTA URL / Path override')).toBeTruthy();
    expect(screen.queryByLabelText('Open CTA in new window')).toBeNull();
  });

  it('keeps the planned giving stewardship story editor surface limited to headline and CTA overrides', () => {
    render(
      createElement(SiteFeatureBlockEditor, {
        block: createBlock({
          settings: {
            featureId: 'legacy_giving_stewardship_story',
          },
        }),
        onSettingChange: vi.fn(),
        routeOptions: [],
      }),
    );

    expect(screen.getByLabelText('Headline override')).toBeTruthy();
    expect(screen.queryByLabelText('Body override')).toBeNull();
    expect(screen.getByLabelText('CTA label override')).toBeTruthy();
    expect(screen.getByLabelText('CTA URL / Path override')).toBeTruthy();
    expect(screen.queryByLabelText('Open CTA in new window')).toBeNull();
  });

  it('keeps the impact proof story editor surface limited to body and CTA path overrides', () => {
    render(
      createElement(SiteFeatureBlockEditor, {
        block: createBlock({
          settings: {
            featureId: 'impact_proof_story',
          },
        }),
        onSettingChange: vi.fn(),
        routeOptions: [],
      }),
    );

    expect(screen.queryByLabelText('Headline override')).toBeNull();
    expect(screen.getByLabelText('Body override')).toBeTruthy();
    expect(screen.getByLabelText('CTA label override')).toBeTruthy();
    expect(screen.getByLabelText('CTA URL / Path override')).toBeTruthy();
    expect(screen.queryByLabelText('Open CTA in new window')).toBeNull();
  });
});
