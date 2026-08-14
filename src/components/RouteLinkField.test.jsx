import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RouteLinkField from './RouteLinkField';

describe('RouteLinkField', () => {
  it('makes an approved internal page the primary target and keeps URL override explicit', () => {
    const onRouteLinkChange = vi.fn();

    render(
      <RouteLinkField
        routeOptions={[
          { title: 'Contact Us', path: '/contact-us' },
          { title: 'Loans', path: '/services/loans' },
        ]}
        onRouteLinkChange={onRouteLinkChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Search pages'), { target: { value: 'contact' } });
    expect(within(screen.getByRole('listbox', { name: 'Matching pages' })).getByRole('option', { name: /Contact Us/ })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Select internal page'), {
      target: { value: '/contact-us' },
    });
    expect(onRouteLinkChange).toHaveBeenCalledWith('/contact-us', '/contact-us');

    fireEvent.change(screen.getByLabelText('URL/path override'), {
      target: { value: 'https://secure.agfinancial.org/' },
    });
    expect(onRouteLinkChange).toHaveBeenLastCalledWith('https://secure.agfinancial.org/', '');
  });
});
