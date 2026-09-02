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

  it('renders the CTA URL editor on its own full-width row and writes canonical links', () => {
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

    expect(onSettingChange).toHaveBeenCalledWith('buttonLinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/forms"}');
    expect(onSettingChange).not.toHaveBeenCalledWith('buttonUrl', '/forms');
    expect(onSettingChange).not.toHaveBeenCalledWith('buttonPageRef', '/forms');
  });

  it('exposes the home impact story metrics as a repeatable collection', () => {
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
    expect(screen.getByText('Impact metrics')).toBeTruthy();
    expect(screen.getAllByLabelText('Metric value')).toHaveLength(3);
    expect(screen.getByLabelText('Open CTA in new window')).toBeTruthy();
  });

  it('exposes planned giving stewardship beats as a repeatable collection', () => {
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
    expect(screen.getByText('Story beats')).toBeTruthy();
    expect(screen.getAllByLabelText('Story copy')).toHaveLength(4);
    expect(screen.queryByLabelText('Body override')).toBeNull();
    expect(screen.queryByLabelText('CTA label override')).toBeNull();
    expect(screen.queryByLabelText('CTA URL / Path override')).toBeNull();
    expect(screen.queryByLabelText('Open CTA in new window')).toBeNull();
  });

  it('exposes impact proof cards and introduction fields', () => {
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
    expect(screen.getByText('Impact proof cards')).toBeTruthy();
    expect(screen.getByLabelText('Feature intro heading')).toBeTruthy();
    expect(screen.getByLabelText('Open CTA in new window')).toBeTruthy();
  });

  it('exposes History Gallery presentation controls beside its cards', () => {
    render(
      createElement(SiteFeatureBlockEditor, {
        block: createBlock({
          settings: {
            featureId: 'about_history_feature',
          },
        }),
        onSettingChange: vi.fn(),
        routeOptions: [],
      }),
    );

    expect(screen.getByText('History Gallery presentation')).toBeTruthy();
    expect(screen.getByLabelText('Card title size (rem)')).toBeTruthy();
    expect(screen.getByLabelText('Card title line height')).toBeTruthy();
    expect(screen.getByLabelText('Card body size (rem)')).toBeTruthy();
    expect(screen.getByLabelText('Card body line height')).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Card title color' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Card body color' })).toBeTruthy();
    expect(screen.getByText('History Gallery cards')).toBeTruthy();
  });

  it('keeps retirement panels on the panels page and exposes CTA target behavior', () => {
    const onSettingChange = vi.fn();
    render(
      createElement(SiteFeatureBlockEditor, {
        block: createBlock({
          settings: {
            featureId: 'retirement_plan_feature',
          },
        }),
        onSettingChange,
        routeOptions: [],
      }),
    );

    const collectionHeading = screen.getByText('Feature panels');
    const collection = collectionHeading.closest('[data-site-feature-collection]');
    expect(collection?.className).toContain('admin-site-feature-editor-page--panels');
    expect(collection?.className).toContain('admin-site-feature-collection--flat');
    expect(collectionHeading.closest('.admin-site-feature-collection-header')?.parentElement).toBe(collection);
    expect(collection?.querySelector('.admin-site-feature-collection-list')?.parentElement).toBe(collection);
    expect(collection?.parentElement?.className).toContain('admin-site-feature-editor');
    expect(screen.queryByText('Add, remove, and edit content without changing the feature layout.')).toBeNull();
    expect(screen.getAllByLabelText('Panel title')[0].tagName).toBe('TEXTAREA');
    expect(screen.getByLabelText('Open CTA in new window')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Open CTA in new window'));
    expect(onSettingChange).toHaveBeenCalledWith(
      'buttonLinkJson',
      '{"kind":"internal","openInNewWindow":true,"to":"/contact"}',
    );
  });
});
