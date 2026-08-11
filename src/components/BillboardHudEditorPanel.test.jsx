import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BillboardHudEditorPanel, { normalizeBillboardWidth } from './BillboardHudEditorPanel';

describe('BillboardHudEditorPanel reference layout', () => {
  it('normalizes width controls to the renderer bounds and uses nullish Auto values', () => {
    expect(normalizeBillboardWidth('500')).toBe(560);
    expect(normalizeBillboardWidth('1450')).toBe(1440);
    expect(normalizeBillboardWidth('')).toBeNull();
    expect(normalizeBillboardWidth(null)).toBeNull();
  });

  it('uses an icon-driven rail to reveal one focused control group at a time', () => {
    render(<BillboardHudEditorPanel title="A headline" subtitle="Supporting copy" />);

    expect(screen.getByRole('navigation', { name: 'Billboard editor sections' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Heading settings' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Copy settings' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('region', { name: 'Copy settings' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Heading settings' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    expect(screen.getByRole('region', { name: 'Buttons settings' })).toBeTruthy();
    expect(screen.getByText('Preview button')).toBeTruthy();
  });

  it('uses section columns for button controls and preview instead of labeled parent divs', () => {
    render(<BillboardHudEditorPanel title="A headline" subtitle="Supporting copy" />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));

    expect(screen.getByRole('region', { name: 'Button 1 controls' }).tagName).toBe('SECTION');
    expect(screen.getByRole('region', { name: 'Button 2 controls' }).tagName).toBe('SECTION');
    expect(screen.getByRole('region', { name: 'Button preview' }).tagName).toBe('SECTION');
  });

  it('uses the rich HTML editor for billboard body HTML', () => {
    const onBodyHtmlChange = vi.fn();
    const onBodyHtmlBlur = vi.fn();
    render(
      <BillboardHudEditorPanel
        title="A headline"
        subtitle="Supporting copy"
        bodyHtml="<p>Rich body</p>"
        onBodyHtmlChange={onBodyHtmlChange}
        onBodyHtmlBlur={onBodyHtmlBlur}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByText('Body HTML')).toBeTruthy();
    expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Body HTML' }).tagName).toBe('DIV');
    expect(screen.getByTitle('Bold')).toBeTruthy();
    expect(screen.getByTitle('Italic')).toBeTruthy();
  });

  it('keeps heading typography controls in the heading panel and sends numeric title weight', () => {
    const onTitleFontWeightChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        title="A headline"
        subtitle="Supporting copy"
        titleFontWeight={700}
        titleWeightOptions={[600, 700, 800, 900]}
        onTitleFontWeightChange={onTitleFontWeightChange}
      />,
    );

    expect(screen.getByText('Title size')).toBeTruthy();
    expect(screen.getByText('Subtitle size')).toBeTruthy();
    expect(screen.getByText('Title font')).toBeTruthy();
    expect(screen.getByText('Title weight')).toBeTruthy();
    expect(screen.queryByText('Subtitle style')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '600' }));
    expect(onTitleFontWeightChange).toHaveBeenCalledWith(600);
  });
});
