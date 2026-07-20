import { defineEditorSections, getEditorSectionsForSurface } from './editorDescriptors';

export const BLOCK_KIND_VALUES = Object.freeze([
  'billboard',
  'calculator_cta',
  'card_grid',
  'columns',
  'content',
  'cta_band',
  'cta_form',
  'feature_panel',
  'hero',
  'hero_pie',
  'impact_stat',
  'intro',
  'legal_copy',
  'newsletter',
  'photo_column',
  'rates',
  'request_form',
  'services_grid',
  'site_feature',
  'split_panel',
  'testimonials',
  'top_strip',
]);

export const BLOCK_MODE_VALUES = Object.freeze([
  'dynamic',
]);

export const BLOCK_VARIANT_VALUES = Object.freeze([
  'default',
  'band',
  'feature',
  'inline',
  'split',
  'wide',
]);

export function isBlockKind(value) {
  return BLOCK_KIND_VALUES.includes(String(value || '').trim());
}

export function isBlockMode(value) {
  return BLOCK_MODE_VALUES.includes(String(value || '').trim());
}

export function isBlockVariant(value) {
  return BLOCK_VARIANT_VALUES.includes(String(value || '').trim());
}

function normalizeStringList(values) {
  return Object.freeze(
    Array.from(new Set((Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean))),
  );
}

/**
 * @typedef {string} BlockKind
 * @typedef {string} BlockVariant
 * @typedef {'dynamic'} BlockMode
 * @typedef {{
 *   id?: string,
 *   kind: BlockKind,
 *   mode?: BlockMode,
 *   variant?: BlockVariant,
 *   settings?: Record<string, unknown>,
 *   hidden?: boolean|string
 * }} BlockInstance
 * @typedef {{
 *   kind: BlockKind,
 *   label: string,
 *   icon?: string,
 *   editorType: string,
 *   singleton?: boolean,
 *   presets?: Array<object>,
 *   allowedVariants: BlockVariant[],
 *   supportedModes: BlockMode[],
 *   defaults: Record<string, unknown>,
 *   schema: { fields: Array<object> },
 *   renderer: { buildRuntime: Function },
 *   editor: { sections: Array<object>, hudSectionIds: string[], adminSectionIds: string[] },
 *   validators: Array<Function>,
 *   styleScope: { rootClassName: string, cssNamespace?: string }
 * }} BlockDefinition
 */

