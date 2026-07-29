import { describe, expect, it } from 'vitest';
import {
  normalizeBlockPresentation,
  normalizeBillboardPresentationSettings,
  normalizeRequestFormPresetSettings,
} from './blockPresentationContracts';

describe('block presentation contracts', () => {
  it('repairs legacy-impact request forms through one shared contract', () => {
    expect(normalizeRequestFormPresetSettings({
      presetId: 'legacy-impact',
      titleClassName: 'is-super-grey',
      titleHighlightsJson: '[]',
      textTone: 'dark',
      step1Title: 'Talk with planned giving',
      step1Note: 'Let’s map out the best next step.',
      step1Alert: 'Old divider copy',
    })).toMatchObject({
      titleClassName: '',
      titleHighlightsJson: '[{"text":"legacy","className":"is-white"}]',
      bgTone: 'blue',
      textTone: 'white',
      spaceBeforeRem: 3.6,
      spaceAfterRem: 4.2,
      hideStepTitles: true,
      step1Title: '',
      step1Note: '',
      step1Alert: '',
    });
  });

  it('repairs billboard presentation variants through one shared contract', () => {
    expect(normalizeBillboardPresentationSettings({
      sectionClassName: 'legacy-child-native-cga-outro',
      justify: 'right',
      actionsBeforeCards: false,
    })).toMatchObject({
      justify: 'center',
      titleFontFamily: 'helv',
      titleFontWeight: 700,
      actionsBeforeCards: true,
    });

    expect(normalizeBillboardPresentationSettings({
      sectionClassName: 'legacy-child-native-billboard',
      title: 'More joy in receiving.',
    })).toMatchObject({
      titleFontFamily: 'helv',
      titleFontWeight: 700,
      titleSizeRem: 4.59375,
    });
  });

  it('removes preset-owned request form fields from editable field schemas', () => {
    const normalized = normalizeBlockPresentation({
      kind: 'request_form',
      settings: {
        presetId: 'legacy-impact',
        titleClassName: 'is-super-grey',
        titleHighlightsJson: '[]',
      },
      editableFields: [
        { id: 'title' },
        { id: 'body' },
        { id: 'bgTone' },
        { id: 'titleHighlightsJson' },
        { id: 'step1Title' },
      ],
    });

    expect(normalized.editableFields.map((field) => field.id)).toEqual(['title', 'body']);
  });

  it('removes preset-owned billboard fields from editable field schemas', () => {
    const normalized = normalizeBlockPresentation({
      kind: 'billboard',
      settings: {
        sectionClassName: 'legacy-child-native-cga-outro',
        justify: 'right',
        actionsBeforeCards: false,
      },
      editableFields: [
        { id: 'title' },
        { id: 'body' },
        { id: 'justify' },
        { id: 'titleFontFamily' },
        { id: 'actionsBeforeCards' },
      ],
    });

    expect(normalized.editableFields.map((field) => field.id)).toEqual(['title', 'body']);
  });
});
