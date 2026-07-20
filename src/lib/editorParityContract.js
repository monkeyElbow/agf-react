import { getAllBlockDefinitions, getBlockDefinition } from '../blocks/registry';

// Guardrail: HUD editors may be slimmer than admin, but they must preserve
// the core editing surface for the same block. Admin may expose extra or more
// advanced controls on top of the parity baseline.
const EDITOR_PARITY_BASE_CONTRACT = Object.freeze({
  grid: Object.freeze({
    mode: 'shared-admin',
    label: 'Grid',
  }),
  fields: Object.freeze({
    mode: 'field-grid',
    label: 'Field Grid',
  }),
});

const CANONICAL_EDITOR_PARITY_CONTRACT = Object.freeze(
  Object.fromEntries(
    getAllBlockDefinitions().map((definition) => ([
      definition.kind,
      Object.freeze({
        mode: definition.kind === 'cta_form'
          ? 'dedicated-hud-adapter'
          : definition.kind === 'intro'
          || definition.kind === 'testimonials'
          || definition.kind === 'content'
          || definition.kind === 'top_strip'
          ? 'custom-hud'
          : 'shared-admin',
        label: definition.label,
      }),
    ])),
  ),
);

const CANONICAL_EDITOR_TYPE_ALIASES = Object.freeze(
  Object.fromEntries(
    getAllBlockDefinitions()
      .filter((definition) => String(definition?.editorType || '').trim() && definition.editorType !== definition.kind)
      .map((definition) => ([
        definition.editorType,
        CANONICAL_EDITOR_PARITY_CONTRACT[definition.kind],
      ])),
  ),
);

export const EDITOR_PARITY_CONTRACT = Object.freeze({
  ...CANONICAL_EDITOR_PARITY_CONTRACT,
  ...CANONICAL_EDITOR_TYPE_ALIASES,
  ...EDITOR_PARITY_BASE_CONTRACT,
});

export const EDITOR_PARITY_TYPES = Object.freeze(Object.keys(EDITOR_PARITY_CONTRACT));

export function getEditorParityContract(editorType) {
  const token = String(editorType || '').trim();
  const canonicalDefinition = getBlockDefinition(token);
  if (canonicalDefinition) {
    return EDITOR_PARITY_CONTRACT[canonicalDefinition.kind] || null;
  }
  const canonicalDefinitionByEditorType = getAllBlockDefinitions()
    .find((definition) => String(definition?.editorType || '').trim() === token);
  if (canonicalDefinitionByEditorType) {
    return EDITOR_PARITY_CONTRACT[canonicalDefinitionByEditorType.kind] || null;
  }
  return EDITOR_PARITY_CONTRACT[token] || null;
}
