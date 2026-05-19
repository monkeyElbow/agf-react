import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ImpactProofStoryFeature from './ImpactProofStoryFeature';

const DEFAULT_PROPS = {
  headline: 'Impact highlights',
  body: '',
  metrics: [
    {
      value: '1400',
      eyebrow: 'Loans',
      label: 'ministries supported by loans.',
      body: 'Over the last 10 years, those ministries represent more than 945,000 people.',
      tone: 'atlantean',
      action: { label: 'Explore Loans', to: '/services/loans' },
    },
    {
      value: '$450 Million',
      eyebrow: 'Legacy Giving',
      label: 'under trusted care for future ministry.',
      body: 'Legacy plans, charitable tools, and long-horizon stewardship are organized with the kind of discipline that lets generosity keep working for the Kingdom.',
      tone: 'mango',
      action: { label: 'Plan with us', to: '/services/legacy-giving' },
    },
    {
      value: '5,117',
      eyebrow: 'Insurance',
      label: 'mission trips covered with protection in place.',
      body: 'Teams can travel, serve, and respond quickly because practical coverage is already handled before the wheels ever leave the runway.',
      tone: 'super-grey',
      action: { label: 'Cover your trip', to: '/services/insurance' },
    },
    {
      value: '29,000+',
      eyebrow: 'Retirement',
      label: 'ministers retiring with AGFinancial.',
      body: 'Retirement planning that respects decades of calling and helps leaders step into the next season with structure, confidence, and care.',
      tone: 'atlantean-dark',
      action: { label: 'Start your plan', to: '/services/retirement' },
    },
  ],
  action: null,
  resolveTo: (value, fallback = '/') => value || fallback,
};

function renderFeature(overrides = {}) {
  return render(
    <MemoryRouter>
      <ImpactProofStoryFeature
        {...DEFAULT_PROPS}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe('ImpactProofStoryFeature', () => {
  it('renders all proof items in one editorial reading flow and drops the old kicker label', () => {
    const { container } = renderFeature();
    const shell = container.querySelector('.impact-proof-story-shell');

    expect(shell?.getAttribute('data-proof-layout')).toBe('editorial-stack');
    expect(shell?.getAttribute('data-proof-focus')).toBe('reading-flow');
    expect(screen.queryByText('Impact highlights')).toBeNull();
    expect(container.querySelector('.impact-proof-story-summary')).toBeNull();
    expect(container.querySelector('.impact-proof-story-stage')).toBeNull();
    expect(container.querySelector('.impact-proof-story-proof-rule')).toBeNull();
    expect(container.querySelectorAll('.impact-proof-story-proof')).toHaveLength(4);
    expect(container.querySelectorAll('.impact-proof-story-proof.fade-up')).toHaveLength(0);
    expect(container.querySelectorAll('.impact-proof-story-proof-content.fade-up.fade-out')).toHaveLength(4);
    expect(container.querySelectorAll('.impact-proof-story-proof.is-left')).toHaveLength(2);
    expect(container.querySelectorAll('.impact-proof-story-proof.is-right')).toHaveLength(2);
    expect(screen.getByText('ministries supported by loans.')).toBeTruthy();
    expect(screen.getByText('Over the last 10 years, those ministries represent more than 945,000 people.')).toBeTruthy();
    expect(screen.getByText('under trusted care for future ministry.')).toBeTruthy();
    expect(screen.getByText('mission trips covered with protection in place.')).toBeTruthy();
    expect(screen.getByText('ministers retiring with AGFinancial.')).toBeTruthy();
  });

  it('keeps every metric CTA readable in the same static layout across viewports', () => {
    const { container } = renderFeature();

    expect(screen.getByRole('link', { name: 'Explore Loans' }).getAttribute('href')).toBe('/services/loans');
    expect(screen.getByRole('link', { name: 'Plan with us' }).getAttribute('href')).toBe('/services/legacy-giving');
    expect(screen.getByRole('link', { name: 'Cover your trip' }).getAttribute('href')).toBe('/services/insurance');
    expect(screen.getByRole('link', { name: 'Start your plan' }).getAttribute('href')).toBe('/services/retirement');
    expect(container.querySelector('.impact-proof-story-proof-value.is-tone-atlantean')).toBeTruthy();
    expect(container.querySelector('.impact-proof-story-proof-value.is-tone-mango')).toBeTruthy();
    expect(container.querySelector('.impact-proof-story-proof-value.is-tone-super-grey')).toBeTruthy();
    expect(container.querySelector('.impact-proof-story-proof-value.is-tone-atlantean-dark')).toBeTruthy();
  });
});
