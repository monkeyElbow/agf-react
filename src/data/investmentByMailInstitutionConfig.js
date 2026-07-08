export const investmentByMailInstitutionDocumentIds = Object.freeze({
  offeringCircular: 'document-investments-aglf-offering-circular',
  investmentForm: 'document-investments-institutional-investment-form',
});

export const investmentByMailInstitutionMailAddressLines = Object.freeze([
  'AGFinancial Investments',
  '3900 S Overland Ave',
  'Springfield, MO 65807',
]);

export const investmentByMailInstitutionMailReminder = 'If you are establishing a new account, don’t forget to include your two forms of identification.';

export const investmentByMailInstitutionIntroCopy = 'Complete these steps to open an investment by mail with AGFinancial, or you may open an investment online. Questions? Contact us for assistance at 866.621.1787 or email us at investments@agfinancial.org.';

export const investmentByMailInstitutionExistingInvestorQuestion = 'Are you or a relative currently investing in AGFinancial investments?';

export const investmentByMailInstitutionStandardAcknowledgment = 'I have received and agree with the terms of this Offering Circular.';

export const investmentByMailInstitutionLimitedClassAcknowledgment = 'I have received and agree with the terms of this Offering Circular and state that I am qualified to invest pursuant to the Offering Circular, and hereby acknowledge such eligibility requirement set forth therein.';

export const investmentByMailInstitutionStateRules = Object.freeze({
  AL: Object.freeze({ eligibility: 'limited' }),
  AK: Object.freeze({ eligibility: 'standard' }),
  AZ: Object.freeze({ eligibility: 'limited' }),
  AR: Object.freeze({ eligibility: 'limited' }),
  CA: Object.freeze({ eligibility: 'limited' }),
  CO: Object.freeze({ eligibility: 'standard' }),
  CT: Object.freeze({ eligibility: 'standard' }),
  DE: Object.freeze({ eligibility: 'standard' }),
  DC: Object.freeze({ eligibility: 'standard' }),
  FL: Object.freeze({ eligibility: 'standard' }),
  GA: Object.freeze({ eligibility: 'limited' }),
  HI: Object.freeze({ eligibility: 'standard' }),
  ID: Object.freeze({ eligibility: 'limited' }),
  IL: Object.freeze({ eligibility: 'standard' }),
  IN: Object.freeze({ eligibility: 'limited' }),
  IA: Object.freeze({ eligibility: 'limited' }),
  KS: Object.freeze({ eligibility: 'limited' }),
  KY: Object.freeze({ eligibility: 'limited' }),
  LA: Object.freeze({ eligibility: 'standard' }),
  ME: Object.freeze({ eligibility: 'standard' }),
  MD: Object.freeze({ eligibility: 'standard' }),
  MA: Object.freeze({ eligibility: 'standard' }),
  MI: Object.freeze({ eligibility: 'limited' }),
  MN: Object.freeze({ eligibility: 'standard' }),
  MS: Object.freeze({ eligibility: 'standard' }),
  MO: Object.freeze({ eligibility: 'limited' }),
  MT: Object.freeze({ eligibility: 'standard' }),
  NE: Object.freeze({ eligibility: 'limited' }),
  NV: Object.freeze({ eligibility: 'limited' }),
  NH: Object.freeze({ eligibility: 'standard' }),
  NJ: Object.freeze({ eligibility: 'standard' }),
  NM: Object.freeze({ eligibility: 'standard' }),
  NY: Object.freeze({ eligibility: 'standard' }),
  NC: Object.freeze({ eligibility: 'limited' }),
  ND: Object.freeze({ eligibility: 'limited' }),
  OH: Object.freeze({
    eligibility: 'blocked',
    blockMessage: 'This offering is currently not available for Ohio residents.',
  }),
  OK: Object.freeze({ eligibility: 'limited' }),
  OR: Object.freeze({ eligibility: 'standard' }),
  PA: Object.freeze({ eligibility: 'limited' }),
  RI: Object.freeze({ eligibility: 'standard' }),
  SC: Object.freeze({ eligibility: 'standard' }),
  SD: Object.freeze({ eligibility: 'limited' }),
  TN: Object.freeze({ eligibility: 'limited' }),
  TX: Object.freeze({ eligibility: 'standard' }),
  UT: Object.freeze({ eligibility: 'standard' }),
  VT: Object.freeze({ eligibility: 'standard' }),
  VA: Object.freeze({ eligibility: 'limited' }),
  WA: Object.freeze({
    eligibility: 'limited',
    requiresExistingInvestorAnswer: true,
    newInvestorBlockMessage: 'AGFinancial investments are not available to new investors in Washington.',
  }),
  WV: Object.freeze({ eligibility: 'standard' }),
  WI: Object.freeze({ eligibility: 'limited' }),
  WY: Object.freeze({ eligibility: 'limited' }),
});

export function getInvestmentByMailInstitutionStateRule(stateCode) {
  const code = String(stateCode || '').trim().toUpperCase();
  return investmentByMailInstitutionStateRules[code] || Object.freeze({ eligibility: 'standard' });
}