export function createBlockDefinition(definition) {
  const nextDefinition = definition && typeof definition === 'object' ? definition : {};
  const kind = String(nextDefinition.kind || '').trim();
  const editorType = String(nextDefinition.editorType || kind || '').trim();
  const label = String(nextDefinition.label || kind || '').trim();
  const allowedVariants = normalizeStringList(
    Array.isArray(nextDefinition.allowedVariants) && nextDefinition.allowedVariants.length
      ? nextDefinition.allowedVariants
      : ['default'],
  );
  const supportedModes = normalizeStringList(
    Array.isArray(nextDefinition.supportedModes) && nextDefinition.supportedModes.length
      ? nextDefinition.supportedModes
      : ['dynamic'],
  );
  const sections = defineEditorSections(nextDefinition?.editor?.sections || []);
  const hudSectionIds = normalizeStringList(nextDefinition?.editor?.hudSectionIds || []);
  const adminSectionIds = normalizeStringList(nextDefinition?.editor?.adminSectionIds || []);
  const schemaFields = Array.isArray(nextDefinition?.schema?.fields)
    ? nextDefinition.schema.fields
    : sections.flatMap((section) => section.fields);
  const validators = Object.freeze(
    (Array.isArray(nextDefinition.validators) ? nextDefinition.validators : [])
      .filter((validator) => typeof validator === 'function'),
  );
  const presets = Object.freeze(
    (Array.isArray(nextDefinition.presets) ? nextDefinition.presets : [])
      .filter((preset) => preset && typeof preset === 'object' && String(preset.id || '').trim())
      .map((preset) => Object.freeze({
        ...preset,
        templateIds: Object.freeze(
          Array.from(new Set((Array.isArray(preset.templateIds) ? preset.templateIds : [])
            .map((value) => String(value || '').trim())
            .filter(Boolean))),
        ),
        defaults: Object.freeze({ ...(preset.defaults || {}) }),
        editor: Object.freeze({
          ...(preset.editor || {}),
          layoutFieldIds: Object.freeze(Array.isArray(preset?.editor?.layoutFieldIds) ? preset.editor.layoutFieldIds.map((value) => String(value || '').trim()).filter(Boolean) : []),
          contentFieldIds: Object.freeze(Array.isArray(preset?.editor?.contentFieldIds) ? preset.editor.contentFieldIds.map((value) => String(value || '').trim()).filter(Boolean) : []),
          actionFieldIds: Object.freeze(Array.isArray(preset?.editor?.actionFieldIds) ? preset.editor.actionFieldIds.map((value) => String(value || '').trim()).filter(Boolean) : []),
          cardFeatures: Object.freeze({ ...(preset?.editor?.cardFeatures || {}) }),
        }),
      })),
  );
  const styleScope = Object.freeze({
    rootClassName: String(nextDefinition?.styleScope?.rootClassName || '').trim(),
    cssNamespace: String(nextDefinition?.styleScope?.cssNamespace || '').trim() || undefined,
  });

  if (!isBlockKind(kind)) {
    throw new Error(`Invalid block definition kind "${kind || '<empty>'}".`);
  }
  if (!label) {
    throw new Error(`Block definition "${kind}" is missing a label.`);
  }
  if (!editorType) {
    throw new Error(`Block definition "${kind}" is missing an editorType.`);
  }
  if (!sections.length) {
    throw new Error(`Block definition "${kind}" must define editor sections.`);
  }
  if (!hudSectionIds.length || !adminSectionIds.length) {
    throw new Error(`Block definition "${kind}" must define HUD and admin section ids.`);
  }
  if (!supportedModes.every(isBlockMode)) {
    throw new Error(`Block definition "${kind}" has unsupported modes.`);
  }
  if (!styleScope.rootClassName) {
    throw new Error(`Block definition "${kind}" must define a styleScope.rootClassName.`);
  }
  if (typeof nextDefinition?.renderer?.buildRuntime !== 'function') {
    throw new Error(`Block definition "${kind}" must define renderer.buildRuntime.`);
  }

  const sectionIds = new Set(sections.map((section) => section.id));
  [...hudSectionIds, ...adminSectionIds].forEach((sectionId) => {
    if (!sectionIds.has(sectionId)) {
      throw new Error(`Block definition "${kind}" references unknown editor section "${sectionId}".`);
    }
  });

  return Object.freeze({
    kind,
    label,
    icon: nextDefinition.icon,
    editorType,
    singleton: Boolean(nextDefinition.singleton),
    presets,
    allowedVariants,
    supportedModes,
    defaults: Object.freeze({ ...(nextDefinition.defaults || {}) }),
    schema: Object.freeze({
      ...(nextDefinition.schema || {}),
      fields: Object.freeze(Array.isArray(schemaFields) ? schemaFields.map((field) => ({ ...field })) : []),
    }),
    renderer: Object.freeze({
      ...nextDefinition.renderer,
      buildRuntime: nextDefinition.renderer.buildRuntime,
    }),
    editor: Object.freeze({
      sections,
      hudSectionIds,
      adminSectionIds,
    }),
    validators,
    styleScope,
  });
}

export function getDefinitionSections(definition, surface = 'admin') {
  const requestedSectionIds = surface === 'hud'
    ? definition?.editor?.hudSectionIds
    : definition?.editor?.adminSectionIds;
  return getEditorSectionsForSurface(definition?.editor?.sections || [], surface, requestedSectionIds);
}

export function createBlockInstance(block) {
  const nextBlock = block && typeof block === 'object' ? block : {};
  const mode = isBlockMode(nextBlock.mode) ? nextBlock.mode : 'dynamic';
  const variant = isBlockVariant(nextBlock.variant) ? nextBlock.variant : 'default';

  return {
    ...nextBlock,
    kind: String(nextBlock.kind || '').trim(),
    mode,
    variant,
    settings: nextBlock.settings && typeof nextBlock.settings === 'object' ? { ...nextBlock.settings } : {},
  };
}
