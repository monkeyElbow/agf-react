const IMPACT_PROOF_STORY_ITEMS = Object.freeze([
  Object.freeze({
    id: 'loans',
    value: '4,100+',
    eyebrow: 'Loans',
    valueTone: 'atlantean',
    label: 'loans fueling ministry growth.',
    body: 'Over the last 15 years, those loans represent more than 1.4 million people.',
    tone: 'atlantean',
    action: Object.freeze({
      label: 'Explore loans',
      to: '/services/loans',
      openInNewWindow: false,
    }),
    nativeCardClass: 'impact-native-card impact-native-card--loans',
  }),
  Object.freeze({
    id: 'legacy',
    value: '$450 million',
    eyebrow: 'Planned Giving',
    valueTone: 'mango',
    label: 'distributed to ministries through AG Foundation.',
    body: 'That’s the power of generous donors using smart strategies over the past 10 years alone.',
    tone: 'mango',
    action: Object.freeze({
      label: 'Plan with us',
      to: '/services/planned-giving',
      openInNewWindow: false,
    }),
    nativeCardClass: 'impact-native-card impact-native-card--legacy',
  }),
  Object.freeze({
    id: 'insurance',
    value: '5,117',
    eyebrow: 'Insurance',
    valueTone: 'atlantean',
    label: 'mission trips covered and protected.',
    body: 'Peace of mind shifts the focus to what matters at home and abroad: serving others, and sharing the Gospel with confidence.',
    tone: 'super-grey',
    action: Object.freeze({
      label: 'Cover your ministry',
      to: '/services/insurance',
      openInNewWindow: false,
    }),
    nativeCardClass: 'impact-native-card impact-native-card--insurance',
  }),
  Object.freeze({
    id: 'retirement',
    value: '29,000+',
    eyebrow: 'Retirement',
    valueTone: 'mango',
    labelBreak: 'block',
    label: 'retirements planned.',
    body: 'Your participation helps individuals, churches, ministries—and you—step confidently into the next season.',
    tone: 'atlantean-dark',
    action: Object.freeze({
      label: 'Start your tomorrow',
      to: '/services/retirement',
      openInNewWindow: false,
    }),
    nativeCardClass: 'impact-native-card impact-native-card--retirement',
  }),
]);

export function buildImpactProofStoryMetrics() {
  return Object.freeze(
    IMPACT_PROOF_STORY_ITEMS.map((item) => Object.freeze({
      value: item.value,
      eyebrow: item.eyebrow,
      valueTone: item.valueTone || '',
      labelBreak: item.labelBreak || '',
      label: item.label,
      body: item.body,
      tone: item.tone,
      action: Object.freeze({
        label: item.action.label,
        to: item.action.to,
        openInNewWindow: item.action.openInNewWindow,
      }),
    })),
  );
}

export function buildImpactProofNativeCards() {
  return Object.freeze(
    IMPACT_PROOF_STORY_ITEMS.map((item) => Object.freeze({
      title: item.value,
      titleClassName: 'countup',
      subtitle: item.label,
      body: item.body,
      to: item.action.to,
      cta: item.action.label,
      cardClass: item.nativeCardClass,
    })),
  );
}
