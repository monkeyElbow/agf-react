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
    const copy = screen.getByRole('region', { name: 'Copy settings' });
    expect(copy).toBeTruthy();
    expect(copy.className).toContain('is-copy-panel');
    expect(copy.querySelector('.admin-billboard-editor-copy-grid')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Heading settings' })).toBeNull();
    expect(screen.queryByText('Plain lead and rich body content')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    expect(screen.getByRole('region', { name: 'Buttons settings' })).toBeTruthy();
    expect(screen.getByText('No buttons added yet.')).toBeTruthy();
  });

  it('removes the extra heading header and uses the requested two-column workbench', () => {
    render(<BillboardHudEditorPanel title="A headline" subtitle="Supporting copy" />);

    const heading = screen.getByRole('region', { name: 'Heading settings' });
    expect(heading.querySelector('.admin-billboard-hud-reference-head')).toBeNull();
    expect(heading.querySelector('.admin-billboard-hud-heading-workbench')).toBeTruthy();
    expect(heading.querySelector('.admin-billboard-hud-heading-slider-panel')).toBeTruthy();
    expect(heading.querySelector('.admin-billboard-hud-heading-type-panel')).toBeTruthy();
    expect(heading.querySelector('.admin-billboard-hud-heading-controls-box')).toBeTruthy();
    expect(heading.querySelector('.admin-billboard-hud-heading-title-panel')).toBeTruthy();
    expect(heading.querySelector('.admin-billboard-hud-heading-subtitle-panel')).toBeTruthy();
  });

  it('shows compact marked-span indicators without adding a status row', () => {
    render(
      <BillboardHudEditorPanel
        title="Give once, forever."
        titleHighlightsJson='[{"start":0,"end":4,"className":"is-mango"}]'
        titleColorOptions={[{ value: 'is-mango', label: 'Mango', swatch: '#f4b41a' }]}
      />,
    );

    expect(screen.queryByText('1 marked span')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove marked span Give' })).toBeNull();
    expect(screen.getByText('Give')).toBeTruthy();
    expect(screen.getByTitle('Title marked text: Give')).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Billboard title color' })).toBeTruthy();
  });

  it('uses the same clear swatch for title core color and selected title spans', () => {
    const title = 'Give once, forever.';
    const titleSelection = { start: 0, end: 4, text: 'Give' };
    const onTitleColorChange = vi.fn();
    const onTitleHighlightsChange = vi.fn();
    const onTitleSelectionColorChange = vi.fn();
    const titleColorOptions = [
      { value: 'is-atlantean', label: 'Atlantean', swatch: '#007f86' },
      { value: '', label: 'Clear', shortLabel: 'Clear', hideSwatch: true, isClear: true },
    ];

    const { rerender } = render(
      <BillboardHudEditorPanel
        title={title}
        titleColorOptions={titleColorOptions}
        onTitleColorChange={onTitleColorChange}
        onTitleHighlightsChange={onTitleHighlightsChange}
      />,
    );

    const titlePalette = screen.getByRole('radiogroup', { name: 'Billboard title color' });
    expect(within(titlePalette).queryByRole('radio', { name: 'Clear title color' })).toBeNull();

    rerender(
      <BillboardHudEditorPanel
        title={title}
        titleHighlightsJson='[{"start":0,"end":4,"className":"is-mango"}]'
        titleColorOptions={titleColorOptions}
        onTitleColorChange={onTitleColorChange}
        onTitleHighlightsChange={onTitleHighlightsChange}
      />,
    );

    const markedTitlePalette = screen.getByRole('radiogroup', { name: 'Billboard title color' });
    const clearTitleColor = within(markedTitlePalette).getByRole('radio', { name: 'Clear title color' });
    expect(clearTitleColor.className).toContain('is-clear');
    fireEvent.click(clearTitleColor);
    expect(onTitleColorChange).toHaveBeenCalledWith('');
    expect(onTitleHighlightsChange).toHaveBeenCalledWith('');

    rerender(
      <BillboardHudEditorPanel
        title={title}
        titleSelection={titleSelection}
        titleHighlightsJson='[{"start":0,"end":4,"className":"is-mango"}]'
        titleColorOptions={titleColorOptions}
        onTitleColorChange={onTitleColorChange}
        onTitleHighlightsChange={onTitleHighlightsChange}
        onTitleSelectionColorChange={onTitleSelectionColorChange}
      />,
    );

    const selectedTitlePalette = screen.getByRole('radiogroup', { name: 'Billboard title color' });
    const clearSelectedSpan = within(selectedTitlePalette)
      .getByRole('radio', { name: 'Clear selected span' });
    expect(clearSelectedSpan).toBeTruthy();
    expect(clearSelectedSpan.className).toContain('is-clear');
    fireEvent.click(clearSelectedSpan);
    expect(onTitleSelectionColorChange).toHaveBeenCalledWith('', titleSelection);
  });

  it('uses the shared clear swatch for subtitle color', () => {
    const onSubtitleColorChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        subtitle="Supporting copy"
        subtitleColor="is-mango"
        subtitleHighlightsJson='[{"start":0,"end":10,"className":"is-mango"}]'
        subtitleColorOptions={[
          { value: 'is-mango', label: 'Mango', swatch: '#f4b41a' },
          { value: '', label: 'Clear', shortLabel: 'Clear', hideSwatch: true, isClear: true },
        ]}
        onSubtitleColorChange={onSubtitleColorChange}
      />,
    );

    const subtitlePalette = screen.getByRole('radiogroup', { name: 'Billboard subtitle color' });
    const clearSubtitleColor = within(subtitlePalette).getByRole('radio', { name: 'Clear subtitle color' });
    expect(clearSubtitleColor.className).toContain('is-clear');
    fireEvent.click(clearSubtitleColor);
    expect(onSubtitleColorChange.mock.calls[0]?.[0]).toBe('');
  });

  it('uses the live input selection so core colors and span colors target the right thing', () => {
    const onTitleColorChange = vi.fn();
    const onTitleSelectionColorChange = vi.fn();
    const titleInputRef = { current: null };
    const titleColorOptions = [
      { value: 'is-atlantean', label: 'Atlantean', swatch: '#007f86' },
      { value: 'is-mango', label: 'Mango', swatch: '#f4b41a' },
      { value: '', label: 'Clear', shortLabel: 'Clear', isClear: true },
    ];

    render(
      <BillboardHudEditorPanel
        title="Give once, forever."
        titleInputRef={titleInputRef}
        titleSelection={{ start: 0, end: 4, text: 'Give' }}
        titleHighlightsJson='[{"start":0,"end":4,"className":"is-mango"}]'
        titleColorOptions={titleColorOptions}
        onTitleColorChange={onTitleColorChange}
        onTitleSelectionColorChange={onTitleSelectionColorChange}
      />,
    );

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    titleInput.focus();
    titleInput.setSelectionRange(5, 5);
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Billboard title color' }))
      .getByRole('radio', { name: 'Mango' }));
    expect(onTitleColorChange).toHaveBeenCalledWith('is-mango');
    expect(onTitleSelectionColorChange).not.toHaveBeenCalled();

    titleInput.setSelectionRange(0, 4);
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Billboard title color' }))
      .getByRole('radio', { name: 'Clear selected span' }));
    expect(onTitleSelectionColorChange).toHaveBeenCalledWith('', {
      start: 0,
      end: 4,
      text: 'Give',
    });
    expect(onTitleColorChange).toHaveBeenCalledTimes(1);
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
    expect(screen.getByRole('region', { name: 'Button preview' }).className)
      .toContain('admin-billboard-hud-button-preview-column');
    expect(screen.getByRole('region', { name: 'Button preview' })
      .querySelector('.admin-billboard-hud-button-preview-row')).toBeTruthy();
  });

  it('uses one rich body-copy editor with Visual and HTML modes', () => {
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

    expect(screen.getByText('Body copy')).toBeTruthy();
    expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Text alignment' })).toBeNull();
    expect(screen.getByRole('tablist', { name: 'Billboard body copy editor mode' })).toBeTruthy();
    const inlineControls = screen.getByRole('toolbar', { name: 'Article body formatting' }).closest('.admin-html-editor-controls.is-inline');
    expect(inlineControls).toBeTruthy();
    expect(inlineControls?.querySelector('[role="tablist"]')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Visual' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'HTML' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('textbox', { name: 'Billboard body copy' }).tagName).toBe('DIV');
    expect(screen.getByTitle('Bold')).toBeTruthy();
    expect(screen.getByTitle('Italic')).toBeTruthy();
    expect(screen.queryByTitle('Heading 2')).toBeNull();
    expect(screen.queryByTitle('Heading 3')).toBeNull();
    expect(screen.queryByTitle('Paragraph')).toBeNull();
    expect(screen.queryByTitle('Bulleted list')).toBeNull();
    expect(screen.queryByTitle('Numbered list')).toBeNull();
    expect(screen.queryByTitle('Quote')).toBeNull();
    expect(screen.queryByTitle('Divider')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'HTML' }));
    expect(screen.getByRole('textbox', { name: 'Billboard body copy' }).tagName).toBe('TEXTAREA');
    fireEvent.click(screen.getByRole('tab', { name: 'Visual' }));
    expect(screen.getByRole('textbox', { name: 'Billboard body copy' }).tagName).toBe('DIV');
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
    const numberField = screen.getByRole('spinbutton', { name: 'Lead copy size value' });
    const typographyColumn = screen.getByRole('region', { name: 'Lead copy typography' });

    expect(typographyColumn.contains(slider)).toBe(true);
    expect(typographyColumn.contains(numberField)).toBe(true);
    expect(slider.value).toBe('1.65');

    fireEvent.change(slider, { target: { value: '1.85' } });
    expect(onLeadCopySizeRemChange).toHaveBeenCalledWith(1.85);
    fireEvent.change(numberField, { target: { value: '2.15' } });
    expect(onLeadCopySizeRemChange).toHaveBeenCalledWith(2.15);
  });

  it('provides a lead-copy line-height slider in the copy panel', () => {
    const onLeadCopyLineHeightChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        bodyHtml="<p>Rolling over retirement savings is simple.</p>"
        leadCopyLineHeight={1.55}
        onLeadCopyLineHeightChange={onLeadCopyLineHeightChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    const slider = screen.getByRole('slider', { name: 'Lead copy line height' });
    const numberField = screen.getByRole('spinbutton', { name: 'Lead copy line height value' });
    const typographyColumn = screen.getByRole('region', { name: 'Lead copy typography' });
    expect(slider.value).toBe('1.55');
    expect(typographyColumn.contains(slider)).toBe(true);
    expect(typographyColumn.contains(numberField)).toBe(true);

    fireEvent.change(slider, { target: { value: '1.8' } });
    expect(onLeadCopyLineHeightChange).toHaveBeenCalledWith(1.8);
    fireEvent.change(numberField, { target: { value: '1.9' } });
    expect(onLeadCopyLineHeightChange).toHaveBeenCalledWith(1.9);
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

    const editor = screen.getByRole('textbox', { name: 'Billboard body copy' });
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

  it('hides presentation-locked heading controls instead of exposing no-op controls', () => {
    render(
      <BillboardHudEditorPanel
        titleSizeRem={4}
        titleFontFamily="helv"
        titleFontWeight={700}
        justify="center"
        showTitleSize={false}
        showTitleFont={false}
        showTitleAlignment={false}
        showTitleWeight={false}
      />,
    );

    expect(screen.queryByRole('slider', { name: 'Title size' })).toBeNull();
    expect(screen.queryByText('Title font')).toBeNull();
    expect(screen.queryByText('Title alignment')).toBeNull();
    expect(screen.queryByText('Title weight')).toBeNull();
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

  it('pairs compact billboard sliders with editable numeric inputs', () => {
    const onTitleSizeRemChange = vi.fn();
    const onSubtitleTrackingEmChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        titleSizeRem={3.4}
        onTitleSizeRemChange={onTitleSizeRemChange}
        subtitleTrackingEm={-0.02}
        onSubtitleTrackingEmChange={onSubtitleTrackingEmChange}
      />,
    );

    const titleSizeValue = screen.getByRole('spinbutton', { name: 'Title size value' });
    const subtitleTrackingValue = screen.getByRole('spinbutton', { name: 'Subtitle tracking value' });
    expect(titleSizeValue.value).toBe('3.4');
    expect(subtitleTrackingValue.value).toBe('-0.02');
    expect(titleSizeValue.title).toBe('rem');
    expect(subtitleTrackingValue.title).toBe('em');
    expect(titleSizeValue.closest('.admin-range-number-control')?.classList.contains('admin-range-number-control--unit-tooltip')).toBe(true);
    expect(subtitleTrackingValue.closest('.admin-range-number-control')?.classList.contains('admin-range-number-control--unit-tooltip')).toBe(true);
    expect(titleSizeValue.closest('.admin-range-number-control')?.textContent).not.toContain('rem');
    expect(subtitleTrackingValue.closest('.admin-range-number-control')?.textContent).not.toContain('em');

    fireEvent.change(titleSizeValue, { target: { value: '4.25' } });
    fireEvent.change(subtitleTrackingValue, { target: { value: '0.01' } });
    expect(onTitleSizeRemChange).toHaveBeenCalledWith(4.25);
    expect(onSubtitleTrackingEmChange).toHaveBeenCalledWith(0.01);
  });

  it('separates subtitle tracking from title tracking', () => {
    const onSubtitleTrackingEmChange = vi.fn();
    const onTitleTrackingEmChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        subtitleTrackingEm={-0.02}
        onSubtitleTrackingEmChange={onSubtitleTrackingEmChange}
        titleTrackingEm={-0.03}
        onTitleTrackingEmChange={onTitleTrackingEmChange}
      />,
    );

    const subtitleTracking = screen.getByRole('slider', { name: 'Subtitle tracking' });
    const titleTracking = screen.getByRole('slider', { name: 'Title tracking' });
    expect(subtitleTracking.value).toBe('-0.02');
    expect(titleTracking.value).toBe('-0.03');

    fireEvent.change(subtitleTracking, { target: { value: '0.01' } });
    fireEvent.change(titleTracking, { target: { value: '-0.005' } });
    expect(onSubtitleTrackingEmChange).toHaveBeenCalledWith(0.01);
    expect(onTitleTrackingEmChange).toHaveBeenCalledWith(-0.005);
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

  it('keeps the shared space-above-buttons slider and number field together above the preview', () => {
    const onActionGapRemChange = vi.fn();
    render(
      <BillboardHudEditorPanel
        actionGapRem={2.35}
        onActionGapRemChange={onActionGapRemChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    const slider = screen.getByRole('slider', { name: 'Billboard button gap' });
    const previewColumn = screen.getByRole('region', { name: 'Button preview' });
    const numberField = screen.getByRole('spinbutton', { name: 'Billboard button gap value' });

    expect(previewColumn.contains(slider)).toBe(true);
    expect(previewColumn.contains(numberField)).toBe(true);
    expect(slider.value).toBe('2.35');
    fireEvent.change(slider, { target: { value: '3.1' } });
    expect(onActionGapRemChange).toHaveBeenCalledWith(3.1);
    fireEvent.change(numberField, { target: { value: '1.85' } });
    expect(onActionGapRemChange).toHaveBeenCalledWith(1.85);
  });
});
