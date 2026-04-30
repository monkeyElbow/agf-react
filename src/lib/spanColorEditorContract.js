// Guardrail: any block kind listed here is expected to keep span-color
// preview/editing available in both the admin editor and the front HUD panel.
export const SPAN_COLOR_EDITOR_CONTRACT = Object.freeze({
  hero: Object.freeze({
    label: 'Hero',
    hudEditorType: 'hero',
  }),
  intro: Object.freeze({
    label: 'Intro',
    hudEditorType: 'intro',
  }),
  billboard: Object.freeze({
    label: 'Billboard',
    hudEditorType: 'billboard',
  }),
  cta_form: Object.freeze({
    label: 'CTA Form',
    hudEditorType: 'cta_form',
  }),
  request_form: Object.freeze({
    label: 'Request Form',
    hudEditorType: 'request_form',
  }),
  columns: Object.freeze({
    label: 'Columns',
    hudEditorType: 'columns',
  }),
  newsletter: Object.freeze({
    label: 'Newsletter',
    hudEditorType: 'newsletter',
  }),
  card_grid: Object.freeze({
    label: 'Card Grid',
    hudEditorType: 'card_grid',
  }),
});

export const SPAN_COLOR_EDITOR_KINDS = Object.freeze(Object.keys(SPAN_COLOR_EDITOR_CONTRACT));

export function getSpanColorEditorContract(kind) {
  const token = String(kind || '').trim();
  return SPAN_COLOR_EDITOR_CONTRACT[token] || null;
}

export function isSpanColorEditorKind(kind) {
  return Boolean(getSpanColorEditorContract(kind));
}
