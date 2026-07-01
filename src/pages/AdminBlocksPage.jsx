import { useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { getSingletonBlockKinds } from '../blocks/registry';
import { useContentAdmin } from '../context/ContentAdminContext';
import { pageByPath } from '../data/siteMap';

const SINGLETON_BLOCK_KINDS = new Set(getSingletonBlockKinds());

const HERO_LEGACY_CLASS_TOKENS = [
  'lineblur',
  'lineb',
];

const PLACEHOLDER_TEXT_TOKENS = [
  'test the panel system',
  'saved-page copy restoration',
  'dynamic hero test route for panel experiments',
];

function normalizeBlockMode(value) {
  const token = String(value || '').trim().toLowerCase();
  if (token === 'dynamic' || token === 'static') {
    return token;
  }
  return 'other';
}

function toDisplayMode(value) {
  if (value === 'dynamic') {
    return 'Dynamic';
  }
  if (value === 'static') {
    return 'Static';
  }
  return 'Other';
}

function toPageTitle(pathname, pageHierarchy) {
  return String(pageHierarchy?.[pathname]?.title || '').trim() || pathname;
}

function hasPlaceholderText(value) {
  const source = String(value || '').trim().toLowerCase();
  if (!source) {
    return false;
  }
  return PLACEHOLDER_TEXT_TOKENS.some((token) => source.includes(token));
}

function createIssue(code, label, detail, severity = 'warning') {
  return {
    code,
    label,
    detail,
    severity,
  };
}

export function collectBlockIssues(block, mode) {
  const issues = [];
  const blockId = String(block?.id || '').trim();
  const kind = String(block?.kind || '').trim().toLowerCase();
  const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};

  if (!blockId) {
    issues.push(createIssue('missing_id', 'Missing ID', 'Block has no `id` value.'));
  }
  if (!kind) {
    issues.push(createIssue('missing_kind', 'Missing kind', 'Block has no `kind` value.'));
  }
  if (mode === 'other') {
    issues.push(createIssue('invalid_mode', 'Unknown mode', `Unexpected mode value: ${String(block?.mode || '(empty)')}`));
  }

  if (kind === 'hero') {
    const line1Text = String(settings.line1Text || '').trim();
    const line2Text = String(settings.line2Text || '').trim();
    const title = String(settings.title || '').trim();
    const eyebrow = String(settings.eyebrow || '').trim();
    if (mode === 'dynamic' && !line1Text && !line2Text && !title && !eyebrow) {
      issues.push(createIssue('hero_missing_copy', 'Missing hero copy', 'Dynamic hero is missing line/title text.'));
    }

    const line1Class = String(settings.line1ClassName || '').trim().toLowerCase();
    const line2Class = String(settings.line2ClassName || '').trim().toLowerCase();
    const hasLegacyHeroClass = HERO_LEGACY_CLASS_TOKENS.some((token) => (
      line1Class.includes(token) || line2Class.includes(token)
    ));
    if (hasLegacyHeroClass) {
      issues.push(createIssue('hero_legacy_class', 'Legacy hero class', 'Hero still references legacy class tokens.'));
    }

    if (
      hasPlaceholderText(line1Text)
      || hasPlaceholderText(line2Text)
      || hasPlaceholderText(title)
      || hasPlaceholderText(eyebrow)
    ) {
      issues.push(createIssue('hero_placeholder_copy', 'Placeholder copy', 'Hero includes placeholder test copy.'));
    }
  }

  if (kind === 'intro') {
    const heading = String(settings.heading || '').trim();
    const body = String(settings.body || '').trim();
    const bodyHtml = String(settings.bodyHtml || '').trim();
    if (mode === 'dynamic' && !heading && !body && !bodyHtml) {
      issues.push(createIssue('intro_missing_copy', 'Missing intro copy', 'Dynamic intro is missing heading/body content.'));
    }
    if (hasPlaceholderText(heading) || hasPlaceholderText(body) || hasPlaceholderText(bodyHtml)) {
      issues.push(createIssue('intro_placeholder_copy', 'Placeholder copy', 'Intro includes placeholder test copy.'));
    }
  }

  if (kind === 'cta_form' || kind === 'request_form') {
    const title = String(settings.title || '').trim();
    if (mode === 'dynamic' && !title) {
      issues.push(createIssue('form_missing_title', 'Missing form title', 'Dynamic form block is missing a title.'));
    }
  }

  return issues;
}

