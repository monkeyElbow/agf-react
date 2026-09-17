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
      titleHighlightsJson: '',
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
      fineprint: 'Old state notices',
      fineprintDisclosureId: 'planned-giving-cga-state-notices',
    })).toMatchObject({
      justify: 'center',
      titleFontFamily: 'helv',
      titleFontWeight: 700,
      actionsBeforeCards: true,
      fineprint: undefined,
      fineprintDisclosureId: undefined,
    });

    expect(normalizeBillboardPresentationSettings({
      sectionClassName: 'legacy-child-native-billboard',
      title: 'Admin edited title',
      titleFontFamily: 'heading',
      titleFontWeight: 600,
      titleSizeRem: 3.4,
    })).toMatchObject({
      title: 'Admin edited title',
      titleFontFamily: 'heading',
      titleFontWeight: 600,
      titleSizeRem: 3.4,
    });

    expect(normalizeBillboardPresentationSettings({
      title: 'More joy in receiving.',
    })).toEqual({ title: 'More joy in receiving.' });

    expect(normalizeBillboardPresentationSettings({
      sectionClassName: 'retirement-everyday retirement-daily-billboard',
      titleFontFamily: 'heading',
      titleFontWeight: 800,
      justify: 'left',
    })).toMatchObject({
      titleFontFamily: 'heading',
      titleFontWeight: 800,
      justify: 'left',
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
        { id: 'fineprint' },
        { id: 'fineprintDisclosureId' },
      ],
    });

    expect(normalized.editableFields.map((field) => field.id)).toEqual(['title', 'body']);

    const dailyBillboard = normalizeBlockPresentation({
      kind: 'billboard',
      settings: {
        sectionClassName: 'retirement-everyday retirement-daily-billboard',
        titleFontFamily: 'heading',
        titleFontWeight: 800,
      },
      editableFields: [
        { id: 'title' },
        { id: 'titleFontFamily' },
        { id: 'titleFontWeight' },
        { id: 'justify' },
        { id: 'body' },
      ],
    });

    expect(dailyBillboard.settings).toMatchObject({
      titleFontFamily: 'heading',
      titleFontWeight: 800,
    });
    expect(dailyBillboard.editableFields.map((field) => field.id)).toEqual([
      'title',
      'titleFontFamily',
      'titleFontWeight',
      'justify',
      'body',
    ]);

    const ministryImpactBillboard = normalizeBlockPresentation({
      kind: 'billboard',
      settings: {
        sectionClassName: 'legacy-child-native-billboard',
        titleFontFamily: 'heading',
        titleFontWeight: 600,
        titleSizeRem: 3.4,
      },
      editableFields: [
        { id: 'title' },
        { id: 'titleFontFamily' },
        { id: 'titleFontWeight' },
        { id: 'titleSizeRem' },
        { id: 'justify' },
      ],
    });

    expect(ministryImpactBillboard.settings).toMatchObject({
      titleFontFamily: 'heading',
      titleFontWeight: 600,
      titleSizeRem: 3.4,
    });
    expect(ministryImpactBillboard.editableFields.map((field) => field.id)).toEqual([
      'title',
      'titleFontFamily',
      'titleFontWeight',
      'titleSizeRem',
      'justify',
    ]);
  });

  it('keeps presentation normalization idempotent and editable copy stable', () => {
    const block = {
      id: 'outro',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-billboard',
        title: 'Edited title',
        body: 'Edited body',
      },
      editableFields: [{ id: 'title' }, { id: 'body' }],
    };

    const once = normalizeBlockPresentation(block);
    const twice = normalizeBlockPresentation(once);

    expect(twice).toEqual(once);
    expect(twice.settings.title).toBe('Edited title');
    expect(twice.settings.body).toBe('Edited body');
  });
});
