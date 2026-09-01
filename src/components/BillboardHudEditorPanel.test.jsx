import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BillboardHudEditorPanel, {
  normalizeBillboardBodyWidth,
  normalizeBillboardHeaderGap,
  normalizeBillboardPadding,
  normalizeBillboardWidth,
} from './BillboardHudEditorPanel';

describe('BillboardHudEditorPanel reference layout', () => {
  it('normalizes width controls to the renderer bounds and uses nullish Auto values', () => {
    expect(normalizeBillboardWidth('500')).toBe(560);
    expect(normalizeBillboardWidth('1450')).toBe(1440);
    expect(normalizeBillboardWidth('')).toBeNull();
    expect(normalizeBillboardWidth(null)).toBeNull();
    expect(normalizeBillboardBodyWidth('315')).toBe(320);
    expect(normalizeBillboardBodyWidth('645')).toBe(650);
    expect(normalizeBillboardBodyWidth('1210')).toBe(1200);
    expect(normalizeBillboardBodyWidth('')).toBeNull();
    expect(normalizeBillboardHeaderGap('1.17')).toBe(1.15);
    expect(normalizeBillboardHeaderGap('4.2')).toBe(4);
    expect(normalizeBillboardHeaderGap('')).toBeNull();
    expect(normalizeBillboardPadding('8.2')).toBe(8);
    expect(normalizeBillboardPadding('7.5')).toBe(7.5);
    expect(normalizeBillboardPadding('')).toBeNull();
  });

  it('uses an icon-driven rail to reveal one focused control group at a time', () => {
    render(<BillboardHudEditorPanel title="A headline" subtitle="Supporting copy" />);

    expect(screen.getByRole('navigation', { name: 'Billboard editor sections' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Heading settings' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Copy settings' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('region', { name: 'Copy settings' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Heading settings' })).toBeNull();
    expect(screen.queryByText('Plain lead and rich body content')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    expect(screen.getByRole('region', { name: 'Buttons settings' })).toBeTruthy();
    expect(screen.getByText('No buttons added yet.')).toBeTruthy();
  });

  it('shows only labeled buttons at public size, with hover behavior and new-window controls', () => {
    const onButtonOpenInNewWindowChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        buttonLabel="Read more"
        buttonHref=""
        buttonOpenInNewWindow={false}
        onButtonOpenInNewWindowChange={onButtonOpenInNewWindowChange}
        button2Label=""
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));

    const preview = screen.getByRole('region', { name: 'Button preview' });
    expect(within(preview).getByRole('button', { name: 'Read more' }).className)
      .toContain('service-native-btn');
    expect(within(preview).queryByRole('button', { name: 'Secondary button' })).toBeNull();
    expect(screen.getAllByRole('checkbox', { name: 'Open in new window' })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Open in new window' })[0]);
    expect(onButtonOpenInNewWindowChange).toHaveBeenCalledWith(true);
  });

  it('only exposes button color when that button uses Outline style', () => {
    render(
      <BillboardHudEditorPanel
        buttonLabel="Primary"
        buttonStyle="blue"
        button2Label="Secondary"
        button2Style="outline"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));

    expect(screen.queryByRole('radiogroup', { name: 'Billboard button color' })).toBeNull();
    expect(screen.getByRole('radiogroup', { name: 'Billboard button 2 color' })).toBeTruthy();
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
    expect(screen.queryByRole('group', { name: 'Text alignment' })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Body HTML' }).tagName).toBe('DIV');
    expect(screen.getByTitle('Bold')).toBeTruthy();
    expect(screen.getByTitle('Italic')).toBeTruthy();
  });

  it('separates title alignment from body alignment and body width on the Copy page', () => {
    const onBodyJustifyChange = vi.fn();
    const onBodyMaxWidthPxChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        justify="center"
        justifyOptions={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ]}
        bodyJustify="left"
        bodyJustifyOptions={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ]}
        bodyMaxWidthPx={640}
        onBodyJustifyChange={onBodyJustifyChange}
        onBodyMaxWidthPxChange={onBodyMaxWidthPxChange}
      />,
    );

    expect(screen.getByText('Title alignment')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('group', { name: 'Body alignment' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Body width' }).value).toBe('640');

    fireEvent.click(within(screen.getByRole('group', { name: 'Body alignment' })).getByRole('button', { name: 'Center' }));
    expect(onBodyJustifyChange).toHaveBeenCalledWith('center');
    fireEvent.change(screen.getByRole('slider', { name: 'Body width' }), { target: { value: '700' } });
    expect(onBodyMaxWidthPxChange).toHaveBeenCalledWith(700);
  });

  it('provides a lead-copy size slider in the copy panel', () => {
    const onLeadCopySizeRemChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        bodyHtml="<p>Rolling over retirement savings is simple.</p>"
        leadCopySizeRem={1.65}
        onLeadCopySizeRemChange={onLeadCopySizeRemChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    const slider = screen.getByRole('slider', { name: 'Lead copy size' });
    expect(slider.value).toBe('1.65');

    fireEvent.change(slider, { target: { value: '1.85' } });
    expect(onLeadCopySizeRemChange).toHaveBeenCalledWith(1.85);
  });

  it('keeps rich body copy readable against the selected billboard background', () => {
    render(
      <BillboardHudEditorPanel
        title="A headline"
        bgTone="blue"
        bodyColorClassName="is-white"
        bodyHtml="<p>Add supporting copy here.</p>"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    const editor = screen.getByRole('textbox', { name: 'Body HTML' });
    const editorShell = editor.closest('.admin-billboard-hud-copy-editor');
    expect(editorShell?.classList.contains('is-bg-blue')).toBe(true);
    expect(editorShell?.classList.contains('is-white')).toBe(true);
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

  it('provides a separate header gap slider from title leading', () => {
    const onHeaderGapRemChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        headerGapRem={1.5}
        onHeaderGapRemChange={onHeaderGapRemChange}
        lineSpacing={1.05}
      />,
    );

    expect(screen.getByRole('slider', { name: 'Title line height' }).value).toBe('1.05');
    const slider = screen.getByRole('slider', { name: 'Header gap' });
    expect(slider.value).toBe('1.5');

    fireEvent.change(slider, { target: { value: '2' } });
    expect(onHeaderGapRemChange).toHaveBeenCalledWith(2);
  });

  it('lets the layout slider leave Auto and restores Auto when clicked', () => {
    const onContentMaxWidthPxChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        contentMaxWidthPx=""
        onContentMaxWidthPxChange={onContentMaxWidthPxChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    const slider = screen.getByRole('slider', { name: 'Content width' });
    expect(slider.disabled).toBe(false);

    fireEvent.change(slider, { target: { value: '900' } });
    expect(onContentMaxWidthPxChange).toHaveBeenCalledWith(900);
  });

  it('uses the branded range treatment for width sliders and places bottom padding under top padding', () => {
    render(
      <BillboardHudEditorPanel
        contentMaxWidthPx={900}
        bodyMaxWidthPx={640}
        paddingTopRem={4}
        paddingBottomRem={4}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    expect(screen.queryByText('Bounded width and surface')).toBeNull();
    expect(screen.getByRole('slider', { name: 'Content width' }).closest('.admin-front-hud-range')).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Billboard top padding' }).closest('.admin-billboard-editor-width-grid')?.querySelector('.admin-billboard-editor-bottom-padding')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('slider', { name: 'Body width' }).closest('.admin-front-hud-range')).toBeTruthy();
  });

  it('wires the billboard bottom padding slider', () => {
    const onPaddingBottomRemChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        paddingBottomRem={7.5}
        onPaddingBottomRemChange={onPaddingBottomRemChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    const slider = screen.getByRole('slider', { name: 'Billboard bottom padding' });
    expect(slider.value).toBe('7.5');

    fireEvent.change(slider, { target: { value: '8' } });
    expect(onPaddingBottomRemChange).toHaveBeenCalledWith(8);
  });

  it('wires the billboard top padding slider', () => {
    const onPaddingTopRemChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        paddingTopRem={5.25}
        onPaddingTopRemChange={onPaddingTopRemChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    const slider = screen.getByRole('slider', { name: 'Billboard top padding' });
    expect(slider.value).toBe('5.25');

    fireEvent.change(slider, { target: { value: '6' } });
    expect(onPaddingTopRemChange).toHaveBeenCalledWith(6);
  });
});
