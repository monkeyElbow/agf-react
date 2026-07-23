import { useMemo, useState } from 'react';

const AGF_COLORS = {
  teal: 'var(--ag-color-atlantean)',
  slate: 'var(--ag-color-super-grey)',
  gold: 'var(--ag-color-mango)',
  sand: 'var(--ag-color-sandstone)',
  border: 'rgba(65, 64, 66, 0.16)',
  muted: '#6b7280',
  bg: '#ffffff',
  soft: '#f8fafc',
};

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'Not sure', helper: 'Keep the full set open.' },
  { id: 'individual', label: 'For me / my family', helper: 'Plans for personal giving, income, estate, or tax goals.' },
  { id: 'ministry', label: 'For a church or ministry', helper: 'Plans focused on ministry support and ministry-held funds.' },
];

const GOAL_OPTIONS = [
  { id: 'simple', label: 'Start simple' },
  { id: 'income', label: 'Receive income' },
  { id: 'long-term', label: 'Support ministry long term' },
  { id: 'property', label: 'Give property' },
  { id: 'all', label: 'Compare everything' },
];

export const givingComparisonPrograms = [
  {
    id: 'daf',
    name: 'Donor Advised Fund',
    shortLabel: 'DAF',
    audience: 'both',
    audienceLabel: 'Individual + Ministry',
    goals: ['simple', 'property', 'long-term'],
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
    audience: 'ministry',
    audienceLabel: 'Ministry',
    goals: ['long-term', 'property'],
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
    audience: 'individual',
    audienceLabel: 'Individual',
    goals: ['income', 'simple'],
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
    audience: 'individual',
    audienceLabel: 'Individual',
    goals: ['income', 'property'],
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
    audience: 'individual',
    audienceLabel: 'Individual',
    goals: ['income'],
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
    audience: 'individual',
    audienceLabel: 'Individual',
    goals: ['income'],
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
    audience: 'both',
    audienceLabel: 'Individual + Ministry',
    goals: ['long-term', 'property'],
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
  {
    id: 'mif',
    name: 'Ministry Impact Fund®',
    shortLabel: 'MIF',
    audience: 'ministry',
    audienceLabel: 'Ministry',
    goals: ['simple', 'long-term', 'property'],
    fundedBy: 'Details coming soon',
    minimumRequired: 'Details coming soon',
    donorBenefits: 'Details coming soon',
    ministryBenefits: 'Details coming soon',
    taxBenefits: 'Details coming soon',
    donorIncome: 'Details coming soon',
    propertyAllowed: 'Details coming soon',
    timing: 'Details coming soon',
    ctaLabel: 'Talk to a Consultant',
    ctaHref: '/services/planned-giving/ministry-impact-fund',
    status: 'Details coming soon',
  },
];

export const givingComparisonFeatureRows = [
  { key: 'fundedBy', label: 'How it’s Funded', group: 'Basics' },
  { key: 'minimumRequired', label: 'Minimum to Start', group: 'Basics' },
  { key: 'donorIncome', label: 'Provides Donor Income?', group: 'Basics' },
  { key: 'donorBenefits', label: 'What the Donor Receives', group: 'Details' },
  { key: 'ministryBenefits', label: 'How the Ministry Benefits', group: 'Details' },
  { key: 'taxBenefits', label: 'Possible Tax Considerations', group: 'Details' },
  { key: 'propertyAllowed', label: 'Property Allowed?', group: 'Basics' },
  { key: 'timing', label: 'Timing', group: 'Basics' },
];

const PRIMARY_ROW_KEYS = ['fundedBy', 'minimumRequired', 'donorIncome', 'propertyAllowed'];
export const defaultGivingComparisonSelectedIds = ['daf', 'endowment', 'cga'];

function audienceMatches(program, audience) {
  if (audience === 'all') return true;
  return program.audience === audience || program.audience === 'both';
}

function goalMatches(program, goal) {
  return goal === 'all' || program.goals.includes(goal);
}

function uniquePrograms(programs) {
  const seen = new Set();
  return programs.filter((program) => {
    if (seen.has(program.id)) return false;
    seen.add(program.id);
    return true;
  });
}

export default function GivingComparisonMatrix() {
  const [audience, setAudience] = useState('all');
  const [goal, setGoal] = useState('simple');
  const [selectedIds, setSelectedIds] = useState(defaultGivingComparisonSelectedIds);
  const [showAllRows, setShowAllRows] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  const filteredPrograms = useMemo(() => (
    givingComparisonPrograms.filter((program) => (
      audienceMatches(program, audience)
      && goalMatches(program, goal)
    ))
  ), [audience, goal]);

  const recommendedPrograms = useMemo(() => {
    const recommended = filteredPrograms.length ? filteredPrograms : givingComparisonPrograms;
    const audienceFillers = givingComparisonPrograms.filter((program) => audienceMatches(program, audience));
    return uniquePrograms([
      ...recommended,
      ...audienceFillers,
      ...givingComparisonPrograms,
    ]).slice(0, 4);
  }, [audience, filteredPrograms]);

  const selectedPrograms = useMemo(() => (
    givingComparisonPrograms.filter((program) => selectedIds.includes(program.id))
  ), [selectedIds]);

  const visiblePrograms = showAllPrograms
    ? givingComparisonPrograms
    : uniquePrograms([
      ...selectedPrograms,
      ...recommendedPrograms.filter((program) => selectedIds.includes(program.id)),
    ]);

  const availablePrograms = givingComparisonPrograms.filter((program) => !selectedIds.includes(program.id));
  const visibleRows = showAllRows
    ? givingComparisonFeatureRows
    : givingComparisonFeatureRows.filter((row) => PRIMARY_ROW_KEYS.includes(row.key));

  const applyRecommendation = () => {
    setSelectedIds(recommendedPrograms.map((program) => program.id));
    setShowAllPrograms(false);
  };

  const toggleProgram = (id) => {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((programId) => programId !== id)
        : [...current, id]
    ));
    setShowAllPrograms(false);
  };

  const selectAudience = (nextAudience) => {
    setAudience(nextAudience);
    setShowAllPrograms(false);
  };

  const selectGoal = (nextGoal) => {
    setGoal(nextGoal);
    setShowAllPrograms(nextGoal === 'all');
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

      <div style={styles.guidePanel} aria-label="Planned giving chooser">
        <div style={styles.choiceGroup}>
          <div style={styles.choiceLabel}>I’m exploring this for</div>
          <div style={styles.audienceGrid}>
            {AUDIENCE_OPTIONS.map((option) => {
              const isActive = audience === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectAudience(option.id)}
                  aria-pressed={isActive}
                  style={{
                    ...styles.audienceCard,
                    ...(isActive ? styles.audienceCardActive : {}),
                  }}
                >
                  <span style={styles.audienceTitle}>{option.label}</span>
                  <span style={styles.audienceHelper}>{option.helper}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.choiceGroup}>
          <div style={styles.choiceLabel}>What matters most?</div>
          <div style={styles.goalGrid} role="group" aria-label="Giving goals">
            {GOAL_OPTIONS.map((option) => {
              const isActive = goal === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectGoal(option.id)}
                  aria-pressed={isActive}
                  style={{
                    ...styles.goalChip,
                    ...(isActive ? styles.goalChipActive : {}),
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={styles.recommendationPanel}>
        <div style={styles.recommendationHeader}>
          <div>
            <div style={styles.sectionEyebrow}>Recommended starting comparison</div>
            <h3 style={styles.recommendationTitle}>Start with a few good options.</h3>
          </div>
          <div style={styles.recommendationActions}>
            <button type="button" style={styles.primaryButton} onClick={applyRecommendation}>
              Compare these
            </button>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setShowAllPrograms((current) => !current)}
            >
              {showAllPrograms ? 'Return to selected' : 'See all plans'}
            </button>
          </div>
        </div>

        <div style={styles.planCardsGrid} aria-label="Recommended giving plans">
          {recommendedPrograms.map((program) => (
            <article key={program.id} style={styles.planCard}>
              <div style={styles.planCardTop}>
                <span style={styles.audienceBadge}>{program.audienceLabel}</span>
                {program.status ? <span style={styles.statusBadge}>{program.status}</span> : null}
              </div>
              <h4 style={styles.planCardTitle}>{program.name}</h4>
              <p style={styles.planCardSummary}>{program.shortLabel}</p>
              <dl style={styles.planCardFacts}>
                <div style={styles.planCardFact}>
                  <dt style={styles.planCardFactLabel}>Minimum to Start</dt>
                  <dd style={styles.planCardFactValue}>{program.minimumRequired}</dd>
                </div>
                <div style={styles.planCardFact}>
                  <dt style={styles.planCardFactLabel}>Provides Donor Income?</dt>
                  <dd style={styles.planCardFactValue}>{program.donorIncome}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => toggleProgram(program.id)}
                aria-pressed={selectedIds.includes(program.id)}
                style={{
                  ...styles.planToggle,
                  ...(selectedIds.includes(program.id) ? styles.planToggleActive : {}),
                }}
              >
                {selectedIds.includes(program.id) ? 'Selected' : 'Add to compare'}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div style={styles.compareToolbar}>
        <div>
          <div style={styles.compareTitle}>
            Comparing {visiblePrograms.length} {visiblePrograms.length === 1 ? 'plan' : 'plans'}
          </div>
          <div style={styles.compareMeta}>
            {showAllPrograms ? 'Showing every available plan.' : 'Showing selected and recommended plans.'}
          </div>
        </div>
        <div style={styles.toolbarActions}>
          <button type="button" style={styles.secondaryButton} onClick={() => setShowAllRows((current) => !current)}>
            {showAllRows ? 'Show fewer details' : 'Show tax details and timing'}
          </button>
        </div>
      </div>

      <div style={styles.selectedRail} aria-label="Selected plans">
        {selectedPrograms.map((program) => (
          <button
            key={`${program.id}-selected`}
            type="button"
            onClick={() => toggleProgram(program.id)}
            aria-pressed="true"
            style={styles.selectedChip}
          >
            <span>{program.name}</span>
            <span aria-hidden="true">×</span>
          </button>
        ))}
        {availablePrograms.map((program) => (
          <button
            key={`${program.id}-available`}
            type="button"
            onClick={() => toggleProgram(program.id)}
            aria-pressed="false"
            style={styles.addChip}
          >
            + {program.shortLabel || program.name}
          </button>
        ))}
      </div>

      {visiblePrograms.length > 0 ? (
        <>
          <div className="agf-hide-mobile">
            <div style={styles.matrixOuter}>
              <div style={styles.matrixScroll}>
                <table
                  style={{
                    ...styles.table,
                    minWidth: Math.max(920, 220 + (visiblePrograms.length * 236)),
                  }}
                  role="table"
                  aria-label="Charitable giving plan comparison"
                >
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, ...styles.stickyCol, ...styles.featureHeaderCell }}>
                        Compare Features
                      </th>
                      {visiblePrograms.map((program) => (
                        <th key={program.id} style={styles.thProgram}>
                          <div style={styles.programHeaderCard}>
                            <div style={styles.programHeaderTop}>
                              <span style={styles.audienceBadge}>{program.audienceLabel}</span>
                              {program.status ? <span style={styles.statusBadge}>{program.status}</span> : null}
                            </div>
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
                    {visibleRows.map((row, idx) => (
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

                        {visiblePrograms.map((program, colIdx) => (
                          <td
                            key={`${program.id}-${row.key}`}
                            style={{
                              ...styles.td,
                              background: idx % 2 === 0 ? '#fff' : '#fbfbfb',
                              borderRight:
                                colIdx === visiblePrograms.length - 1
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
                      {visiblePrograms.map((program, idx) => (
                        <td
                          key={`${program.id}-cta`}
                          style={{
                            ...styles.td,
                            textAlign: 'center',
                            background: '#fff',
                            borderRight:
                              idx === visiblePrograms.length - 1
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
            <div style={styles.mobileProgramGrid} aria-label="Mobile charitable giving program cards">
              {visiblePrograms.map((program) => (
                <article key={`${program.id}-mobile-card`} style={styles.mobileProgramCard}>
                  <div style={styles.mobileProgramHeader}>
                    <div>
                      <div style={styles.programHeaderTop}>
                        <span style={styles.audienceBadge}>{program.audienceLabel}</span>
                        {program.status ? <span style={styles.statusBadge}>{program.status}</span> : null}
                      </div>
                      <h3 style={styles.mobileProgramTitle}>{program.name}</h3>
                      <div style={styles.mobileProgramTag}>{program.shortLabel}</div>
                    </div>
                  </div>

                  <dl style={styles.mobileProgramFacts}>
                    {visibleRows.map((field) => (
                      <div key={`${program.id}-${field.key}`} style={styles.mobileProgramFactRow}>
                        <dt style={styles.mobileProgramFactLabel}>{field.label}</dt>
                        <dd style={styles.mobileProgramFactValue}>{program[field.key]}</dd>
                      </div>
                    ))}
                  </dl>

                  <a href={program.ctaHref} style={styles.mobileProgramCta}>
                    {program.ctaLabel}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={styles.emptyState}>
          No giving plans match that combination yet. Try “Not sure” or “Compare everything.”
        </div>
      )}

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
    padding: 'clamp(1rem, 2.5vw, 1.5rem) 16px 32px',
    color: AGF_COLORS.slate,
    fontFamily: 'var(--ag-font-body)',
  },
  headerWrap: {
    marginBottom: 18,
    textAlign: 'center',
  },
  eyebrow: {
    color: AGF_COLORS.teal,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: '0',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heading: {
    margin: '0 auto 10px',
    maxWidth: 820,
    fontSize: 'clamp(2rem, 4.2vw, 4.1rem)',
    lineHeight: 0.98,
    fontWeight: 800,
    fontFamily: 'var(--ag-font-helv)',
    letterSpacing: 'var(--ag-letter-spacing-helv-heading)',
    textWrap: 'balance',
  },
  subheading: {
    margin: '0 auto',
    color: AGF_COLORS.muted,
    maxWidth: 720,
    lineHeight: 1.45,
    fontSize: 'clamp(1rem, 1.4vw, 1.2rem)',
  },
  guidePanel: {
    display: 'grid',
    gap: 16,
    padding: 'clamp(1rem, 2.2vw, 1.4rem)',
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 18,
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fcfd 100%)',
    boxShadow: '0 18px 42px rgba(17, 53, 75, 0.06)',
  },
  choiceGroup: {
    display: 'grid',
    gap: 10,
  },
  choiceLabel: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: '0',
    textTransform: 'uppercase',
    color: AGF_COLORS.slate,
  },
  audienceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 10,
  },
  audienceCard: {
    display: 'grid',
    gap: 5,
    textAlign: 'left',
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 14,
    background: '#fff',
    color: AGF_COLORS.slate,
    padding: '13px 14px',
    cursor: 'pointer',
  },
  audienceCardActive: {
    border: `1px solid ${AGF_COLORS.teal}`,
    background: 'rgba(0, 173, 187, 0.08)',
    boxShadow: '0 12px 26px rgba(0, 138, 171, 0.1)',
  },
  audienceTitle: {
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  audienceHelper: {
    fontSize: 13,
    lineHeight: 1.35,
    color: AGF_COLORS.muted,
  },
  goalGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
  },
  goalChip: {
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 999,
    background: '#fff',
    color: AGF_COLORS.slate,
    padding: '10px 13px',
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.1,
    cursor: 'pointer',
  },
  goalChipActive: {
    borderColor: AGF_COLORS.gold,
    background: 'rgba(246, 177, 70, 0.17)',
    color: AGF_COLORS.slate,
  },
  recommendationPanel: {
    display: 'grid',
    gap: 14,
    marginTop: 16,
    marginBottom: 14,
    padding: 'clamp(1rem, 2.2vw, 1.35rem)',
    borderRadius: 18,
    background: '#fff',
    border: `1px solid ${AGF_COLORS.border}`,
    boxShadow: '0 16px 38px rgba(17, 53, 75, 0.05)',
  },
  recommendationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionEyebrow: {
    color: AGF_COLORS.teal,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0',
    textTransform: 'uppercase',
  },
  recommendationTitle: {
    margin: '3px 0 0',
    fontSize: 'clamp(1.35rem, 2.2vw, 2rem)',
    lineHeight: 1.05,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  recommendationActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryButton: {
    border: `1px solid ${AGF_COLORS.teal}`,
    borderRadius: 999,
    background: AGF_COLORS.teal,
    color: '#fff',
    fontSize: 14,
    fontWeight: 800,
    padding: '10px 15px',
    cursor: 'pointer',
  },
  secondaryButton: {
    border: `1px solid rgba(0, 173, 187, 0.24)`,
    borderRadius: 999,
    background: '#fff',
    color: AGF_COLORS.teal,
    fontSize: 14,
    fontWeight: 800,
    padding: '10px 14px',
    cursor: 'pointer',
  },
  planCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 11,
  },
  planCard: {
    display: 'grid',
    alignContent: 'start',
    gap: 8,
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 14,
    padding: 14,
    background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
  },
  planCardTop: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  audienceBadge: {
    display: 'inline-flex',
    width: 'fit-content',
    borderRadius: 999,
    background: 'rgba(0,173,187,.08)',
    color: AGF_COLORS.teal,
    border: '1px solid rgba(0,173,187,.18)',
    padding: '5px 8px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0',
    textTransform: 'uppercase',
  },
  statusBadge: {
    display: 'inline-flex',
    width: 'fit-content',
    borderRadius: 999,
    background: 'rgba(246, 177, 70, 0.16)',
    color: '#8a5a00',
    border: '1px solid rgba(246, 177, 70, 0.32)',
    padding: '5px 8px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0',
    textTransform: 'uppercase',
  },
  planCardTitle: {
    margin: 0,
    fontSize: 19,
    lineHeight: 1.05,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  planCardSummary: {
    margin: 0,
    color: AGF_COLORS.teal,
    fontSize: 13,
    fontWeight: 800,
  },
  planCardFacts: {
    display: 'grid',
    gap: 8,
    margin: 0,
  },
  planCardFact: {
    display: 'grid',
    gap: 3,
  },
  planCardFactLabel: {
    color: AGF_COLORS.muted,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0',
    textTransform: 'uppercase',
  },
  planCardFactValue: {
    margin: 0,
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.35,
  },
  planToggle: {
    justifySelf: 'start',
    marginTop: 2,
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 999,
    background: '#fff',
    color: AGF_COLORS.slate,
    padding: '8px 11px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  planToggleActive: {
    borderColor: AGF_COLORS.teal,
    background: 'rgba(0, 173, 187, 0.08)',
    color: AGF_COLORS.teal,
  },
  compareToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    margin: '12px 0',
  },
  compareTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  compareMeta: {
    marginTop: 2,
    fontSize: 13,
    color: AGF_COLORS.muted,
  },
  toolbarActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedRail: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectedChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: `1px solid ${AGF_COLORS.teal}`,
    borderRadius: 999,
    background: 'rgba(0, 173, 187, 0.08)',
    color: AGF_COLORS.teal,
    padding: '8px 11px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  addChip: {
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 999,
    background: '#fff',
    color: AGF_COLORS.slate,
    padding: '8px 11px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
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
    minWidth: 236,
    width: 236,
  },
  stickyCol: {
    position: 'sticky',
    left: 0,
    zIndex: 5,
    borderRight: `1px solid ${AGF_COLORS.border}`,
    boxShadow: '6px 0 8px -8px rgba(0,0,0,0.12)',
  },
  programHeaderCard: {
    display: 'grid',
    gap: 7,
    border: `1px solid ${AGF_COLORS.border}`,
    borderRadius: 14,
    padding: 12,
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fcfd 100%)',
  },
  programHeaderTop: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  programTitle: {
    fontWeight: 800,
    color: AGF_COLORS.slate,
    lineHeight: 1.12,
    fontSize: 15,
  },
  programSubtitle: {
    color: AGF_COLORS.teal,
    fontWeight: 700,
    fontSize: 12,
  },
  headerCta: {
    display: 'inline-block',
    width: 'fit-content',
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
    fontWeight: 800,
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
    margin: '8px 0 0',
    fontSize: 20,
    lineHeight: 1.05,
    fontWeight: 800,
    color: AGF_COLORS.slate,
  },
  mobileProgramTag: {
    display: 'inline-flex',
    marginTop: 6,
    color: AGF_COLORS.teal,
    fontSize: 13,
    fontWeight: 800,
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
    letterSpacing: '0',
    textTransform: 'uppercase',
    color: AGF_COLORS.muted,
  },
  mobileProgramFactValue: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.45,
    color: '#1f2937',
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
  emptyState: {
    border: `1px dashed ${AGF_COLORS.border}`,
    borderRadius: 14,
    background: '#fff',
    padding: '20px 16px',
    color: AGF_COLORS.muted,
    textAlign: 'center',
    fontSize: 14,
  },
  disclaimer: {
    marginTop: 12,
    color: AGF_COLORS.muted,
    fontSize: 13,
    lineHeight: 1.4,
  },
};
