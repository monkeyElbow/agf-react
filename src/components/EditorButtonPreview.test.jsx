import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorButtonPreview } from './block-editors/migratedBlockEditors';

describe('EditorButtonPreview', () => {
  it('uses the selected tone for solid and dark button previews', () => {
    render(
      <EditorButtonPreview
        buttons={[
          { label: 'Solid action', style: 'blue', tone: 'mango' },
          { label: 'Dark action', style: 'dark', tone: 'melon' },
        ]}
      />,
    );

    const preview = screen.getByRole('region', { name: 'Button preview' });
    expect(within(preview).getByRole('button', { name: 'Solid action' }).className).toContain('is-tone-mango');
    expect(within(preview).getByRole('button', { name: 'Dark action' }).className).toContain('is-tone-melon');
  });

  it('does not render a button for an empty label and hides an empty preview', () => {
    const { rerender } = render(
      <EditorButtonPreview buttons={[{ label: '', style: 'blue', tone: 'atlantean' }]} />,
    );

    expect(screen.queryByRole('region', { name: 'Button preview' })).toBeNull();

    rerender(
      <EditorButtonPreview
        buttons={[
          { label: 'Keep this one', style: 'outline', tone: 'super-grey' },
          { label: '  ', style: 'blue', tone: 'mango' },
        ]}
      />,
    );

    const preview = screen.getByRole('region', { name: 'Button preview' });
    expect(within(preview).getByRole('button', { name: 'Keep this one' })).toBeTruthy();
    expect(within(preview).queryByRole('button', { name: 'Button 2' })).toBeNull();
  });
});
