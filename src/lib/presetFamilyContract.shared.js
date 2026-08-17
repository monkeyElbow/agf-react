export const PRESET_FAMILY_CONTRACT = Object.freeze({
  columns: Object.freeze({
    cssNamespace: 'columns',
    rootClassName: 'native-dynamic-columns',
    runtimePresetClassPrefix: 'is-columns-preset-',
  }),
  card_grid: Object.freeze({
    cssNamespace: 'card-grid',
    rootClassName: 'native-dynamic-grid',
    runtimePresetClassPrefix: 'is-card-grid-preset-',
  }),
  billboard: Object.freeze({
    cssNamespace: 'billboard',
    rootClassName: 'dynamic-billboard',
    runtimePresetClassPrefix: 'is-billboard-preset-',
  }),
});

export const PRESET_FAMILY_KINDS = Object.freeze(Object.keys(PRESET_FAMILY_CONTRACT));
