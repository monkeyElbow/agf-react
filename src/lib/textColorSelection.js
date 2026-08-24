import {
  applySelectionColor,
  normalizeTextSelectionState,
  readTextSelectionState,
  replaceHeroLineColorClass,
} from './heroHudRanges';

/**
 * Shared text-color assignment contract for HUD editors.
 *
 * A color applies to the current selection when one exists; otherwise it
 * replaces the field's base color. Keeping that decision here prevents each
 * editor from inventing its own focus/selection rules.
 */
export function readColorSelection(input, fallbackSelection = null, text = '') {
  return readTextSelectionState(input, fallbackSelection, text);
}

export function applyTextColorSelection({
  text = '',
  lineClassName = '',
  highlightsJson = '',
  selection = null,
  colorValue = '',
}) {
  const sourceText = String(text || '');
  const normalizedSelection = normalizeTextSelectionState(selection, sourceText);

  if (normalizedSelection.end > normalizedSelection.start) {
    return {
      target: 'selection',
      lineClassName: String(lineClassName || ''),
      highlightsJson: applySelectionColor(
        highlightsJson,
        sourceText,
        normalizedSelection.start,
        normalizedSelection.end,
        colorValue,
      ),
      selection: normalizedSelection,
    };
  }

  return {
    target: 'base',
    lineClassName: replaceHeroLineColorClass(lineClassName, colorValue),
    highlightsJson: String(highlightsJson || ''),
    selection: { start: 0, end: 0, text: '' },
  };
}

