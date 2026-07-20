import {
  getBlockDefinition,
  getBlockPresetDefinitions,
} from '../blocks/registry';
import { buildBlockTemplateCreateId } from './blockTemplateIdentity';
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

    const definition = getBlockDefinition(kind);
    const familyLabel = String(definition?.label || kind).trim() || kind;
    const presetDefinitions = getBlockPresetDefinitions(kind);
    const usedTemplateKeys = new Set();
    const familyUsesExplicitPresetIds = familyTemplates.some((template) => normalizeToken(template?.presetId));

    presetDefinitions.forEach((presetDefinition) => {
      const canonicalPresetId = normalizeToken(presetDefinition?.id);
      const explicitPresetTemplates = familyTemplates.filter((template) => (
        normalizeToken(template?.presetId) === canonicalPresetId
      ));
      const presetTemplateIds = new Set(
        (Array.isArray(presetDefinition?.templateIds) ? presetDefinition.templateIds : [])
          .map(normalizeToken)
          .filter(Boolean),
      );
      const presetTemplates = explicitPresetTemplates.length
        ? explicitPresetTemplates
        : (familyUsesExplicitPresetIds
          ? []
          : familyTemplates.filter((template) => presetTemplateIds.has(normalizeToken(template?.templateId))));
      if (!presetTemplates.length) {
        return;
      }

      const representative = pickRepresentativeTemplate(presetTemplates, kind, presetDefinition);
      if (!representative) {
        return;
      }

      usedTemplateKeys.add(String(representative.templateLookupId || representative.id || representative.templateId || '').trim());
      const usesCanonicalTemplateId = normalizeToken(representative.templateId) === normalizeToken(kind);

      choices.push({
        id: `${targetMode}:${kind}:${presetDefinition.id}`,
        createTemplateId: buildBlockTemplateCreateId(representative),
        templateId: String(representative.templateId || '').trim(),
        kind,
        editorType: String(definition?.editorType || kind).trim(),
        canonicalLabel: familyLabel,
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
        createTemplateId: buildBlockTemplateCreateId(template),
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
