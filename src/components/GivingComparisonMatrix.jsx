import { useMemo, useState } from 'react';

/**
 * AGF-style charitable giving comparison matrix
 * - Program names across top
 * - Features down left
 * - Sticky header + sticky first column
 * - Desktop + mobile program selectors
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
    ctaHref: '/services/planned-giving/charitable-gift-annuities',
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
    ctaHref: '/services/planned-giving/charitable-trusts#crt',
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
    ctaHref: '/services/planned-giving/charitable-gift-annuities',
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
    ctaHref: '/services/planned-giving/charitable-trusts#crt',
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
    ctaHref: '/services/planned-giving/charitable-trusts#clt',
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

export const defaultGivingComparisonSelectedIds = ['daf', 'endowment', 'cga'];

const MOBILE_PRIMARY_FIELDS = [
  { key: 'minimumRequired', label: 'Minimum to Start' },
  { key: 'donorIncome', label: 'Provides Donor Income?' },
  { key: 'propertyAllowed', label: 'Property Allowed?' },
  { key: 'donorBenefits', label: 'What the Donor Receives' },
];

const MOBILE_SECONDARY_FIELDS = [
  { key: 'fundedBy', label: 'How it’s Funded' },
  { key: 'ministryBenefits', label: 'How the Ministry Benefits' },
  { key: 'taxBenefits', label: 'Possible Tax Considerations' },
  { key: 'timing', label: 'Timing' },
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
  const [desktopSelectedIds, setDesktopSelectedIds] = useState(defaultGivingComparisonSelectedIds);
  const [mobileSelectedIds, setMobileSelectedIds] = useState(defaultGivingComparisonSelectedIds);
  const [desktopShowAll, setDesktopShowAll] = useState(false);
  const [mobileShowFullComparison, setMobileShowFullComparison] = useState(false);

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

  const selectedProgramsDesktop = useMemo(() => (
    filteredPrograms.filter((program) => desktopSelectedIds.includes(program.id))
  ), [desktopSelectedIds, filteredPrograms]);

  const selectedProgramsMobile = useMemo(() => (
    filteredPrograms.filter((program) => mobileSelectedIds.includes(program.id))
  ), [filteredPrograms, mobileSelectedIds]);

  const visibleProgramsDesktop = desktopShowAll ? filteredPrograms : selectedProgramsDesktop;
  const visibleProgramsMobile = selectedProgramsMobile;
  const availableProgramsDesktop = filteredPrograms.filter((program) => !desktopSelectedIds.includes(program.id));
  const availableProgramsMobile = filteredPrograms.filter((program) => !mobileSelectedIds.includes(program.id));
  const compareAllLabel = filteredPrograms.length === givingComparisonPrograms.length
    ? `Compare all ${givingComparisonPrograms.length}`
    : `View all ${filteredPrograms.length} matching`;

  const toggleMobileProgram = (id) => {
    setMobileSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const toggleDesktopProgram = (id) => {
    setDesktopSelectedIds((prev) => (
      prev.includes(id)
        ? prev.filter((programId) => programId !== id)
        : [...prev, id]
    ));
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
        <div style={styles.resultCountTitle}>
          {desktopShowAll
            ? `Viewing all ${visibleProgramsDesktop.length} matching programs`
            : `Comparing ${visibleProgramsDesktop.length} of ${givingComparisonPrograms.length} programs`}
        </div>
        <div style={styles.resultCountMeta}>
          {filteredPrograms.length} programs match the current filters.
        </div>
      </div>

      <div className="agf-hide-mobile">
        <div style={styles.desktopSelectorCard}>
          <div style={styles.selectorCardHeader}>
            <div style={styles.desktopSelectorIntro}>
              <div style={styles.desktopSelectorEyebrow}>Compare selected plans</div>
              <div style={styles.desktopSelectorTitle}>Choose the programs you want to compare first.</div>
              <p style={styles.desktopSelectorHint}>
                Start with a smaller set to review side by side. You can add more programs anytime or switch to a full comparison.
              </p>
            </div>
            <button
              type="button"
              style={styles.desktopToggleBtn}
              onClick={() => setDesktopShowAll((current) => !current)}
            >
              {desktopShowAll ? 'Return to selected' : compareAllLabel}
            </button>
          </div>

          <div style={styles.selectorSection}>
            <div style={styles.selectorSectionTitle}>Selected plans</div>
            <p style={styles.desktopSelectorHint}>
              {selectedProgramsDesktop.length > 0
                ? `${selectedProgramsDesktop.length} selected`
                : 'Select one or more programs to compare.'}
            </p>
            <div
              style={styles.desktopSelectorGrid}
              role="group"
              aria-label="Selected programs to compare"
            >
              {selectedProgramsDesktop.map((program) => (
                <button
                  key={program.id}
                  type="button"
                  aria-pressed="true"
                  onClick={() => toggleDesktopProgram(program.id)}
                  style={{
                    ...styles.desktopSelectBtn,
                    ...styles.desktopSelectBtnActive,
                  }}
                >
                  <span>{program.name}</span>
                  <span style={styles.desktopChipDismiss} aria-hidden="true">×</span>
                </button>
              ))}
              {selectedProgramsDesktop.length === 0 ? (
                <div style={styles.selectorEmptyText}>No selected plans match the current filters.</div>
              ) : null}
            </div>
          </div>

          <div style={styles.selectorSection}>
            <div style={styles.selectorSectionTitle}>Add a plan</div>
            <div
              style={styles.desktopSelectorGrid}
              role="group"
              aria-label="Available programs to add to comparison"
            >
              {availableProgramsDesktop.map((program) => (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => toggleDesktopProgram(program.id)}
                  aria-pressed="false"
                  style={styles.desktopSelectBtn}
                >
                  {program.name}
                </button>
              ))}
              {availableProgramsDesktop.length === 0 ? (
                <div style={styles.selectorEmptyText}>All matching programs are already in view.</div>
              ) : null}
            </div>
          </div>
        </div>

        {visibleProgramsDesktop.length > 0 ? (
          <div style={styles.matrixOuter}>
            <div style={styles.matrixScroll}>
              <table
                style={{
                  ...styles.table,
                  minWidth: desktopShowAll
                    ? 1760
                    : Math.max(900, 220 + (visibleProgramsDesktop.length * 228)),
                }}
                role="table"
                aria-label="Charitable giving plan comparison"
              >
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
        ) : (
          <div style={styles.desktopEmptyState}>
            {filteredPrograms.length > 0 && !desktopShowAll
              ? 'Select at least one program to compare.'
              : 'No programs match the current filters.'}
          </div>
        )}
      </div>

      <div className="agf-hide-desktop">
        <div style={styles.mobileCard}>
          <div style={styles.mobileSelectorTitle}>Compare selected plans</div>
          <p style={styles.mobileSelectorHint}>
            Review a smaller set of programs first, then open the full feature comparison only if you need it.
          </p>
          <div style={styles.mobileSelectorMeta}>
            Showing {visibleProgramsMobile.length} selected of {filteredPrograms.length} matching programs
          </div>

          <div style={styles.selectorSection}>
            <div style={styles.selectorSectionTitle}>Selected plans</div>
            <div style={styles.mobileSelectorGrid} role="group" aria-label="Selected mobile plans">
              {selectedProgramsMobile.map((program) => (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => toggleMobileProgram(program.id)}
                  aria-pressed="true"
                  style={{
                    ...styles.mobileSelectBtn,
                    ...styles.mobileSelectBtnActive,
                  }}
                >
                  <span>{program.shortLabel || program.name}</span>
                  <span style={styles.desktopChipDismiss} aria-hidden="true">×</span>
                </button>
              ))}
              {selectedProgramsMobile.length === 0 ? (
                <div style={styles.selectorEmptyText}>No selected plans match the current filters.</div>
              ) : null}
            </div>
          </div>

          <div style={styles.selectorSection}>
            <div style={styles.selectorSectionTitle}>Add a plan</div>
            <div style={styles.mobileSelectorGrid} role="group" aria-label="Available mobile plans">
              {availableProgramsMobile.map((program) => (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => toggleMobileProgram(program.id)}
                  aria-pressed="false"
                  style={styles.mobileSelectBtn}
                >
                  {program.shortLabel || program.name}
                </button>
              ))}
              {availableProgramsMobile.length === 0 ? (
                <div style={styles.selectorEmptyText}>All matching programs are already selected.</div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            style={styles.mobileToggleBtn}
            onClick={() => setMobileShowFullComparison((current) => !current)}
          >
            {mobileShowFullComparison ? 'Hide full comparison' : 'View full comparison'}
          </button>
        </div>

        <div style={styles.mobileProgramGrid} aria-label="Mobile charitable giving program cards">
          {visibleProgramsMobile.map((program) => (
            <article key={`${program.id}-mobile-card`} style={styles.mobileProgramCard}>
              <div style={styles.mobileProgramHeader}>
                <div>
                  <h3 style={styles.mobileProgramTitle}>{program.name}</h3>
                  <div style={styles.mobileProgramTag}>{program.shortLabel}</div>
                </div>
              </div>

              <dl style={styles.mobileProgramFacts}>
                {MOBILE_PRIMARY_FIELDS.map((field) => (
                  <div key={`${program.id}-${field.key}`} style={styles.mobileProgramFactRow}>
                    <dt style={styles.mobileProgramFactLabel}>{field.label}</dt>
                    <dd style={styles.mobileProgramFactValue}>{program[field.key]}</dd>
                  </div>
                ))}
              </dl>

              <details style={styles.mobileProgramDetails}>
                <summary style={styles.mobileProgramSummary}>More details</summary>
                <dl style={styles.mobileProgramFacts}>
                  {MOBILE_SECONDARY_FIELDS.map((field) => (
                    <div key={`${program.id}-${field.key}-details`} style={styles.mobileProgramFactRow}>
                      <dt style={styles.mobileProgramFactLabel}>{field.label}</dt>
                      <dd style={styles.mobileProgramFactValue}>{program[field.key]}</dd>
                    </div>
                  ))}
                </dl>
              </details>

              <a href={program.ctaHref} style={styles.mobileProgramCta}>
                {program.ctaLabel}
              </a>
            </article>
          ))}
          {visibleProgramsMobile.length === 0 ? (
            <div style={styles.mobileEmptyState}>
              No programs match the current filters. Adjust your filters or add a different plan to compare.
            </div>
          ) : null}
        </div>

        {mobileShowFullComparison && visibleProgramsMobile.length > 0 ? (
          <>
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

            <div style={styles.mobileSections} aria-label="Mobile charitable giving comparison">
              {givingComparisonMobileRows.map((row) => (
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
              ))}
            </div>
          </>
        ) : null}
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
    display: 'grid',
    gap: 4,
    marginBottom: 12,
  },
  resultCountTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  resultCountMeta: {
    fontSize: 13,
    color: AGF_COLORS.muted,
  },
  desktopSelectorCard: {
    display: 'grid',
    gap: 14,
    marginBottom: 14,
    padding: 16,
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 14px 32px rgba(17, 53, 75, 0.05)',
  },
  selectorCardHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  desktopSelectorIntro: {
    display: 'grid',
    gap: 4,
    maxWidth: 720,
  },
  desktopSelectorEyebrow: {
    fontSize: 12,
    fontWeight: 800,
    color: AGF_COLORS.teal,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  desktopSelectorTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  desktopSelectorHint: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.4,
    color: AGF_COLORS.muted,
  },
  desktopToggleBtn: {
    border: `1px solid rgba(0, 173, 187, 0.24)`,
    borderRadius: 999,
    background: '#fff',
    color: AGF_COLORS.teal,
    fontSize: 13,
    fontWeight: 800,
    padding: '10px 14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  selectorSection: {
    display: 'grid',
    gap: 8,
  },
  selectorSectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: AGF_COLORS.slate,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  desktopSelectorGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  desktopSelectBtn: {
    border: `1px solid ${AGF_COLORS.border}`,
    background: '#fff',
    color: AGF_COLORS.slate,
    borderRadius: 999,
    padding: '9px 12px',
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.3,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  desktopSelectBtnActive: {
    border: `1px solid ${AGF_COLORS.teal}`,
    background: 'rgba(0,173,187,.08)',
    color: AGF_COLORS.teal,
  },
  desktopChipDismiss: {
    fontSize: 15,
    lineHeight: 1,
  },
  selectorEmptyText: {
    fontSize: 13,
    color: AGF_COLORS.muted,
    padding: '8px 2px',
  },
  matrixOuter: {
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 16,
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 14px 32px rgba(17, 53, 75, 0.05)',
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
    borderRadius: 14,
    padding: 12,
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
    borderRadius: 16,
    background: '#fff',
    padding: 14,
    marginBottom: 12,
    boxShadow: '0 14px 32px rgba(17, 53, 75, 0.05)',
  },
  mobileSelectorTitle: {
    marginBottom: 4,
    fontSize: 19,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  mobileSelectorHint: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.45,
    color: AGF_COLORS.muted,
  },
  mobileSelectorMeta: {
    marginTop: 10,
    marginBottom: 12,
    fontSize: 13,
    color: AGF_COLORS.slate,
    fontWeight: 700,
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
    padding: '9px 11px',
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  mobileSelectBtnActive: {
    border: `1px solid ${AGF_COLORS.teal}`,
    background: 'rgba(0,173,187,.08)',
    color: AGF_COLORS.teal,
    fontWeight: 700,
  },
  mobileToggleBtn: {
    marginTop: 6,
    border: `1px solid rgba(0, 173, 187, 0.24)`,
    borderRadius: 999,
    background: '#fff',
    color: AGF_COLORS.teal,
    fontSize: 13,
    fontWeight: 800,
    padding: '10px 14px',
    cursor: 'pointer',
    justifySelf: 'start',
  },
  mobileProgramGrid: {
    display: 'grid',
    gap: 12,
    marginBottom: 12,
  },
  mobileProgramCard: {
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 18,
    background: '#fff',
    padding: 14,
    boxShadow: '0 16px 34px rgba(17, 53, 75, 0.06)',
  },
  mobileProgramHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  mobileProgramTitle: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.05,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  mobileProgramTag: {
    display: 'inline-flex',
    marginTop: 6,
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(0,173,187,.08)',
    color: AGF_COLORS.teal,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  mobileProgramFacts: {
    display: 'grid',
    gap: 10,
    margin: 0,
  },
  mobileProgramFactRow: {
    display: 'grid',
    gap: 4,
    paddingBottom: 10,
    borderBottom: `1px solid ${AGF_COLORS.border}`,
  },
  mobileProgramFactLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: AGF_COLORS.muted,
  },
  mobileProgramFactValue: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.45,
    color: '#1f2937',
  },
  mobileProgramDetails: {
    marginTop: 12,
  },
  mobileProgramSummary: {
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 800,
    color: AGF_COLORS.teal,
  },
  mobileProgramCta: {
    display: 'inline-flex',
    marginTop: 14,
    textDecoration: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
    borderRadius: 10,
    background: AGF_COLORS.teal,
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
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
  desktopEmptyState: {
    border: `1px dashed ${AGF_COLORS.border}`,
    borderRadius: 14,
    background: '#fff',
    padding: '20px 16px',
    color: AGF_COLORS.muted,
    textAlign: 'center',
    fontSize: 14,
  },
};
