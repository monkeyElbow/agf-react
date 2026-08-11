import { describe, expect, it } from 'vitest';
import { getAllBlockDefinitions } from '../blocks/registry';
import { getAllBlockTemplateBlueprints } from '../data/contentBlockBlueprints';
import {
  createEditorControlProbeBlock,
  createEditorControlProbeValue,
  getEditorControlFields,
  patchEditorControl,
  buildEditorControlRuntime,
} from './editorControlContract';

function serialize(value) {
  return JSON.stringify(value, (_key, candidate) => (
    typeof candidate === 'function' ? '[function]' : candidate
  ));
}

function uniqueFields(fields) {
  const seen = new Set();
  return fields.filter((field) => {
    const fieldId = String(field?.id || '').trim();
    if (!fieldId || seen.has(fieldId)) {
      return false;
    }
    seen.add(fieldId);
    return true;
  });
}

const dynamicBlueprints = getAllBlockTemplateBlueprints().filter((block) => block?.mode === 'dynamic');

function createBaseBlock(definition) {
  const sample = dynamicBlueprints.find((block) => block?.kind === definition.kind);
  return createEditorControlProbeBlock(definition, {
    id: `editor-control-probe-${definition.kind}`,
    ...(sample || {}),
    settings: {
      ...(sample?.settings || {}),
    },
  });
}

function createActiveProbeBlock(definition, baseBlock, fields) {
  return fields.reduce((block, field) => (
    patchEditorControl(
      block,
      field,
      createEditorControlProbeValue(field, {
        kind: definition.kind,
        currentValue: block.settings?.[field.id],
      }),
    )
  ), baseBlock);
}

function createFieldBaseline(block, field) {
  const fieldId = String(field?.id || '');
  const settings = { ...(block.settings || {}) };
  if (block.kind === 'columns') {
    settings.columnsStyle = 'retirement';
    [1, 2, 3, 4].forEach((slot) => {
      settings[`col${slot}Enabled`] = true;
      settings[`col${slot}Title`] ||= `Column ${slot}`;
    });
  }
  if (fieldId === 'buttonLinkJson') {
    delete settings.buttonAction;
    delete settings.buttonTargetAnchorId;
    delete settings.buttonTargetBlockId;
    return { ...block, settings };
  }
  const actionMatch = fieldId.match(/^(button\d+)(?:Action|TargetAnchorId|TargetBlockId)$/);
  if (actionMatch) {
    delete settings[`${actionMatch[1]}LinkJson`];
    return { ...block, settings };
  }
  if (!fieldId.endsWith('DocumentId')) {
    return { ...block, settings };
  }

  const baseId = fieldId.slice(0, -'DocumentId'.length);
  delete settings[`${baseId}LinkJson`];
  return { ...block, settings };
}

describe('editor control draft/live contract', () => {
  it('declares a concrete field list for every editor surface', () => {
    getAllBlockDefinitions().forEach((definition) => {
      ['admin', 'hud'].forEach((surface) => {
        const fields = uniqueFields(getEditorControlFields(definition.kind, surface));
        expect(new Set(fields.map((field) => field.id)).size, `${definition.kind}/${surface} duplicate fields`)
          .toBe(fields.length);
        fields.forEach((field) => {
          expect(field.label, `${definition.kind}/${surface}/${field.id} label`).toEqual(expect.any(String));
          expect(field.type, `${definition.kind}/${surface}/${field.id} type`).toEqual(expect.any(String));
        });
      });
    });
  });

  it('keeps every declared admin control in draft until an explicit publish', () => {
    getAllBlockDefinitions().forEach((definition) => {
      const fields = uniqueFields(getEditorControlFields(definition.kind, 'admin'));
      const baseBlock = createBaseBlock(definition);
      const activeProbeBlock = createActiveProbeBlock(definition, baseBlock, fields);
      const baseRuntime = buildEditorControlRuntime(definition, baseBlock);

      fields.forEach((field) => {
        const fieldBaseline = createFieldBaseline(activeProbeBlock, field);
        const value = createEditorControlProbeValue(field, {
          kind: definition.kind,
          currentValue: fieldBaseline.settings?.[field.id],
          variant: 'alternate-2',
        });
        const draftBlock = patchEditorControl(fieldBaseline, field, value);
        const draftRuntime = buildEditorControlRuntime(definition, draftBlock);
        const publishedBeforeSave = buildEditorControlRuntime(definition, baseBlock);
        const publishedAfterSave = buildEditorControlRuntime(definition, draftBlock);

        expect(draftBlock.settings, `${definition.kind}/${field.id} draft settings`).toHaveProperty(field.id);
        expect(serialize(publishedBeforeSave), `${definition.kind}/${field.id} draft leaked live`)
          .toBe(serialize(baseRuntime));
        expect(serialize(publishedAfterSave), `${definition.kind}/${field.id} published runtime differs from draft runtime`)
          .toBe(serialize(draftRuntime));
      });
    });
  }, 30000);

  it('makes every declared HUD control writable through the same draft settings contract', () => {
    const missingAdminContracts = [];
    getAllBlockDefinitions().forEach((definition) => {
      const adminFields = uniqueFields(getEditorControlFields(definition.kind, 'admin'));
      const hudFields = uniqueFields(getEditorControlFields(definition.kind, 'hud'));
      const adminFieldIds = new Set(adminFields.map((field) => field.id));
      const baseBlock = createBaseBlock(definition);

      hudFields.forEach((field) => {
        if (!adminFieldIds.has(field.id)) {
          missingAdminContracts.push(`${definition.kind}/hud/${field.id}`);
        }
        const fieldBaseline = createFieldBaseline(baseBlock, field);
        const draftBlock = patchEditorControl(fieldBaseline, field, createEditorControlProbeValue(field, {
          kind: definition.kind,
          currentValue: fieldBaseline.settings?.[field.id],
          variant: 'hud',
        }));
        expect(draftBlock.settings, `${definition.kind}/hud/${field.id} draft settings`)
          .toHaveProperty(field.id);
        expect(draftBlock.settings[field.id], `${definition.kind}/hud/${field.id} draft value`)
          .toEqual(createEditorControlProbeValue(field, {
            kind: definition.kind,
            currentValue: fieldBaseline.settings?.[field.id],
            variant: 'hud',
          }));
      });
    });
    expect(missingAdminContracts, 'HUD controls without admin contracts').toEqual([]);
  }, 30000);
});
