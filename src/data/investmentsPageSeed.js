import { defaultInvestmentsCtaSettings } from './ctaFormSeeds';
import { serializeLinkValue } from '../lib/linkValue';

export { defaultInvestmentsCtaSettings } from './ctaFormSeeds';

export const defaultInvestmentsGrowthFeatureSettings = Object.freeze({
  featureId: 'investments_growth_feature',
  body: '',
  buttonLabel: 'Log in to manage',
  buttonLinkJson: serializeLinkValue({
    kind: 'external',
    href: 'https://secure.agfinancial.org/',
    openInNewWindow: true,
  }),
});
