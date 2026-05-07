import { useMemo, useState } from 'react';

/**
 * AGF-style charitable giving comparison matrix
 * - Program names across top
 * - Features down left
 * - Sticky header + sticky first column
 * - Mobile program selector (choose 2-3)
 * - Data-driven structure
 */

const AGF_COLORS = {
  teal: 'var(--ag-color-atlantean)',
  slate: 'var(--ag-color-super-grey)',
  gold: 'var(--ag-color-mango)',
  border: 'rgba(65, 64, 66, 0.18)',
  muted: '#6b7280',
  bg: '#ffffff',
  soft: '#f8fafc',
};

export const givingComparisonPrograms = [
  {
    id: 'daf',
    name: 'Donor Advised Fund',
    shortLabel: 'DAF',
    fundedBy: 'Cash, stocks, bonds, or property',
    minimumRequired: '$10K cash or securities, $100K real estate',
    donorBenefits: 'Tax benefit',
    ministryBenefits: 'Flexible grant support over time',
    taxBenefits: 'Full income tax deduction; savings on capital gains tax',
    donorIncome: 'No',
    propertyAllowed: 'Yes',
    timing: 'Flexible / ongoing',
    ctaLabel: 'Talk to a Consultant',
    ctaHref: '/contact-us',
  },
  {
    id: 'endowment',
    name: 'Endowment',
    shortLabel: 'Endowment',
    fundedBy: 'Cash, stocks, bonds, or property',
    minimumRequired: '$10K cash or securities, $100K real estate',
    donorBenefits: 'Tax benefit',
    ministryBenefits: 'Long-term ministry support',
    taxBenefits: 'Full income tax deduction; savings on capital gains tax',
    donorIncome: 'No',
    propertyAllowed: 'Yes',
    timing: 'Long-term impact',
    ctaLabel: 'Talk to a Consultant',
    ctaHref: '/contact-us',
  },
  {
    id: 'cga',
    name: 'Charitable Gift Annuity',
    shortLabel: 'CGA',
    fundedBy: 'Cash, stocks or bonds',
    minimumRequired: '$10K',
    donorBenefits: 'Annuity payments for life',
    ministryBenefits: 'Remainder supports ministry after beneficiary death',
    taxBenefits: 'Partial income tax deduction; partial tax-free payment',
    donorIncome: 'Yes',
    propertyAllowed: 'No',
    timing: 'Income now; ministry later',
    ctaLabel: 'Learn More',
    ctaHref: '/services/legacy-giving/charitable-gift-annuities',
  },
  {
    id: 'crt',
    name: 'Charitable Remainder Trust',
    shortLabel: 'CRT',
    fundedBy: 'Cash or appreciated property, stocks or bonds',
    minimumRequired: '$50K cash or securities, $100K real estate',
    donorBenefits: 'Unitrust payment to donor or others',
    ministryBenefits: 'After death of donor or trust termination',
    taxBenefits: 'Partial income tax deduction; savings on capital gains tax',
    donorIncome: 'Yes',
    propertyAllowed: 'Yes',
    timing: 'Income now; ministry later',
    ctaLabel: 'Talk to a Consultant',
    ctaHref: '/services/legacy-giving/charitable-trusts#crt',
  },
  {
    id: 'dcga',
    name: 'Deferred Charitable Gift Annuity',
    shortLabel: 'Deferred CGA',
    fundedBy: 'Cash, stocks or bonds',
    minimumRequired: '$10K',
    donorBenefits: 'Annuity payments begin later, then continue for life',
    ministryBenefits: 'Remainder supports ministry after beneficiary death',
    taxBenefits: 'Partial income tax deduction; partial tax-free payment',
    donorIncome: 'Yes (deferred)',
    propertyAllowed: 'No',
    timing: 'Income later; ministry later',
    ctaLabel: 'Learn More',
    ctaHref: '/services/legacy-giving/charitable-gift-annuities',
  },
  {
    id: 'crat',
    name: 'Charitable Remainder Annuity Trust',
    shortLabel: 'CRAT',
    fundedBy: 'Cash or appreciated stocks or bonds',
    minimumRequired: '$50K cash or securities',
    donorBenefits: 'Fixed annuity payment to donor or others',
    ministryBenefits: 'After death of donor',
    taxBenefits: 'Partial income tax deduction; minimal capital gains tax savings',
    donorIncome: 'Yes',
    propertyAllowed: 'Limited',
    timing: 'Income now; ministry later',
    ctaLabel: 'Talk to a Consultant',
    ctaHref: '/services/legacy-giving/charitable-trusts#crt',
  },
  {
    id: 'clt',
    name: 'Charitable Lead Trust',
    shortLabel: 'CLT',
    fundedBy: 'Cash, property, or income-producing securities',
    minimumRequired: '$50K cash or securities, $100K real estate',
    donorBenefits: 'After a stated term, principal returns to donor or others',
    ministryBenefits: 'Immediate annuity or unitrust payments for stated term',
    taxBenefits: 'Partial income tax deduction; savings on capital gains tax',
    donorIncome: 'No (different structure)',
    propertyAllowed: 'Yes',
    timing: 'Ministry now; principal later',
    ctaLabel: 'Talk to a Consultant',
    ctaHref: '/services/legacy-giving/charitable-trusts#clt',
  },
];

