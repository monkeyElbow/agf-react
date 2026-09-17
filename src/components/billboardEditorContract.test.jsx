import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { getBlockEditorSections, getEditableFieldsForKind } from '../blocks/registry';
import { buildDynamicBillboardFromBlock } from '../lib/dynamicPageBlocks';
import { normalizeBlockPresentation } from '../lib/blockPresentationContracts';
import { EDITOR_DRAFT_FLUSH_EVENT } from '../lib/contentAdminTiming';
import {
  BillboardBlockEditor,
  getMigratedBlockEditorComponent,
} from './block-editors/migratedBlockEditors';

const BILLBOARD_CORE_SETTING_KEYS = [
  'title',
  'titleClassName',
  'titleHighlightsJson',
  'subtitle',
  'subtitleClassName',
  'subtitleHighlightsJson',
  'subtitleSizeRem',
  'subtitleFontWeight',
  'titleFontFamily',
  'titleFontWeight',
  'titleSizeRem',
  'titleTrackingEm',
  'subtitleTrackingEm',
  'bodyHtml',
  'bodyJustify',
  'leadCopySizeRem',
  'leadCopyLineHeight',
  'bodyColorClassName',
  'body',
  'bgTone',
  'textTone',
  'justify',
  'bodyMaxWidthPx',
  'lineSpacing',
  'headerGapRem',
  'bodyGapRem',
  'actionGapRem',
  'contentMaxWidthPx',
  'paddingTopRem',
  'paddingBottomRem',
  'backgroundEffectsJson',
];

function billboardBlock(settings = {}) {
  return {
    id: 'billboard-contract-proof',
    kind: 'billboard',
    mode: 'dynamic',
    editableFields: getEditableFieldsForKind('billboard', 'admin'),
    settings: {
      title: 'A dependable headline',
      subtitle: 'Supporting copy',
      bodyHtml: '<p>Shared body copy.</p>',
      ...settings,
    },
  };
}

function StatefulBillboardEditor({ initialSettings = {}, onSettingChange = null }) {
  const [settings, setSettings] = useState(initialSettings);
  return (
    <BillboardBlockEditor
      block={billboardBlock(settings)}
      onSettingChange={(fieldId, value) => {
        onSettingChange?.(fieldId, value);
        setSettings((current) => ({ ...current, [fieldId]: value }));
      }}
    />
  );
}

