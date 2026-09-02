import { getTokenSwatch } from './colorSystem';

// Shared value-card color choices. Card-grid and code-managed gallery features
// use the same tokens so their editors and renderers do not drift apart.
export const DYNAMIC_GRID_TEXT_TONE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'super-grey', label: 'Super Grey', swatch: getTokenSwatch('super-grey') }),
  Object.freeze({ value: 'atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') }),
  Object.freeze({ value: 'mango', label: 'Mango', swatch: getTokenSwatch('mango') }),
  Object.freeze({ value: 'melon', label: 'Melon', swatch: getTokenSwatch('melon') }),
  Object.freeze({ value: 'white', label: 'White', swatch: getTokenSwatch('white') }),
]);

export const DYNAMIC_GRID_BODY_TONE_OPTIONS = Object.freeze([
  ...DYNAMIC_GRID_TEXT_TONE_OPTIONS,
  Object.freeze({
    value: 'alternating',
    label: 'Alternating brand colors',
    swatch: 'linear-gradient(90deg, #00adbb 0 33%, #f6b146 33% 66%, #f48f7a 66%)',
  }),
]);

export const DYNAMIC_GRID_TITLE_TONE_OPTIONS = Object.freeze([
  ...DYNAMIC_GRID_TEXT_TONE_OPTIONS,
  Object.freeze({
    value: 'alternating',
    label: 'Alternating brand colors',
    swatch: 'linear-gradient(90deg, #00adbb 0 33%, #f6b146 33% 66%, #f48f7a 66%)',
  }),
]);
