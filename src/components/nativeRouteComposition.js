function firstNameFromDisplayName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts[0] || 'our team';
}

export function composeRetirement403bSections({ pathname, baseContent, dynamicSections }) {
  const sections = Array.isArray(baseContent?.sections) ? baseContent.sections : null;
  const runtimeSections = Array.isArray(dynamicSections) ? dynamicSections : [];

  if (pathname !== '/services/retirement/403b' || !sections) {
    return {
      nextBaseContent: baseContent,
      remainingDynamicSections: runtimeSections,
    };
  }

  const findDynamicSection = (blockId) => runtimeSections.find((section) => section?.blockId === blockId) || null;
  const findBaseSection = (matcher) => sections.find((section) => matcher(String(section?.className || '').trim(), section)) || null;

  const benefitsCopySection = null;
  const benefitsCardsSection = findDynamicSection('benefits_cards')
    || findBaseSection((className) => className.includes('retirement-403b-native-benefits-cards'));
  const benefitsCalloutSection = findDynamicSection('benefits_callout')
    || findBaseSection((className) => className.includes('retirement-403b-native-benefits-callout'));
  const qualifyGridSection = findDynamicSection('who_qualifies')
    || findBaseSection((className) => className.includes('retirement-child-native-qualify'));
  const strategyBillboardSection = findDynamicSection('investment_strategy_heading');
  const strategyGridSection = findDynamicSection('investment_strategy_options')
    || findBaseSection((className) => className.includes('retirement-child-native-strategies'));
  const strategyEnrollCtaSection = findDynamicSection('strategy_enroll_cta')
    || findBaseSection((className) => className.includes('retirement-403b-native-strategy-enroll-cta'));
  const loansSection = findDynamicSection('page_content');
  const loanApplySection = findDynamicSection('loan_apply');
  const startEnrollmentSection = findDynamicSection('start_enrollment')
    || findBaseSection((className) => className.includes('retirement-child-native-enroll'));
  const rateTableSection = findDynamicSection('rate_table')
    || findBaseSection((className) => className.includes('retirement-403b-native-rate-table'));
  const contributionLimitsSection = findDynamicSection('contribution_limits')
    || findBaseSection((className) => className.includes('retirement-child-native-table'));
  const rolloverBillboardSection = findDynamicSection('rollover_billboard')
    || findBaseSection((className) => className.includes('retirement-child-native-rollover'));
  const housingFeatureSection = findDynamicSection('housing_feature')
    || findBaseSection((className) => className.includes('retirement-403b-native-housing'));

  const orderedSections = [
    benefitsCopySection,
    benefitsCardsSection,
    benefitsCalloutSection,
    qualifyGridSection,
    strategyBillboardSection,
    strategyGridSection,
    strategyEnrollCtaSection,
    loansSection,
    loanApplySection,
    startEnrollmentSection,
    rateTableSection,
    contributionLimitsSection,
    rolloverBillboardSection,
    housingFeatureSection,
  ].filter(Boolean);

  if (!orderedSections.length) {
    return {
      nextBaseContent: baseContent,
      remainingDynamicSections: runtimeSections,
    };
  }

  const injectedBlockIds = new Set(
    orderedSections
      .map((section) => String(section?.blockId || '').trim())
      .filter(Boolean),
  );
  const managedBaseSections = new Set(orderedSections.filter((section) => !section?.blockId));
  const trailingBaseSections = sections.filter((section) => {
    if (managedBaseSections.has(section)) {
      return false;
    }
    const className = String(section?.className || '').trim();
    if (className.includes('retirement-403b-native-benefits-copy')) {
      return false;
    }
    if (className.includes('retirement-403b-native-quickcheck')) {
      return false;
    }
    if (findDynamicSection('benefits_cards') && className.includes('retirement-403b-native-benefits-cards')) {
      return false;
    }
    if (findDynamicSection('benefits_callout') && className.includes('retirement-403b-native-benefits-callout')) {
      return false;
    }
    if (findDynamicSection('who_qualifies') && className.includes('retirement-child-native-qualify')) {
      return false;
    }
    if ((findDynamicSection('investment_strategy_heading') || findDynamicSection('investment_strategy_options')) && className.includes('retirement-child-native-strategies')) {
      return false;
    }
    if (findDynamicSection('strategy_enroll_cta') && className.includes('retirement-403b-native-strategy-enroll-cta')) {
      return false;
    }
    if (findDynamicSection('start_enrollment') && className.includes('retirement-child-native-enroll')) {
      return false;
    }
    if (findDynamicSection('rate_table') && className.includes('retirement-403b-native-rate-table')) {
      return false;
    }
    if (findDynamicSection('contribution_limits') && className.includes('retirement-child-native-table')) {
      return false;
    }
    if (findDynamicSection('rollover_billboard') && className.includes('retirement-child-native-rollover')) {
      return false;
    }
    if (findDynamicSection('housing_feature') && className.includes('retirement-403b-native-housing')) {
      return false;
    }
    return true;
  });

  return {
    nextBaseContent: {
      ...baseContent,
      sections: [...orderedSections, ...trailingBaseSections],
    },
    remainingDynamicSections: runtimeSections.filter((section) => !injectedBlockIds.has(String(section?.blockId || '').trim())),
  };
}

function resolveConsultantService(pathname) {
  if (pathname === '/services/loans/loan-consultants') {
    return 'loans';
  }
  if (pathname === '/services/retirement/retirement-consultants') {
    return 'retirement';
  }
  return null;
}

export function buildConsultantCards({ consultantService, pagePath, getConsultants }) {
  if (!consultantService || typeof getConsultants !== 'function') {
    return [];
  }

  const consultants = getConsultants(consultantService);
  const inquiryLabel = consultantService === 'loans' ? 'Loan consultant inquiry' : 'Retirement consultant inquiry';

  return consultants.map((item) => {
    const name = String(item.name || '').trim();
    const credentials = String(item.credentials || '').trim();
    const phone = String(item.phone || '').trim();
    const digits = phone.replace(/\D/g, '');

    return {
      title: name || 'Consultant',
      titleSuffix: credentials,
      subtitle: String(item.region || '').trim(),
      phone,
      phoneHref: digits ? `tel:${digits}` : undefined,
      messagePanel: true,
      messageCta: `Message ${firstNameFromDisplayName(name)}`,
      consultantEmail: String(item.email || '').trim(),
      states: Array.isArray(item.states) ? item.states : [],
      service: consultantService,
      pagePath,
      inquiryLabel,
    };
  });
}

export function composeConsultantSections({ pathname, pagePath, sections, getConsultants }) {
  const consultantService = resolveConsultantService(pathname);
  const nextSections = Array.isArray(sections) ? sections : [];

  if (!consultantService || typeof getConsultants !== 'function' || !nextSections.length) {
    return nextSections;
  }

  const cards = buildConsultantCards({
    consultantService,
    pagePath: pagePath || pathname,
    getConsultants,
  });

  return nextSections.map((section) => {
    if (section.className !== 'loans-consultant-native-locations') {
      return section;
    }
    return {
      ...section,
      cards,
    };
  });
}
