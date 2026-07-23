import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CharitableGiftTestDriveWidget from './CharitableGiftTestDriveWidget';

describe('CharitableGiftTestDriveWidget', () => {
  it('starts the gift annuity example at 100,000', () => {
    render(<CharitableGiftTestDriveWidget />);

    expect(screen.getByLabelText('Property Value ($)').value).toBe('100,000');
    expect(screen.getByText(/Gift of/).textContent).toContain('$100,000');
  });
});
