import {
  getBlockDefinition,
  getBlockPresetDefinitions,
  resolveBlockPresetDefinition,
} from '../blocks/registry';
import { isRetiredInsertCompatibilityTemplateId } from './compatibilityTemplateRetirement';
import { PRESET_FAMILY_KINDS } from './presetFamilyContract';

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function compareTemplateIdsByPreference(leftId, rightId, preferredTemplateIds) {
  const leftIndex = preferredTemplateIds.indexOf(normalizeToken(leftId));
  const rightIndex = preferredTemplateIds.indexOf(normalizeToken(rightId));
  if (leftIndex !== rightIndex) {
    return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex)
      - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
  }
  return String(leftId || '').localeCompare(String(rightId || ''));
}

function pickRepresentativeTemplate(templates, kind, presetDefinition) {
  const preferredTemplateIds = [
    normalizeToken(kind),
    ...((Array.isArray(presetDefinition?.templateIds) ? presetDefinition.templateIds : []).map(normalizeToken)),
  ];

  return [...templates].sort((left, right) => (
    compareTemplateIdsByPreference(left?.templateId, right?.templateId, preferredTemplateIds)
  ))[0] || null;
}

function buildBaseHaystack(parts) {
  return parts
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
}

function matchesInsertChoiceSearch(choice, needle) {
  if (!needle) {
    return true;
  }
  const haystack = buildBaseHaystack([
    choice?.name,
    choice?.description,
    choice?.kind,
    choice?.familyLabel,
    choice?.presetLabel,
    choice?.templateId,
  ]);
  return haystack.includes(needle);
}

function compareInsertChoices(left, right) {
  if (Boolean(left?.isCompatibility) !== Boolean(right?.isCompatibility)) {
    return left?.isCompatibility ? 1 : -1;
  }

  const leftFamily = String(left?.familyLabel || '').trim();
  const rightFamily = String(right?.familyLabel || '').trim();
  const familyCompare = leftFamily.localeCompare(rightFamily);
  if (familyCompare !== 0) {
    return familyCompare;
  }

  const leftPreset = String(left?.presetLabel || '').trim();
  const rightPreset = String(right?.presetLabel || '').trim();
  const presetCompare = leftPreset.localeCompare(rightPreset);
  if (presetCompare !== 0) {
    return presetCompare;
  }

  return String(left?.name || '').localeCompare(String(right?.name || ''));
}

function buildPresetBearingChoices(templatesByKind, targetMode) {
  const choices = [];

  PRESET_FAMILY_KINDS.forEach((kind) => {
    const familyTemplates = Array.isArray(templatesByKind.get(kind)) ? templatesByKind.get(kind) : [];
    if (!familyTemplates.length) {
      return;
    }

    const familyLabel = String(getBlockDefinition(kind)?.label || kind).trim() || kind;
    const presetDefinitions = getBlockPresetDefinitions(kind);
    const usedTemplateIds = new Set();

    presetDefinitions.forEach((presetDefinition) => {
      const presetTemplateIds = new Set(
        (Array.isArray(presetDefinition?.templateIds) ? presetDefinition.templateIds : [])
          .map(normalizeToken)
          .filter(Boolean),
      );
      const presetTemplates = familyTemplates.filter((template) => presetTemplateIds.has(normalizeToken(template?.templateId)));
      if (!presetTemplates.length) {
        return;
      }

      const representative = pickRepresentativeTemplate(presetTemplates, kind, presetDefinition);
      if (!representative) {
        return;
      }

      usedTemplateIds.add(String(representative.templateId || '').trim());
      const usesCanonicalTemplateId = normalizeToken(representative.templateId) === normalizeToken(kind);

      choices.push({
        id: `${targetMode}:${kind}:${presetDefinition.id}`,
        createTemplateId: String(representative.templateLookupId || representative.templateId || '').trim(),
        templateId: String(representative.templateId || '').trim(),
        kind,
        familyKind: kind,
        familyLabel,
        presetId: String(presetDefinition.id || '').trim(),
        presetLabel: String(presetDefinition.label || '').trim(),
        name: `${familyLabel} · ${presetDefinition.label}`,
        description: usesCanonicalTemplateId
          ? 'Canonical family preset'
          : `Canonical family preset via compatibility template: ${representative.name}`,
        mode: targetMode,
        isCompatibility: false,
      });
    });

    familyTemplates
      .filter((template) => !usedTemplateIds.has(String(template?.templateId || '').trim()))
      .filter((template) => !isRetiredInsertCompatibilityTemplateId(template?.templateId, targetMode))
      .forEach((template) => {
        const presetDefinition = resolveBlockPresetDefinition(template);
        choices.push({
          id: `${targetMode}:compat:${String(template?.templateId || '').trim()}`,
          createTemplateId: String(template?.templateLookupId || template?.templateId || '').trim(),
          templateId: String(template?.templateId || '').trim(),
          kind,
          familyKind: kind,
          familyLabel,
          presetId: String(presetDefinition?.id || '').trim(),
          presetLabel: String(presetDefinition?.label || '').trim(),
          name: `${familyLabel} compatibility · ${String(template?.name || template?.templateId || familyLabel).trim()}`,
          description: presetDefinition
            ? `Compatibility template for ${presetDefinition.label}`
            : 'Compatibility template',
          mode: targetMode,
          isCompatibility: true,
        });
      });
  });

  return choices;
}

export function buildAdminBlockInsertChoices(availableBlockTemplates, options = {}) {
  const targetMode = normalizeToken(options?.mode || 'dynamic') || 'dynamic';
  const needle = normalizeToken(options?.search || '');
  const sourceTemplates = (Array.isArray(availableBlockTemplates) ? availableBlockTemplates : [])
    .filter((template) => normalizeToken(template?.mode) === targetMode);
  const templatesByKind = new Map();

  sourceTemplates.forEach((template) => {
    const kind = normalizeToken(template?.kind);
    if (!kind) {
      return;
    }
    if (!templatesByKind.has(kind)) {
      templatesByKind.set(kind, []);
    }
    templatesByKind.get(kind).push(template);
  });

  const presetBearingChoices = buildPresetBearingChoices(templatesByKind, targetMode);
  const genericChoices = sourceTemplates
    .filter((template) => !PRESET_FAMILY_KINDS.includes(normalizeToken(template?.kind)))
    .map((template) => {
      const kind = String(template?.kind || '').trim();
      const definition = getBlockDefinition(kind);
      return {
        id: `${targetMode}:template:${String(template?.templateId || '').trim()}`,
        createTemplateId: String(template?.templateLookupId || template?.templateId || '').trim(),
        templateId: String(template?.templateId || '').trim(),
        kind,
        editorType: String(definition?.editorType || kind).trim(),
        canonicalLabel: String(definition?.label || kind || 'Block').trim(),
        familyKind: '',
        familyLabel: '',
        presetId: '',
        presetLabel: '',
        name: String(template?.name || template?.templateId || template?.kind || 'Block').trim(),
        description: String(template?.description || template?.kind || '').trim(),
        mode: targetMode,
        isCompatibility: false,
      };
    });

  return [...presetBearingChoices, ...genericChoices]
    .filter((choice) => matchesInsertChoiceSearch(choice, needle))
    .sort(compareInsertChoices);
}
