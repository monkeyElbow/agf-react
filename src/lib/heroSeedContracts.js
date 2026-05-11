export const HERO_SEED_CONTRACTS_BY_PATH = {
  '/': {
    animationPreset: 'default',
    bgTone: 'white',
    justify: 'left',
    actionJustify: 'left',
    lineGap: 0,
    lineHeight: 0.9,
    lines: [
      {
        text: "Today's investment.",
        className: 'home-native-eyebrow',
        highlightsJson: '[{"text":"investment","className":"is-atlantean"}]',
      },
      {
        text: "Tomorrow's church.",
        className: 'home-native-title line1 line2',
        highlightsJson: '[{"text":"church","className":"is-mango"}]',
      },
      {
        text: '',
        className: 'home-native-title line3',
        highlightsJson: '',
      },
    ],
    actions: [
      {
        label: 'Explore investments',
        pageRef: '/services/investments',
        url: '',
        style: 'blue',
        tone: 'atlantean',
        openInNewWindow: false,
      },
    ],
  },
  '/services/loans': {
    animationPreset: 'loans-unblur',
    bgTone: 'white',
    justify: 'center',
    actionJustify: 'center',
    lineGap: 0,
    lineHeight: 0.9,
    lines: [
      {
        text: 'Your vision.',
        className: 'loans-native-hero-line is-vision',
        highlightsJson: '[{"text":"Your","className":"is-super-grey"},{"text":".","className":"is-super-grey"}]',
      },
      {
        text: 'Our purpose.',
        className: 'loans-native-hero-line is-purpose',
        highlightsJson: '[{"text":"Our","className":"is-super-grey"},{"text":".","className":"is-super-grey"}]',
      },
    ],
    actions: [],
  },
  '/services/investments': {
    animationPreset: 'loans-unblur',
    bgTone: 'white',
    justify: 'left',
    actionJustify: 'left',
    lineGap: 0,
    lineHeight: 0.9,
    lines: [
      {
        text: 'Your investments.',
        className: 'line1',
        highlightsJson: '[{"text":"investments","className":"is-atlantean"}]',
      },
      {
        text: 'Your faith.',
        className: 'line2',
        highlightsJson: '[{"text":"faith","className":"is-mango"}]',
      },
      {
        text: 'Better together.',
        className: 'line3',
        highlightsJson: '[{"text":"together","className":"is-sandstone"}]',
      },
    ],
    actions: [],
  },
  '/services/retirement': {
    animationPreset: 'default',
    bgTone: 'white',
    justify: 'center',
    actionJustify: 'center',
    lineGap: 0,
    lineHeight: 0.9,
    lines: [
      {
        text: 'Your future.',
        className: 'retirement-native-hero-line line1',
        highlightsJson: '[{"text":"future","className":"is-atlantean"}]',
      },
      {
        text: 'Your plan.',
        className: 'retirement-native-hero-line line2',
        highlightsJson: '[{"text":"plan","className":"is-mango"}]',
      },
    ],
    actions: [],
  },
};

export function getHeroSeedContract(pathname) {
  const contract = HERO_SEED_CONTRACTS_BY_PATH[String(pathname || '').trim()];
  if (!contract) {
    return null;
  }
  return JSON.parse(JSON.stringify(contract));
}
