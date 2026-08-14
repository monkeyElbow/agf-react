import { describe, expect, it } from 'vitest';
import {
  getBlockDefinition,
  getBlockPresetDefinitions,
} from '../blocks/registry';
import { getAllBlockTemplateBlueprints } from '../data/contentBlockBlueprints';
import { getBlockHudDefinition } from './blockHudRegistry';
import { buildAdminBlockInsertChoices } from './adminBlockInsertChoices';
import {
  buildPresetFamilyRuntimeClassName,
  PRESET_FAMILY_CONTRACT,
  PRESET_FAMILY_KINDS,
  resolvePresetFamilyRuntimeClassName,
} from './presetFamilyContract';

describe('preset family contract', () => {
  it('keeps canonical preset-bearing families on one shared metadata and runtime-hook standard', () => {
    expect(PRESET_FAMILY_KINDS).toEqual(['columns', 'card_grid', 'billboard']);

    PRESET_FAMILY_KINDS.forEach((kind) => {
      const definition = getBlockDefinition(kind);
      const contract = PRESET_FAMILY_CONTRACT[kind];
      const presets = getBlockPresetDefinitions(kind);

      expect(definition).toBeTruthy();
      expect(contract).toBeTruthy();
      expect(definition?.editorType).toBe(kind);
      expect(definition?.styleScope?.cssNamespace).toBe(contract.cssNamespace);
      expect(definition?.styleScope?.rootClassName).toBe(contract.rootClassName);
      expect(presets.length).toBeGreaterThan(0);

      presets.forEach((preset) => {
        expect(String(preset?.id || '')).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(buildPresetFamilyRuntimeClassName(kind, preset.id)).toBe(
          `${contract.runtimePresetClassPrefix}${preset.id}`,
        );
        expect(resolvePresetFamilyRuntimeClassName({
          id: preset.templateIds?.[0] || `${kind}-${preset.id}`,
          kind,
          mode: 'dynamic',
          presetId: preset.id,
          templateId: preset.templateIds?.[0] || '',
        })).toBe(`${contract.runtimePresetClassPrefix}${preset.id}`);
      });
    });
  });

  it('keeps preset-bearing picker choices aligned to canonical family and preset identity', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'dynamic' });

    choices
      .filter((choice) => PRESET_FAMILY_KINDS.includes(String(choice?.familyKind || '').trim()) && !choice?.isCompatibility)
      .forEach((choice) => {
        const definition = getBlockDefinition(choice.familyKind);
        const presetDefinition = getBlockPresetDefinitions(choice.familyKind)
          .find((preset) => preset.id === choice.presetId);

        expect(choice.kind).toBe(choice.familyKind);
        expect(choice.familyLabel).toBe(definition?.label);
        expect(choice.presetId).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(choice.presetLabel).toBe(presetDefinition?.label);
        expect(choice.name).toBe(
          choice.familyLabel === choice.presetLabel
            ? choice.familyLabel
            : `${choice.familyLabel} · ${choice.presetLabel}`,
        );
      });
  });

  it('keeps HUD editor identity aligned to canonical family kinds for preset-bearing samples', () => {
    PRESET_FAMILY_KINDS.forEach((kind) => {
      getBlockPresetDefinitions(kind).forEach((preset) => {
        const sampleBlock = {
          id: preset.templateIds?.[0] || `${kind}-${preset.id}`,
          kind,
          mode: 'dynamic',
          presetId: preset.id,
          templateId: preset.templateIds?.[0] || '',
        };

        expect(getBlockHudDefinition(sampleBlock).editorType).toBe(kind);
      });
    });
  });
});
