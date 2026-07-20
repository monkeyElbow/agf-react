function firstNameFromDisplayName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts[0] || 'our team';
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
