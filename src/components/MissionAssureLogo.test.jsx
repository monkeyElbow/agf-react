import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MissionAssureLogo from './MissionAssureLogo';

describe('MissionAssureLogo', () => {
  it('renders the reusable wordmark as an accessible SVG image', () => {
    const { container } = render(<MissionAssureLogo />);

    expect(screen.getByRole('img', { name: 'Mission Assure®' })).toBeTruthy();
    expect(container.querySelector('svg.mission-assure-logo')).not.toBeNull();
    expect(container.querySelector('svg.mission-assure-logo text')?.textContent).toContain('®');
  });

  it('supports decorative rendering when accessibility text should be suppressed', () => {
    const { container } = render(<MissionAssureLogo decorative className="test-logo" />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('svg.test-logo')).not.toBeNull();
  });
});
