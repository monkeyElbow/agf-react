const EMPTY_HIGHLIGHTS_JSON = '[]';

const REQUEST_FORM_PRESET_PRESENTATION_CONTRACTS = Object.freeze({
  'legacy-impact': Object.freeze({
    bgTone: 'blue',
    textTone: 'dark',
    titleClassName: 'is-super-grey',
    titleHighlightsJson: EMPTY_HIGHLIGHTS_JSON,
    spaceBeforeRem: 3.6,
    spaceAfterRem: 4.2,
    hideStepTitles: true,
    clearStepMeta: true,
  }),
});

export function getRequestFormPresetPresentationContract(presetId) {
  const token = String(presetId || '').trim().toLowerCase();
  return REQUEST_FORM_PRESET_PRESENTATION_CONTRACTS[token] || null;
}

export function normalizeRequestFormPresetSettings(settings, presetId) {
  const source = settings && typeof settings === 'object' ? settings : {};
  const contract = getRequestFormPresetPresentationContract(presetId || source.presetId || source.requestFormPresetId);
  if (!contract) {
    return source;
  }

  const nextSettings = {
    ...source,
    bgTone: contract.bgTone,
    textTone: contract.textTone,
    titleClassName: contract.titleClassName,
    titleHighlightsJson: contract.titleHighlightsJson,
    spaceBeforeRem: contract.spaceBeforeRem,
    spaceAfterRem: contract.spaceAfterRem,
    hideStepTitles: contract.hideStepTitles,
  };

  if (contract.clearStepMeta) {
    [1, 2, 3, 4, 5].forEach((slot) => {
      nextSettings[`step${slot}Title`] = '';
      nextSettings[`step${slot}Note`] = '';
      nextSettings[`step${slot}Alert`] = '';
    });
  }

  return nextSettings;
}
