import { describe, expect, it } from 'vitest';
import {
  buildColumnsPresetSettings,
  getColumnsPresetDefinition,
  getColumnsPresetDefinitions,
  resolveColumnsPresetId,
} from './columnsPresets';

describe('columns presets', () => {
  it('defines the canonical columns presets without splitting the family into pseudo-kinds', () => {
    expect(getColumnsPresetDefinitions().map((preset) => preset.id)).toEqual([
      'default',
      'housing-allowance',
      'do-the-math',
      'value-cards',
    ]);
    expect(getColumnsPresetDefinition('housing-allowance')?.templateIds).toEqual([]);
    expect(getColumnsPresetDefinition('value-cards')?.editor).toMatchObject({
      fixedColumns: true,
      maxColumns: 3,
      allowPhotoColumns: false,
      allowColumnActions: false,
    });
  });

  it('resolves preset identity from explicit preset ids and template ids', () => {
    expect(resolveColumnsPresetId({ kind: 'columns', presetId: 'do-the-math' })).toBe('do-the-math');
    expect(resolveColumnsPresetId({ kind: 'columns', templateId: 'columns' })).toBe('default');
  });

  it('builds preset defaults for value cards without reopening the generic style selector', () => {
    expect(buildColumnsPresetSettings('value-cards')).toMatchObject({
      columnsStyle: 'loans-value',
      bgTone: 'white',
      contentWidth: 'browser',
      columns: 'three',
    });
  });
});
