import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getBlockEditorSections, getEditableFieldsForKind } from '../blocks/registry';
import { buildDynamicBillboardFromBlock } from '../lib/dynamicPageBlocks';
import { normalizeBlockPresentation } from '../lib/blockPresentationContracts';
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
  'subtitleSizeRem',
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

    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Billboard top padding' }), { target: { value: '5' } });
    expect(onSettingChange).toHaveBeenCalledWith('paddingTopRem', 5);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Billboard button gap' }), { target: { value: '2.35' } });
    expect(onSettingChange).toHaveBeenCalledWith('actionGapRem', 2.35);
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
});