export default function AdminBlocksPage() {
  const { blocksByPath, pageHierarchy } = useContentAdmin();
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');

  const audit = useMemo(() => {
    const rows = [];
    const pagesWithIssues = [];
    const paths = Object.keys(blocksByPath || {})
      .filter((path) => path && !path.startsWith('/admin/'))
      .sort((a, b) => a.localeCompare(b));

    paths.forEach((path) => {
      const pageTitle = toPageTitle(path, pageHierarchy);
      const blocks = Array.isArray(blocksByPath[path]) ? blocksByPath[path] : [];
      const idCounts = new Map();
      const singletonKindCounts = new Map();

      blocks.forEach((block) => {
        const blockId = String(block?.id || '').trim();
        const kind = String(block?.kind || '').trim().toLowerCase();
        if (blockId) {
          idCounts.set(blockId, (idCounts.get(blockId) || 0) + 1);
        }
        if (kind && SINGLETON_BLOCK_KINDS.has(kind)) {
          singletonKindCounts.set(kind, (singletonKindCounts.get(kind) || 0) + 1);
        }
      });

      const duplicateIds = [...idCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([id]) => id);
      const duplicateSingletonKinds = [...singletonKindCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([kind]) => kind);
      const pageIssueCounts = new Map();

      blocks.forEach((block, index) => {
        const blockId = String(block?.id || '').trim();
        const kind = String(block?.kind || '').trim().toLowerCase();
        const normalizedMode = normalizeBlockMode(block?.mode);
        const duplicateId = Boolean(blockId && duplicateIds.includes(blockId));
        const duplicateSingletonKind = Boolean(kind && duplicateSingletonKinds.includes(kind));
        const issues = collectBlockIssues(block, normalizedMode);
        issues.forEach((issue) => {
          pageIssueCounts.set(issue.label, (pageIssueCounts.get(issue.label) || 0) + 1);
        });
        rows.push({
          key: `${path}-${index}-${blockId || 'block'}`,
          path,
          pageTitle,
          order: index + 1,
          id: blockId || '(missing)',
          kind: kind || '(missing)',
          mode: normalizedMode,
          modeLabel: toDisplayMode(normalizedMode),
          name: String(block?.name || '').trim() || '(unnamed)',
          hidden: Boolean(block?.hidden),
          hasIssue: duplicateId || duplicateSingletonKind || issues.length > 0,
          hasConfigIssue: issues.length > 0,
          issues,
          duplicateId,
          duplicateSingletonKind,
        });
      });

      const configIssues = [...pageIssueCounts.entries()].map(([label, count]) => `${label} (${count})`);
      if (duplicateIds.length || duplicateSingletonKinds.length || configIssues.length) {
        pagesWithIssues.push({
          path,
          title: pageTitle,
          duplicateIds,
          duplicateSingletonKinds,
          configIssues,
        });
      }
    });

    return { rows, pagesWithIssues };
  }, [blocksByPath, pageHierarchy]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return audit.rows.filter((row) => {
      if (modeFilter !== 'all' && row.mode !== modeFilter) {
        return false;
      }
      if (issueFilter === 'issues' && !row.hasIssue) {
        return false;
      }
      if (issueFilter === 'clean' && row.hasIssue) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [
        row.path,
        row.pageTitle,
        row.id,
        row.kind,
        row.mode,
        row.name,
      ].join(' ').toLowerCase().includes(needle);
    });
  }, [audit.rows, issueFilter, modeFilter, search]);

  const summary = useMemo(() => {
    const total = audit.rows.length;
    const dynamic = audit.rows.filter((row) => row.mode === 'dynamic').length;
    const statik = audit.rows.filter((row) => row.mode === 'static').length;
    const withIssues = audit.rows.filter((row) => row.hasIssue).length;
    const withConfigIssues = audit.rows.filter((row) => row.hasConfigIssue).length;
    const pagesWithIssues = audit.pagesWithIssues.length;
    const pagesWithConfigIssues = audit.pagesWithIssues.filter((row) => row.configIssues.length).length;
    return {
      total,
      dynamic,
      statik,
      withIssues,
      withConfigIssues,
      pagesWithIssues,
      pagesWithConfigIssues,
    };
  }, [audit.pagesWithIssues.length, audit.rows]);

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Blocks Audit" source={pageByPath['/admin/blocks']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          Temporary block audit. Review dynamic and static blocks across all pages, including block IDs and duplicate warnings.
        </div>

        <section className="admin-content-section">
          <div className="admin-block-audit-toolbar">
            <label htmlFor="admin-blocks-audit-search" className="search-page-label">
              Search blocks
              <input
                id="admin-blocks-audit-search"
                className="search-page-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Path, page, ID, kind, or name"
              />
            </label>

            <label htmlFor="admin-blocks-audit-mode" className="search-page-label">
              Mode filter
              <select
                id="admin-blocks-audit-mode"
                className="search-page-select"
                value={modeFilter}
                onChange={(event) => setModeFilter(event.target.value)}
              >
                <option value="all">All modes</option>
                <option value="dynamic">Dynamic only</option>
                <option value="static">Static only</option>
                <option value="other">Other mode values</option>
              </select>
            </label>

            <label htmlFor="admin-blocks-audit-issues" className="search-page-label">
              Issue filter
              <select
                id="admin-blocks-audit-issues"
                className="search-page-select"
                value={issueFilter}
                onChange={(event) => setIssueFilter(event.target.value)}
              >
                <option value="all">All blocks</option>
                <option value="issues">Issues only</option>
                <option value="clean">No issues</option>
              </select>
            </label>
          </div>

          <div className="admin-block-audit-summary" role="status" aria-live="polite">
            <p><strong>Total:</strong> {summary.total}</p>
            <p><strong>Dynamic:</strong> {summary.dynamic}</p>
            <p><strong>Static:</strong> {summary.statik}</p>
            <p><strong>Rows with issues:</strong> {summary.withIssues}</p>
            <p><strong>Rows with config issues:</strong> {summary.withConfigIssues}</p>
            <p><strong>Pages with issues:</strong> {summary.pagesWithIssues}</p>
            <p><strong>Pages with config issues:</strong> {summary.pagesWithConfigIssues}</p>
            <p><strong>Filtered rows:</strong> {filteredRows.length}</p>
          </div>
        </section>

        {audit.pagesWithIssues.length ? (
          <section className="admin-content-section">
            <h3>Warnings by Page</h3>
            <div className="admin-block-audit-issues-list">
              {audit.pagesWithIssues.map((entry) => (
                <article key={entry.path} className="admin-block-audit-issue-card">
                  <p className="admin-block-audit-issue-title">{entry.title}</p>
                  <p className="admin-block-audit-issue-path">{entry.path}</p>
                  {entry.duplicateIds.length ? (
                    <p className="admin-block-audit-issue-meta">
                      Duplicate IDs: {entry.duplicateIds.join(', ')}
                    </p>
                  ) : null}
                  {entry.duplicateSingletonKinds.length ? (
                    <p className="admin-block-audit-issue-meta">
                      Duplicate singleton kinds: {entry.duplicateSingletonKinds.join(', ')}
                    </p>
                  ) : null}
                  {entry.configIssues.length ? (
                    <p className="admin-block-audit-issue-meta">
                      Config issues: {entry.configIssues.join(', ')}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="admin-content-section">
          <h3>Block List</h3>
          {filteredRows.length ? (
            <div className="admin-block-audit-table-scroll">
              <table className="data-table admin-block-audit-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Page</th>
                    <th className="admin-block-audit-col-id">ID</th>
                    <th>Kind</th>
                    <th>Mode</th>
                    <th>Name</th>
                    <th>Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.key} className={row.hasIssue ? 'is-issue' : ''}>
                      <td>{row.order}</td>
                      <td>
                        <p className="admin-block-audit-page-title">{row.pageTitle}</p>
                        <p className="admin-block-audit-page-path">{row.path}</p>
                      </td>
                      <td className="admin-block-audit-col-id">
                        <code title={row.id}>{row.id}</code>
                      </td>
                      <td>
                        <code>{row.kind}</code>
                      </td>
                      <td>
                        <span className={`admin-block-audit-mode-pill is-${row.mode}`}>
                          {row.modeLabel}
                        </span>
                      </td>
                      <td>{row.name}</td>
                      <td>
                        <div className="admin-block-audit-flag-list">
                          {row.hidden ? <span className="admin-block-audit-flag">Hidden</span> : null}
                          {row.duplicateId ? <span className="admin-block-audit-flag is-warning">Duplicate ID</span> : null}
                          {row.duplicateSingletonKind ? <span className="admin-block-audit-flag is-warning">Duplicate Singleton</span> : null}
                          {row.issues.map((issue) => (
                            <span
                              key={`${row.key}-${issue.code}`}
                              className={`admin-block-audit-flag is-${issue.severity}`}
                              title={issue.detail}
                            >
                              {issue.label}
                            </span>
                          ))}
                          {!row.hidden && !row.duplicateId && !row.duplicateSingletonKind && !row.issues.length ? (
                            <span className="admin-block-audit-flag is-clean">OK</span>
                          ) : null}
                        </div>
                        {row.issues.length ? (
                          <ul className="admin-block-audit-issue-detail-list">
                            {row.issues.map((issue) => (
                              <li key={`${row.key}-detail-${issue.code}`} className={`is-${issue.severity}`}>
                                {issue.detail}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="blank-state-note">No blocks match the current filters.</p>
          )}
        </section>
      </PageShell>
    </div>
  );
}