describe('Billboard editor contract', () => {
  it('uses one canonical section and setting-key contract for Admin and HUD', () => {
    const adminSections = getBlockEditorSections('billboard', 'admin');
    const hudSections = getBlockEditorSections('billboard', 'hud');
    const adminFieldIds = adminSections.flatMap((section) => section.fields.map((field) => field.id));
    const hudFieldIds = hudSections.flatMap((section) => section.fields.map((field) => field.id));

    expect(getMigratedBlockEditorComponent('billboard', 'admin')).toBe(BillboardBlockEditor);
    expect(getMigratedBlockEditorComponent('billboard', 'hud')).toBe(BillboardBlockEditor);
    expect(hudFieldIds).toEqual(adminFieldIds);
    expect(adminFieldIds).toEqual(expect.arrayContaining(BILLBOARD_CORE_SETTING_KEYS));
    expect(adminSections.filter((section) => section.id === 'background')).toHaveLength(1);
    expect(adminSections.find((section) => section.id === 'background')?.fields.map((field) => field.id))
      .toEqual(['bgTone', 'backgroundEffectsJson']);
  });

  it('routes representative Billboard editor controls to canonical setting keys', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor block={billboardBlock({ titleSizeRem: 3.4 })} onSettingChange={onSettingChange} />);

    fireEvent.change(screen.getByRole('slider', { name: 'Title size' }), { target: { value: '4' } });
    expect(onSettingChange).toHaveBeenCalledWith('titleSizeRem', 4);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Lead copy size' }), { target: { value: '1.85' } });
    expect(onSettingChange).toHaveBeenCalledWith('leadCopySizeRem', 1.85);
    fireEvent.change(screen.getByRole('slider', { name: 'Space above body' }), { target: { value: '1.75' } });
    expect(onSettingChange).toHaveBeenCalledWith('bodyGapRem', 1.75);

    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Billboard top padding' }), { target: { value: '5' } });
    expect(onSettingChange).toHaveBeenCalledWith('paddingTopRem', 5);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Billboard button gap' }), { target: { value: '2.35' } });
    expect(onSettingChange).toHaveBeenCalledWith('actionGapRem', 2.35);
  });

  it('keeps the IRA daily billboard on the canonical heading controls', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor
      block={billboardBlock({
        sectionClassName: 'retirement-everyday retirement-daily-billboard',
        titleFontFamily: 'helv',
        titleFontWeight: 700,
        justify: 'center',
      })}
      onSettingChange={onSettingChange}
    />);

    expect(screen.getByText('Title font')).toBeTruthy();
    expect(screen.getByText('Title weight')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Title alignment' })).toBeTruthy();

    fireEvent.click(within(screen.getByRole('group', { name: 'Title weight' })).getByRole('button', { name: '500' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Title alignment' })).getByRole('button', { name: 'Left' }));

    expect(onSettingChange).toHaveBeenCalledWith('titleFontWeight', 500);
    expect(onSettingChange).toHaveBeenCalledWith('justify', 'left');
  });

  it('loads legacy plain copy into the shared body editor without migrating on open', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor
      block={billboardBlock({ bodyHtml: '', body: 'Nathan changed this copy.\nSecond line.' })}
      onSettingChange={onSettingChange}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    const editor = screen.getByRole('textbox', { name: 'Billboard body copy' });

    expect(editor.innerHTML).toContain('Nathan changed this copy.');
    expect(editor.innerHTML).toContain('<br>');
    expect(onSettingChange).not.toHaveBeenCalledWith('bodySource', 'html');
  });

  it('makes HTML authoritative on explicit edit while retaining legacy body for recovery', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor
      block={billboardBlock({ bodyHtml: '', body: 'Legacy recovery copy.' })}
      onSettingChange={onSettingChange}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    const editor = screen.getByRole('textbox', { name: 'Billboard body copy' });
    editor.innerHTML = '<p>Edited <strong>body</strong>.</p>';
    fireEvent.input(editor);
    fireEvent.blur(editor);

    expect(onSettingChange).toHaveBeenCalledWith('bodySource', 'html');
    expect(onSettingChange).not.toHaveBeenCalledWith('body', '');
  });

  it('flushes unsaved body typing when Save draft requests editor drafts', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor
      block={billboardBlock({ bodyHtml: '<p>Original body.</p>' })}
      onSettingChange={onSettingChange}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    const editor = screen.getByRole('textbox', { name: 'Billboard body copy' });
    editor.innerHTML = '<p>Unsaved body before Save draft.</p>';
    fireEvent.input(editor);
    fireEvent.click(screen.getByRole('tab', { name: 'HTML' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Visual' }));
    window.dispatchEvent(new Event(EDITOR_DRAFT_FLUSH_EVENT));

    expect(onSettingChange).toHaveBeenCalledWith('bodyHtml', '<p>Unsaved body before Save draft.</p>');
  });

  it('keeps an explicitly cleared body empty instead of resurrecting legacy copy', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor
      block={billboardBlock({ bodyHtml: '', body: 'Legacy recovery copy.' })}
      onSettingChange={onSettingChange}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    fireEvent.click(screen.getByRole('tab', { name: 'HTML' }));
    const editor = screen.getByRole('textbox', { name: 'Billboard body copy' });
    fireEvent.change(editor, { target: { value: '' } });
    fireEvent.blur(editor);

    expect(onSettingChange).toHaveBeenCalledWith('bodySource', 'html');
    expect(onSettingChange).toHaveBeenCalledWith('bodyHtml', '');
    expect(buildDynamicBillboardFromBlock(billboardBlock({
      body: 'Legacy recovery copy.',
      bodyHtml: '',
      bodySource: 'html',
    }))?.body).toBe('');
  });

  it('switches Billboard weight choices to the selected font family', () => {
    const onSettingChange = vi.fn();
    render(<StatefulBillboardEditor
      initialSettings={{
        titleFontFamily: 'heading',
        titleFontWeight: 800,
      }}
      onSettingChange={onSettingChange}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Heading' }));
    const titlePanel = document.querySelector('.admin-billboard-hud-heading-title-panel');
    expect(titlePanel).toBeTruthy();
    expect(within(titlePanel).getByRole('button', { name: '800' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Helvetica Neue' }));

    expect(onSettingChange).toHaveBeenCalledWith('titleFontFamily', 'helv');
    expect(onSettingChange).toHaveBeenCalledWith('titleFontWeight', 700);
    expect(screen.queryByRole('button', { name: '600' })).toBeNull();
    expect(screen.queryByRole('button', { name: '900' })).toBeNull();
  });

  it('reflects the selected title span color in the title palette', () => {
    const onSettingChange = vi.fn();
    const block = billboardBlock({
      title: 'Vision fuel',
      titleClassName: 'is-white',
      titleHighlightsJson: '[{"start":7,"end":11,"className":"is-mango","text":"fuel"}]',
    });

    render(<BillboardBlockEditor block={block} onSettingChange={onSettingChange} />);

    const titleInput = screen.getByLabelText('Title');
    titleInput.focus();
    titleInput.setSelectionRange(7, 11);
    fireEvent.select(titleInput);

    const titlePalette = screen.getByRole('radiogroup', { name: 'Billboard title color' });
    expect(within(titlePalette).getByRole('radio', { name: 'Mango' }).getAttribute('aria-checked')).toBe('true');
    expect(within(titlePalette).getByRole('radio', { name: 'White' }).getAttribute('aria-checked')).toBe('false');
  });

  it('accepts an explicit title soft return', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor block={billboardBlock({ title: 'One line' })} onSettingChange={onSettingChange} />);

    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'First line\nSecond line' } });
    fireEvent.blur(titleInput);

    expect(onSettingChange).toHaveBeenCalledWith('title', 'First line\nSecond line');
  });

  it('applies a color to the selected Billboard subtitle span', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor block={billboardBlock({
      subtitle: 'Supporting copy',
      subtitleClassName: 'is-white',
    })} onSettingChange={onSettingChange} />);

    const subtitleInput = screen.getByLabelText('Subtitle');
    subtitleInput.focus();
    subtitleInput.setSelectionRange(0, 10);
    fireEvent.select(subtitleInput);
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Billboard subtitle color' }))
        .getByRole('radio', { name: 'Mango' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith(
      'subtitleHighlightsJson',
      '[{"start":0,"end":10,"className":"is-mango","text":"Supporting"}]',
    );
    expect(onSettingChange).not.toHaveBeenCalledWith('subtitleClassName', 'is-mango');
  });

  it('keeps Billboard actions and background controls attached to canonical settings', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor block={billboardBlock({
      buttonLabel: 'Continue',
      buttonStyle: 'outline',
      buttonLinkJson: '',
    })} onSettingChange={onSettingChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    fireEvent.change(screen.getByLabelText('Button 1 Label'), { target: { value: 'Learn more' } });
    fireEvent.blur(screen.getByLabelText('Button 1 Label'));
    expect(onSettingChange).toHaveBeenCalledWith('buttonLabel', 'Learn more');

    fireEvent.change(screen.getByLabelText('Button URL/path'), { target: { value: '/services/loans' } });
    const linkCall = onSettingChange.mock.calls.find(([fieldId]) => fieldId === 'buttonLinkJson');
    expect(linkCall).toBeTruthy();
    expect(JSON.parse(linkCall[1])).toMatchObject({ kind: 'internal', to: '/services/loans' });

    fireEvent.click(screen.getByRole('button', { name: 'Background' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Enable background lights' })).getByRole('button', { name: 'On' }));
    const backgroundCall = onSettingChange.mock.calls.find(([fieldId]) => fieldId === 'backgroundEffectsJson');
    expect(backgroundCall).toBeTruthy();
    expect(JSON.parse(backgroundCall[1])).toMatchObject({ enabled: true });
  });

  it('offers a solid white Billboard button and persists it as the shared white style', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor block={billboardBlock({
      buttonLabel: 'Continue',
      buttonStyle: 'blue',
    })} onSettingChange={onSettingChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Billboard button style' }))
        .getByRole('radio', { name: 'White solid' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith('buttonStyle', 'white');
  });

  it('routes an unselected Body HTML color swatch to the base body color setting', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor block={billboardBlock()} onSettingChange={onSettingChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Text color' })).getByRole('radio', { name: 'Mango' }));

    expect(onSettingChange).toHaveBeenCalledWith('bodyColorClassName', 'is-mango');
  });

  it('keeps Billboard action link options attached to the canonical link value', () => {
    const onSettingChange = vi.fn();
    render(<BillboardBlockEditor block={billboardBlock({
      buttonLabel: 'Continue',
      buttonLinkJson: JSON.stringify({
        kind: 'external',
        href: 'https://example.test/document.pdf',
        openInNewWindow: false,
      }),
    })} onSettingChange={onSettingChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Open in new window' })[0]);

    const linkCall = onSettingChange.mock.calls.find(([fieldId]) => fieldId === 'buttonLinkJson');
    expect(linkCall).toBeTruthy();
    expect(JSON.parse(linkCall[1])).toMatchObject({
      kind: 'external',
      href: 'https://example.test/document.pdf',
      openInNewWindow: true,
    });
  });

  it('feeds the same canonical Billboard settings into the shared runtime builder', () => {
    const runtime = buildDynamicBillboardFromBlock(billboardBlock({
      titleClassName: 'is-atlantean',
      titleHighlightsJson: '[{"start":2,"end":13,"className":"is-mango"}]',
      bodyJustify: 'left',
      leadCopySizeRem: 1.85,
      leadCopyLineHeight: 1.72,
      headerGapRem: 1.5,
      actionGapRem: 2.35,
      paddingTopRem: 2.25,
      backgroundEffectsJson: '{"enabled":true,"lights":[{"tone":"blue","strength":42,"x":22,"y":28,"size":82}]}',
    }));

    expect(runtime).toMatchObject({
      title: 'A dependable headline',
      titleClassName: 'is-atlantean',
      titleHighlights: [{ start: 2, end: 13, className: 'is-mango' }],
      bodyJustify: 'left',
      leadCopySizeRem: 1.85,
      leadCopyLineHeight: 1.72,
      headerGapRem: 1.5,
      actionGapRem: 2.35,
      paddingTopRem: 2.25,
      backgroundEffects: {
        enabled: true,
        lights: [expect.objectContaining({ tone: 'blue', strength: 42 })],
      },
    });
  });

  it('keeps preset presentation locks explicit instead of silently changing the editor model', () => {
    const normalized = normalizeBlockPresentation({
      ...billboardBlock({ sectionClassName: 'legacy-child-native-cga-outro' }),
      presetId: 'default',
    });
    const editableFieldIds = normalized.editableFields.map((field) => field.id);

    expect(normalized.settings.titleFontFamily).toBe('helv');
    expect(normalized.settings.titleFontWeight).toBe(700);
    expect(editableFieldIds).not.toContain('titleFontFamily');
    expect(editableFieldIds).not.toContain('titleFontWeight');
  });

  it('keeps Ministry Impact Fund billboard title controls editable', () => {
    const normalized = normalizeBlockPresentation({
      ...billboardBlock({ sectionClassName: 'legacy-child-native-billboard' }),
      settings: {
        ...billboardBlock({ sectionClassName: 'legacy-child-native-billboard' }).settings,
        titleFontFamily: 'heading',
        titleFontWeight: 600,
        titleSizeRem: 3.4,
      },
      presetId: 'default',
    });
    const editableFieldIds = normalized.editableFields.map((field) => field.id);

    expect(normalized.settings).toMatchObject({
      titleFontFamily: 'heading',
      titleFontWeight: 600,
      titleSizeRem: 3.4,
    });
    expect(editableFieldIds).toEqual(expect.arrayContaining([
      'titleFontFamily',
      'titleFontWeight',
      'titleSizeRem',
      'justify',
    ]));
  });
});
