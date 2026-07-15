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

  const strategyBillboardSection = runtimeSections.find((section) => section?.blockId === 'investment_strategy_heading') || null;
  const strategyGridSection = runtimeSections.find((section) => section?.blockId === 'investment_strategy_options') || null;
  const qualifyGridSection = runtimeSections.find((section) => section?.blockId === 'who_qualifies') || null;
  const rolloverBillboardSection = runtimeSections.find((section) => section?.blockId === 'rollover_billboard') || null;
  const strategyEnrollCtaSection = strategyGridSection
    ? (
      sections.find(
        (section) => String(section?.className || '').includes('retirement-403b-native-strategy-enroll-cta'),
      ) || null
    )
    : null;
  const strategyInjectedSections = [
    strategyBillboardSection,
    strategyGridSection,
    strategyEnrollCtaSection,
    qualifyGridSection,
  ].filter(Boolean);
  const injectedSections = [
    ...strategyInjectedSections,
    rolloverBillboardSection,
  ].filter(Boolean);

  if (!injectedSections.length) {
    return {
      nextBaseContent: baseContent,
      remainingDynamicSections: runtimeSections,
    };
  }

  const injectedBlockIds = new Set(
    injectedSections
      .map((section) => String(section?.blockId || '').trim())
      .filter(Boolean),
  );
  const trimmedSections = sections.filter((section) => {
    const className = String(section?.className || '');
    if ((strategyBillboardSection || strategyGridSection) && className.includes('retirement-child-native-strategies')) {
      return false;
    }
    if (strategyEnrollCtaSection && className.includes('retirement-403b-native-strategy-enroll-cta')) {
      return false;
    }
    if (qualifyGridSection && className.includes('retirement-child-native-qualify')) {
      return false;
    }
    if (rolloverBillboardSection && className.includes('retirement-child-native-rollover')) {
      return false;
    }
    return true;
  });
  const enrollSectionIndex = trimmedSections.findIndex((section) => String(section?.className || '').includes('retirement-child-native-enroll'));
  const insertIndex = enrollSectionIndex >= 0 ? enrollSectionIndex : trimmedSections.length;

  if (strategyInjectedSections.length) {
    trimmedSections.splice(insertIndex, 0, ...strategyInjectedSections);
  }

  if (rolloverBillboardSection) {
    const originalRolloverIndex = sections.findIndex((section) => String(section?.className || '').includes('retirement-child-native-rollover'));
    const nextOriginalSection = originalRolloverIndex >= 0 ? sections[originalRolloverIndex + 1] : null;
    const nextOriginalClassName = String(nextOriginalSection?.className || '').trim();
    const nextOriginalSectionIndex = nextOriginalClassName
      ? trimmedSections.findIndex((section) => String(section?.className || '').trim() === nextOriginalClassName)
      : -1;
    const previousOriginalSection = originalRolloverIndex > 0 ? sections[originalRolloverIndex - 1] : null;
    const previousOriginalClassName = String(previousOriginalSection?.className || '').trim();
    const previousOriginalSectionIndex = previousOriginalClassName
      ? trimmedSections.findIndex((section) => String(section?.className || '').trim() === previousOriginalClassName)
      : -1;
    const rolloverInsertIndex = nextOriginalSectionIndex >= 0
      ? nextOriginalSectionIndex
      : (previousOriginalSectionIndex >= 0 ? previousOriginalSectionIndex + 1 : trimmedSections.length);
    trimmedSections.splice(rolloverInsertIndex, 0, rolloverBillboardSection);
  }

  return {
    nextBaseContent: {
      ...baseContent,
      sections: trimmedSections,
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

export function composeConsultantSections({ pathname, pagePath, sections, getConsultants }) {
  const consultantService = resolveConsultantService(pathname);
  const nextSections = Array.isArray(sections) ? sections : [];

  if (!consultantService || typeof getConsultants !== 'function' || !nextSections.length) {
    return nextSections;
  }

  const consultants = getConsultants(consultantService);
  const inquiryLabel = consultantService === 'loans' ? 'Loan consultant inquiry' : 'Retirement consultant inquiry';
  const cards = consultants.map((item) => {
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
      pagePath: pagePath || pathname,
      inquiryLabel,
    };
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