export const givingComparisonFeatureRows = [
  { key: 'fundedBy', label: 'How it’s Funded' },
  { key: 'minimumRequired', label: 'Minimum to Start' },
  { key: 'donorIncome', label: 'Provides Donor Income?' },
  { key: 'donorBenefits', label: 'What the Donor Receives' },
  { key: 'ministryBenefits', label: 'How the Ministry Benefits' },
  { key: 'taxBenefits', label: 'Possible Tax Considerations' },
  { key: 'propertyAllowed', label: 'Property Allowed?' },
  { key: 'timing', label: 'Timing' },
];

export const givingComparisonMobileRows = [
  ...givingComparisonFeatureRows,
  { key: 'cta', label: 'CTA' },
];

function parseMinimumNumber(text) {
  if (!text) return Number.MAX_SAFE_INTEGER;
  const match = text.match(/\$?\s*([0-9]+)\s*K/i);
  if (match) return Number(match[1]) * 1000;
  const numMatch = text.replace(/,/g, '').match(/\$?\s*([0-9]+)/);
  if (numMatch) return Number(numMatch[1]);
  return Number.MAX_SAFE_INTEGER;
}

export default function GivingComparisonMatrix() {
  const [incomeOnly, setIncomeOnly] = useState(false);
  const [propertyOnly, setPropertyOnly] = useState(false);
  const [maxMinimum, setMaxMinimum] = useState('all');

  const [mobileSelectedIds, setMobileSelectedIds] = useState(['cga', 'daf', 'endowment']);

  const filteredPrograms = useMemo(() => (
    givingComparisonPrograms.filter((p) => {
      if (incomeOnly && !String(p.donorIncome).toLowerCase().includes('yes')) return false;
      if (propertyOnly && !String(p.propertyAllowed).toLowerCase().includes('yes')) return false;

      if (maxMinimum !== 'all') {
        const max = Number(maxMinimum);
        if (parseMinimumNumber(p.minimumRequired) > max) return false;
      }

      return true;
    })
  ), [incomeOnly, propertyOnly, maxMinimum]);

  const visibleProgramsDesktop = filteredPrograms;

  const visibleProgramsMobile = useMemo(() => {
    const selected = filteredPrograms.filter((p) => mobileSelectedIds.includes(p.id));
    if (selected.length > 0) return selected.slice(0, 3);
    return filteredPrograms.slice(0, 3);
  }, [filteredPrograms, mobileSelectedIds]);

  const toggleMobileProgram = (id) => {
    setMobileSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const renderMobileFieldValue = (program, row) => {
    if (row.key === 'cta') {
      return (
        <a href={program.ctaHref} style={styles.mobileFieldCta}>
          {program.ctaLabel}
        </a>
      );
    }

    return program[row.key];
  };

  return (
    <section className="giving-comparison-matrix" style={styles.section}>
      <div style={styles.headerWrap}>
        <h2 style={styles.heading}>
          Which <span style={{ color: AGF_COLORS.teal }}>Charitable Giving</span> plan is right for you?
        </h2>
        <p style={styles.subheading}>
          Compare programs side by side. Filter first to narrow options, then review the details that matter most.
        </p>
      </div>

      <div style={styles.filtersWrap} aria-label="Comparison filters">
        <label style={styles.filterLabel}>
          <input
            type="checkbox"
            checked={incomeOnly}
            onChange={(e) => setIncomeOnly(e.target.checked)}
          />
          <span>Provides donor income</span>
        </label>

        <label style={styles.filterLabel}>
          <input
            type="checkbox"
            checked={propertyOnly}
            onChange={(e) => setPropertyOnly(e.target.checked)}
          />
          <span>Can be funded with property</span>
        </label>

        <label style={styles.filterLabelStack}>
          <span style={styles.filterCaption}>Max minimum to start</span>
          <select
            value={maxMinimum}
            onChange={(e) => setMaxMinimum(e.target.value)}
            style={styles.select}
          >
            <option value="all">All minimums</option>
            <option value="10000">$10K and under</option>
            <option value="50000">$50K and under</option>
            <option value="100000">$100K and under</option>
          </select>
        </label>
      </div>

      <div style={styles.resultCount}>
        Showing {filteredPrograms.length} of {givingComparisonPrograms.length} programs
      </div>

      <div className="agf-hide-mobile">
        <div style={styles.matrixOuter}>
          <div style={styles.matrixScroll}>
            <table style={styles.table} role="table" aria-label="Charitable giving plan comparison">
              <thead>
                <tr>
                  <th style={{ ...styles.th, ...styles.stickyCol, ...styles.featureHeaderCell }}>
                    Compare Features
                  </th>
                  {visibleProgramsDesktop.map((program) => (
                    <th key={program.id} style={styles.thProgram}>
                      <div style={styles.programHeaderCard}>
                        <div style={styles.programTitle}>{program.name}</div>
                        <div style={styles.programSubtitle}>{program.shortLabel}</div>
                        <a href={program.ctaHref} style={styles.headerCta}>
                          {program.ctaLabel}
                        </a>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {givingComparisonFeatureRows.map((row, idx) => (
                  <tr key={row.key}>
                    <th
                      scope="row"
                      style={{
                        ...styles.rowLabel,
                        ...styles.stickyCol,
                        background: idx % 2 === 0 ? '#fff' : '#fbfbfb',
                      }}
                    >
                      {row.label}
                    </th>

                    {visibleProgramsDesktop.map((program, colIdx) => (
                      <td
                        key={`${program.id}-${row.key}`}
                        style={{
                          ...styles.td,
                          background: idx % 2 === 0 ? '#fff' : '#fbfbfb',
                          borderRight:
                            colIdx === visibleProgramsDesktop.length - 1
                              ? `1px solid ${AGF_COLORS.border}`
                              : undefined,
                        }}
                      >
                        {program[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}

                <tr>
                  <th
                    scope="row"
                    style={{
                      ...styles.rowLabel,
                      ...styles.stickyCol,
                      background: '#fff',
                      borderBottomLeftRadius: 10,
                    }}
                  >
                    Next Step
                  </th>
                  {visibleProgramsDesktop.map((program, idx) => (
                    <td
                      key={`${program.id}-cta`}
                      style={{
                        ...styles.td,
                        textAlign: 'center',
                        background: '#fff',
                        borderRight:
                          idx === visibleProgramsDesktop.length - 1
                            ? `1px solid ${AGF_COLORS.border}`
                            : undefined,
                        borderBottom: `1px solid ${AGF_COLORS.border}`,
                      }}
                    >
                      <a href={program.ctaHref} style={styles.ctaButton}>
                        {program.ctaLabel}
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="agf-hide-desktop">
        <div style={styles.mobileCard}>
          <div style={{ marginBottom: 10, fontWeight: 700, color: AGF_COLORS.slate }}>
            Mobile compare (select 2 or 3)
          </div>

          <div style={styles.mobileSelectorGrid}>
            {filteredPrograms.map((p) => {
              const selected = mobileSelectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleMobileProgram(p.id)}
                  style={{
                    ...styles.mobileSelectBtn,
                    ...(selected ? styles.mobileSelectBtnActive : {}),
                  }}
                >
                  {p.shortLabel || p.name}
                </button>
              );
            })}
          </div>
        </div>

        {visibleProgramsMobile.length > 0 ? (
          <nav style={styles.mobileJumpNav} aria-label="Mobile comparison sections">
            {givingComparisonMobileRows.map((row) => (
              <a
                key={`mobile-jump-${row.key}`}
                href={`#mobile-comparison-${row.key}`}
                style={styles.mobileJumpChip}
              >
                {row.label}
              </a>
            ))}
          </nav>
        ) : null}

        <div style={styles.mobileSections} aria-label="Mobile charitable giving comparison">
          {givingComparisonMobileRows.map((row) => (
            visibleProgramsMobile.length > 0 ? (
              <section
                key={`mobile-section-${row.key}`}
                id={`mobile-comparison-${row.key}`}
                style={styles.mobileSectionCard}
                aria-labelledby={`mobile-comparison-heading-${row.key}`}
              >
                <div style={styles.mobileSectionHeader}>
                  <h3 id={`mobile-comparison-heading-${row.key}`} style={styles.mobileSectionTitle}>
                    {row.label}
                  </h3>
                </div>
                <div style={styles.mobileAnswerList}>
                  {visibleProgramsMobile.map((program, idx) => (
                    <div
                      key={`${row.key}-${program.id}-mobile-answer`}
                      style={{
                        ...styles.mobileAnswerRow,
                        ...(idx === visibleProgramsMobile.length - 1 ? styles.mobileAnswerRowLast : {}),
                      }}
                    >
                      <div style={styles.mobileAnswerProgram}>{program.name}</div>
                      <div style={styles.mobileAnswerValue}>{renderMobileFieldValue(program, row)}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null
          ))}
          {visibleProgramsMobile.length === 0 ? (
            <div style={styles.mobileEmptyState}>
              No programs match the current filters.
            </div>
          ) : null}
        </div>
      </div>

      <p style={styles.disclaimer}>
        Tax benefits vary by situation. This comparison is for education only and is not tax or legal advice.
        Please consult your tax advisor and speak with AGFinancial for guidance.
      </p>
    </section>
  );
}

const styles = {
  section: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '24px 16px 32px',
    color: AGF_COLORS.slate,
    fontFamily: 'var(--ag-font-body)',
  },
  headerWrap: {
    marginBottom: 16,
  },
  heading: {
    margin: '0 0 10px 0',
    fontSize: 'clamp(1.7rem, 3vw, 2.5rem)',
    lineHeight: 1.15,
    fontWeight: 800,
    fontFamily: 'var(--ag-font-helv)',
    letterSpacing: 'var(--ag-letter-spacing-helv-heading)',
  },
  subheading: {
    margin: 0,
    color: AGF_COLORS.muted,
    maxWidth: 850,
    lineHeight: 1.45,
  },
  filtersWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    margin: '14px 0 10px',
    padding: 12,
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 12,
    background: '#fff',
  },
  filterLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 8,
    background: AGF_COLORS.soft,
    border: `1px solid ${AGF_COLORS.border}`,
    cursor: 'pointer',
    fontSize: 14,
    userSelect: 'none',
  },
  filterLabelStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 180,
  },
  filterCaption: {
    fontSize: 12,
    color: AGF_COLORS.muted,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  select: {
    padding: '8px 10px',
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 8,
    fontSize: 14,
    background: '#fff',
  },
  resultCount: {
    fontSize: 14,
    color: AGF_COLORS.muted,
    marginBottom: 10,
  },
  matrixOuter: {
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
  },
  matrixScroll: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%',
    minWidth: 950,
    borderCollapse: 'separate',
    borderSpacing: 0,
    tableLayout: 'fixed',
  },
  th: {
    position: 'sticky',
    top: 0,
    zIndex: 4,
    background: '#fff',
    textAlign: 'left',
    padding: 12,
    borderBottom: `1px solid ${AGF_COLORS.border}`,
    borderRight: `1px solid ${AGF_COLORS.border}`,
    verticalAlign: 'top',
  },
  featureHeaderCell: {
    minWidth: 220,
    width: 220,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  thProgram: {
    position: 'sticky',
    top: 0,
    zIndex: 3,
    background: '#fff',
    padding: 10,
    borderBottom: `1px solid ${AGF_COLORS.border}`,
    borderRight: `1px solid ${AGF_COLORS.border}`,
    verticalAlign: 'top',
    minWidth: 250,
    width: 250,
  },
  thProgramMobile: {
    position: 'sticky',
    top: 0,
    zIndex: 3,
    background: '#fff',
    padding: 8,
    borderBottom: `1px solid ${AGF_COLORS.border}`,
    borderRight: `1px solid ${AGF_COLORS.border}`,
    verticalAlign: 'top',
    minWidth: 220,
    width: 220,
  },
  stickyCol: {
    position: 'sticky',
    left: 0,
    zIndex: 5,
    borderRight: `1px solid ${AGF_COLORS.border}`,
    boxShadow: '6px 0 8px -8px rgba(0,0,0,0.12)',
  },
  programHeaderCard: {
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 10,
    padding: 10,
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fcfd 100%)',
  },
  programTitle: {
    fontWeight: 800,
    color: AGF_COLORS.slate,
    lineHeight: 1.2,
    marginBottom: 4,
    fontSize: 14,
  },
  programSubtitle: {
    color: AGF_COLORS.teal,
    fontWeight: 700,
    fontSize: 12,
    marginBottom: 8,
  },
  headerCta: {
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 700,
    color: AGF_COLORS.teal,
    textDecoration: 'none',
    border: '1px solid rgba(0,173,187,.25)',
    padding: '6px 8px',
    borderRadius: 999,
    background: 'rgba(0,173,187,.06)',
  },
  rowLabel: {
    textAlign: 'left',
    verticalAlign: 'top',
    padding: '12px 12px',
    fontWeight: 700,
    color: AGF_COLORS.slate,
    width: 220,
    minWidth: 220,
    borderBottom: `1px solid ${AGF_COLORS.border}`,
  },
  td: {
    verticalAlign: 'top',
    padding: '12px 12px',
    lineHeight: 1.35,
    color: '#1f2937',
    borderBottom: `1px solid ${AGF_COLORS.border}`,
    borderRight: `1px solid ${AGF_COLORS.border}`,
    fontSize: 14,
  },
  ctaButton: {
    display: 'inline-block',
    textDecoration: 'none',
    background: AGF_COLORS.teal,
    color: '#fff',
    fontWeight: 700,
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 13,
  },
  disclaimer: {
    marginTop: 12,
    color: AGF_COLORS.muted,
    fontSize: 13,
    lineHeight: 1.4,
  },
  mobileCard: {
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 12,
    background: '#fff',
    padding: 12,
    marginBottom: 10,
  },
  mobileSelectorGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  mobileSelectBtn: {
    border: `1px solid ${AGF_COLORS.border}`,
    background: '#fff',
    color: AGF_COLORS.slate,
    borderRadius: 999,
    padding: '8px 10px',
    fontSize: 13,
    cursor: 'pointer',
  },
  mobileSelectBtnActive: {
    border: `1px solid ${AGF_COLORS.teal}`,
    background: 'rgba(0,173,187,.08)',
    color: AGF_COLORS.teal,
    fontWeight: 700,
  },
  mobileJumpNav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  mobileJumpChip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 10px',
    borderRadius: 999,
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,
    color: AGF_COLORS.teal,
    background: 'rgba(0,173,187,.08)',
    border: '1px solid rgba(0,173,187,.18)',
  },
  mobileSections: {
    display: 'grid',
    gap: 12,
  },
  mobileSectionCard: {
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 14px 32px rgba(17, 53, 75, 0.06)',
  },
  mobileSectionHeader: {
    padding: '14px 14px 10px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f7fbfc 100%)',
    borderBottom: `1px solid ${AGF_COLORS.border}`,
  },
  mobileSectionTitle: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.15,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  mobileAnswerList: {
    display: 'grid',
  },
  mobileAnswerRow: {
    display: 'grid',
    gap: 6,
    padding: '12px 14px',
    borderBottom: `1px solid ${AGF_COLORS.border}`,
  },
  mobileAnswerRowLast: {
    borderBottom: 'none',
  },
  mobileAnswerProgram: {
    fontSize: 12,
    lineHeight: 1.25,
    fontWeight: 800,
    color: AGF_COLORS.teal,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  mobileAnswerValue: {
    fontSize: 14,
    lineHeight: 1.45,
    color: '#1f2937',
  },
  mobileFieldCta: {
    display: 'inline-block',
    textDecoration: 'none',
    background: AGF_COLORS.teal,
    color: '#fff',
    fontWeight: 700,
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
  },
  mobileEmptyState: {
    border: `1px dashed ${AGF_COLORS.border}`,
    borderRadius: 14,
    background: '#fff',
    padding: '18px 14px',
    color: AGF_COLORS.muted,
    textAlign: 'center',
    fontSize: 14,
  },
};
