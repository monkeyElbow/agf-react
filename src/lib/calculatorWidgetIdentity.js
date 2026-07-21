export const CALCULATOR_WIDGET_KIND = 'calculator_widget';
export const CALCULATOR_WIDGET_BLOCK_ID = 'calculator_tool';
export const CALCULATOR_WIDGET_LABEL = 'Calculator Tool';

export const CALCULATOR_WIDGET_EDITABLE_FIELDS = Object.freeze([
  Object.freeze({ id: 'widget', label: 'Widget key', type: 'text' }),
  Object.freeze({ id: 'fullBleed', label: 'Full bleed rail', type: 'boolean' }),
  Object.freeze({ id: 'spaceBeforeRem', label: 'Space before (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
  Object.freeze({ id: 'spaceAfterRem', label: 'Space after (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
  Object.freeze({ id: 'paddingTopRem', label: 'Padding top (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
  Object.freeze({ id: 'paddingBottomRem', label: 'Padding bottom (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
  Object.freeze({ id: 'contentMaxWidthPx', label: 'Content max width (px)', type: 'number', min: 560, max: 1440, step: 10 }),
  Object.freeze({ id: 'anchorId', label: 'Anchor ID', type: 'text' }),
  Object.freeze({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
]);

const CALCULATOR_WIDGET_DEFAULT_SETTINGS = Object.freeze({
  widget: '',
  fullBleed: false,
  spaceBeforeRem: 0,
  spaceAfterRem: 0,
  paddingTopRem: 2.4,
  paddingBottomRem: 2.4,
  contentMaxWidthPx: 980,
  anchorId: '',
  sectionClassName: 'calculator-tool-shell calculator-tool-widget',
});

function cloneEditableFields() {
  return CALCULATOR_WIDGET_EDITABLE_FIELDS.map((field) => ({ ...field }));
}

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function shouldNormalizeCalculatorWidgetBlock(block) {
  return (
    normalizeToken(block?.id) === CALCULATOR_WIDGET_BLOCK_ID
    && normalizeToken(block?.mode || 'dynamic') === 'dynamic'
    && ['content', CALCULATOR_WIDGET_KIND].includes(normalizeToken(block?.kind))
  );
}

export function normalizeCalculatorWidgetBlock(block) {
  if (!shouldNormalizeCalculatorWidgetBlock(block)) {
    return block;
  }

  const sourceSettings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : {};
  const settings = Object.fromEntries(
    Object.entries(CALCULATOR_WIDGET_DEFAULT_SETTINGS).map(([key, defaultValue]) => [
      key,
      Object.prototype.hasOwnProperty.call(sourceSettings, key) ? sourceSettings[key] : defaultValue,
    ]),
  );

  return {
    ...block,
    name: CALCULATOR_WIDGET_LABEL,
    kind: CALCULATOR_WIDGET_KIND,
    mode: 'dynamic',
    settings,
    editableFields: cloneEditableFields(),
  };
}

export function normalizeCalculatorWidgetBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => normalizeCalculatorWidgetBlock(block));
}
