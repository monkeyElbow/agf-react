import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NewsletterSignupForm from './NewsletterSignupForm';

void [NewsletterSignupForm];

describe('NewsletterSignupForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a validation error for an invalid email address', () => {
    render(<NewsletterSignupForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Join the list' }));

    expect(screen.getByRole('alert').textContent).toContain('Enter a valid email address to continue.');
  });

  it('shows the local prototype handoff message after submit', async () => {
    render(<NewsletterSignupForm />);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'person@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join the list' }));

    expect(screen.getByRole('button', { name: 'Joining…' })).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(260);
      await Promise.resolve();
    });

    expect(screen.getByRole('status').textContent).toContain(
      'Thanks. This native form is in place, but the Constant Contact handoff is still deferred in this local prototype.',
    );
  });
});
