import { createElement } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CtaHudEditorPanel from './CtaHudEditorPanel';

function renderPanel(props = {}) {
  return render(createElement(CtaHudEditorPanel, {
    fields: [],
    ...props,
  }));
}

describe('CtaHudEditorPanel', () => {
  it('marks the selected submit style and only exposes submit color for outline', () => {
    const onSubmitStyleChange = vi.fn();
    const onSubmitToneChange = vi.fn();

    renderPanel({
      settings: { submitLabel: 'Send it' },
      submitStyle: 'dark',
      submitTone: 'melon',
      onSubmitStyleChange,
      onSubmitToneChange,
    });

    const darkStyleChip = screen.getByRole('button', { name: 'Dark' });
    expect(darkStyleChip.className).toContain('admin-cta-hud-style-chip');
    expect(darkStyleChip.className).toContain('is-active');
    expect(screen.queryByRole('radiogroup', { name: 'CTA submit color' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Outline' }));
    expect(onSubmitStyleChange).toHaveBeenCalledWith('outline');
  });

  it('keeps lead copy and submit controls together in the message card ahead of form fields', () => {
    const { container } = renderPanel({
      settings: { submitLabel: 'Follow up with me' },
      bodyHtml: '<p>Let us help you take the next step.</p>',
      fields: [
        { id: 'full_name', label: 'Full name', type: 'text', required: true, placeholder: '' },
      ],
    });

    const cards = Array.from(container.querySelectorAll('.admin-cta-hud-editor-panels > section'));
    expect(cards).toHaveLength(3);
    expect(within(cards[1]).getByText('Message + Submit')).toBeTruthy();
    expect(within(cards[1]).getByText('Lead Copy')).toBeTruthy();
    expect(within(cards[1]).getByLabelText('Submit Label')).toBeTruthy();
    expect(within(cards[1]).getByRole('group', { name: 'CTA submit style' })).toBeTruthy();
    expect(within(cards[1]).getByText('Button Preview')).toBeTruthy();
    expect(within(cards[2]).getByText('Form Fields')).toBeTruthy();
  });

  it('exposes the CTA groups through the reference editor rail', () => {
    renderPanel();

    expect(screen.getByRole('navigation', { name: 'CTA editor sections' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Heading' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Message + Submit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Form Fields' })).toBeTruthy();
  });

  it('shows title span chips and omits the old heading helper copy', () => {
    const onRemoveTitleSpan = vi.fn();
    const onClearTitleSpans = vi.fn();

    const { container } = renderPanel({
      settings: {
        title: 'Ready to connect your faith & finances?',
        titleHighlightsJson: '[{"text":"faith","className":"is-atlantean"}]',
      },
      titleSelection: { start: 0, end: 0, text: '' },
      onRemoveTitleSpan,
      onClearTitleSpans,
    });

    expect(screen.queryByText('Copy and emphasis')).toBeNull();
    expect(screen.getByRole('button', { name: /“faith”/i })).toBeTruthy();
    expect(container.querySelector('.admin-cta-hud-live-heading mark.is-atlantean')?.textContent).toBe('faith');

    fireEvent.click(screen.getByRole('button', { name: /“faith”/i }));
    expect(onRemoveTitleSpan).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByRole('button', { name: 'Clear spans' }));
    expect(onClearTitleSpans).toHaveBeenCalledTimes(1);
  });

  it('matches the selected heading swatch to a partial selection inside a colored span', () => {
    renderPanel({
      settings: {
        title: 'Ready to connect your faith & finances?',
        titleHighlightsJson: '[{"start":22,"end":27,"className":"is-atlantean","text":"faith"}]',
      },
      titleSelection: { start: 23, end: 26, text: 'ait' },
    });

    const headingPalette = screen.getByRole('radiogroup', { name: 'CTA heading color' });
    expect(within(headingPalette).getByRole('radio', { name: 'Blue' }).getAttribute('aria-checked')).toBe('true');
  });

  it('uses the live auto tone as the active CTA heading swatch instead of rendering a separate default swatch', () => {
    renderPanel({
      settings: {
        title: 'Ready to connect your faith & finances?',
      },
      bgTone: 'blue',
      titleColor: '',
    });

    const headingPalette = screen.getByRole('radiogroup', { name: 'CTA heading color' });
    expect(within(headingPalette).queryByRole('radio', { name: 'Default' })).toBeNull();
    expect(within(headingPalette).getByRole('radio', { name: 'White' }).getAttribute('aria-checked')).toBe('true');
  });

  it('applies the selected CTA background tone behind the heading preview', () => {
    const { container } = renderPanel({
      settings: {
        title: 'Ready to connect your faith & finances?',
      },
      bgTone: 'blue',
      titleColor: '',
    });

    expect(container.querySelector('.admin-cta-hud-heading-preview.is-bg-blue')).toBeTruthy();
  });

  it('keeps the CTA background preview responsive through stale prop rerenders after swatch clicks', () => {
    const onBgToneChange = vi.fn();
    const props = {
      settings: {
        title: 'Ready to connect your faith & finances?',
      },
      bgTone: 'white',
      onBgToneChange,
    };
    const view = renderPanel(props);
    const backgroundPalette = screen.getByRole('radiogroup', { name: 'CTA background' });

    fireEvent.click(within(backgroundPalette).getByRole('radio', { name: 'Blue' }));
    expect(onBgToneChange).toHaveBeenCalledWith('blue');
    expect(view.container.querySelector('.admin-cta-hud-heading-preview.is-bg-blue')).toBeTruthy();

    view.rerender(createElement(CtaHudEditorPanel, {
      fields: [],
      ...props,
    }));
    expect(view.container.querySelector('.admin-cta-hud-heading-preview.is-bg-blue')).toBeTruthy();

    view.rerender(createElement(CtaHudEditorPanel, {
      fields: [],
      ...props,
      bgTone: 'blue',
    }));
    expect(view.container.querySelector('.admin-cta-hud-heading-preview.is-bg-blue')).toBeTruthy();
  });

  it('matches the CTA preview heading color to the live auto tone on dark backgrounds when no swatch override is set', () => {
    const { container } = renderPanel({
      settings: {
        title: 'Ready to connect your faith & finances?',
      },
      bgTone: 'blue',
      titleColor: '',
    });

    expect(container.querySelector('.admin-cta-hud-live-heading')?.className).toContain('is-white');
  });

  it('keeps heading color, span chips, and background color in the shared heading controls area', () => {
    renderPanel({
      settings: {
        title: 'Ready to connect your faith & finances?',
        titleHighlightsJson: '[{"text":"faith","className":"is-atlantean","start":22,"end":27}]',
      },
      bgTone: 'blue',
      titleSelection: { start: 0, end: 0, text: '' },
    });

    const headingControls = document.querySelector('.admin-cta-hud-heading-controls');
    expect(headingControls).toBeTruthy();
    expect(within(headingControls).getByRole('radiogroup', { name: 'CTA heading color' })).toBeTruthy();
    expect(within(headingControls).getByRole('radiogroup', { name: 'CTA background' })).toBeTruthy();
    expect(within(headingControls).getByRole('button', { name: /“faith”/i })).toBeTruthy();
    expect(within(headingControls).getByRole('button', { name: 'Clear spans' })).toBeTruthy();
    expect(screen.getByText(/Highlight heading text first for span color/i)).toBeTruthy();
  });

  it('routes sandstone swatch clicks to the selected CTA heading span instead of the core heading color', () => {
    const onApplySelectionColor = vi.fn();
    const onTitleColorChange = vi.fn();

    renderPanel({
      settings: {
        title: 'Ready to connect your faith & finances?',
        titleHighlightsJson: '[{"start":22,"end":27,"className":"is-atlantean","text":"faith"}]',
      },
      titleSelection: { start: 22, end: 27, text: 'faith' },
      onApplySelectionColor,
      onTitleColorChange,
    });

    const headingPalette = screen.getByRole('radiogroup', { name: 'CTA heading color' });
    fireEvent.click(within(headingPalette).getByRole('radio', { name: 'Sandstone' }));

    expect(onApplySelectionColor).toHaveBeenCalledWith('is-sandstone');
    expect(onTitleColorChange).not.toHaveBeenCalled();
  });

  it('clears back to CTA heading auto color when the resolved active swatch is chosen', () => {
    const onTitleColorChange = vi.fn();

    renderPanel({
      settings: {
        title: 'Ready to connect your faith & finances?',
      },
      bgTone: 'blue',
      titleColor: 'is-mango',
      onTitleColorChange,
    });

    const headingPalette = screen.getByRole('radiogroup', { name: 'CTA heading color' });
    fireEvent.click(within(headingPalette).getByRole('radio', { name: 'White' }));
    expect(onTitleColorChange).toHaveBeenCalledWith('');
  });

  it('renders the lead copy editor inside the shared message and submit card', () => {
    const { container } = renderPanel({
      settings: {
        title: 'Ready to connect your faith & finances?',
      },
      bodyHtml: '<p>Let us help you take the next step.</p>',
    });

    expect(screen.getByText('Lead Copy')).toBeTruthy();
    expect(within(container.querySelector('.admin-cta-hud-card--message')).getByText('Message + Submit')).toBeTruthy();
    expect(screen.queryByText('Appearance')).toBeNull();
    expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
  });

  it('renders compact CTA field rows and opens a dedicated editor sheet on selection', () => {
    const { container } = renderPanel({
      fields: [
        { id: 'full_name', label: 'Full name', type: 'text', required: true, placeholder: '' },
        { id: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
        { id: 'notes', label: 'Message', type: 'textarea', required: false, placeholder: '' },
      ],
    });

    expect(container.querySelectorAll('.admin-cta-hud-field-row').length).toBe(3);
    expect(container.querySelector('.admin-cta-hud-field-chip')).toBeNull();
    expect(screen.getByRole('button', { name: /Full name/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Email/i })).toBeTruthy();
    expect(screen.queryByLabelText('Field Label')).toBeNull();
    expect(container.querySelector('.admin-cta-hud-field-row-key')?.textContent).toContain('Key: full_name');

    fireEvent.click(within(container.querySelector('.admin-cta-hud-field-list')).getByRole('button', { name: /Message/i }));
    const editorSheet = screen.getByRole('dialog', { name: 'Edit field Message' });
    expect(editorSheet).toBeTruthy();
    expect(container.querySelector('.admin-cta-hud-field-editor')).toBeNull();
    expect(editorSheet.closest('.admin-cta-hud-field-list')).toBeNull();
    expect(within(editorSheet).getByLabelText('Field Label').value).toBe('Message');
    expect(within(editorSheet).getByText('Field 3 of 3')).toBeTruthy();
    expect(screen.getByText('Editing')).toBeTruthy();
    expect(screen.getByLabelText('Field Key').value).toBe('notes');
    expect(screen.getByLabelText('Field Type').value).toBe('textarea');
  });

  it('lets HUD admins add, reorder, remove fields, and toggle built-in contact preference', () => {
    const onFieldsChange = vi.fn();
    const onIncludeContactPreferenceChange = vi.fn();

    renderPanel({
      fields: [
        { id: 'full_name', label: 'Full name', type: 'text', required: true, placeholder: '' },
        { id: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
      ],
      onFieldsChange,
      onIncludeContactPreferenceChange,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add field' }));
    expect(onFieldsChange).toHaveBeenCalledWith([
      { id: 'full_name', label: 'Full name', type: 'text', required: true, placeholder: '' },
      { id: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
      { id: 'field_3', label: 'Field 3', type: 'text', required: false, placeholder: '', optionsText: '' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /Email/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Up' }));
    expect(onFieldsChange).toHaveBeenCalledWith([
      { id: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
      { id: 'full_name', label: 'Full name', type: 'text', required: true, placeholder: '' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onFieldsChange).toHaveBeenCalledWith([
      { id: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
    ]);

    fireEvent.click(screen.getByLabelText('Ask for contact preference'));
    expect(onIncludeContactPreferenceChange).toHaveBeenCalledWith(true);
  });
});
