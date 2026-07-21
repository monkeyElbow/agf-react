#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BLOCK_ONLY_MANAGED_PAGE_PATHS,
  BLOCKLESS_MANAGED_PAGE_PATHS,
  SPECIAL_MANAGED_PAGE_CLASSIFICATIONS,
} from '../src/lib/managedPageShells.js';
import {
  CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS,
  CONTENT_ADMIN_SNAPSHOT_SCHEMA_VERSION,
  validateContentAdminRecordSchema,
  validateContentAdminStateSchema,
} from '../src/lib/contentAdminSnapshotSchema.js';
import {
  READABILITY_LARGE_FILE_LINE_THRESHOLD,
  SYSTEM_2_0_READINESS_TARGETS,
  SYSTEM_READABILITY_BOUNDARIES,
  SYSTEM_VISUAL_ACCESSIBILITY_GATES,
  getReadabilityBoundaryForFile,
} from '../src/lib/systemReadinessInventory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const PAGE_CONTENT_ALLOWED_SPECIAL_CLASSIFICATIONS = new Set([
  'functional-brand-kit',
  'legacy-page-content',
]);

const TARGET_BRIDGE_PATTERNS = Object.freeze([
  'targetSectionKey',
  'targetSectionClassName',
  'targetSectionIndex',
  'targetFineprintSectionKey',
  'mappedSection',
  'targetedDynamic',
]);

const STATIC_SOURCE_PATTERNS = Object.freeze([
  {
    label: 'createStatic compatibility helper',
    pattern: /\bcreateStatic[A-Za-z0-9_]*\b/g,
  },
  {
    label: 'static block mode literal',
    pattern: /\bmode\s*:\s*['"]static['"]/g,
  },
]);

const RETIRED_LEGACY_SOURCE_PATTERNS = Object.freeze([
  {
    label: 'Content admin retired snapshot repair helper legacy naming',
    files: ['src/context/ContentAdminContext.jsx'],
    pattern: /\b(?:is|should|normalize|upgrade|reset|read|to|with|default|get|build)[A-Za-z0-9_]*(?:Legacy|Stale|Compat|Fallback|Static)[A-Za-z0-9_]*\b/g,
  },
  {
    label: 'Retired editable-field API name',
    files: ['src/blocks/registry/index.js'],
    pattern: /\bgetLegacyEditableFieldsForKind\b/g,
  },
  {
    label: 'Link field legacy adapters',
    files: ['src/lib/linkValue.js'],
    pattern: /\b(?:coerceLegacyLinkValue(?:FromFields)?|validateLegacy(?:Link|Action)FieldGroups?|linkValueToLegacyLinkProps)\b/g,
  },
  {
    label: 'Retired CTA form legacy serializer names',
    files: ['src/blocks/foundation/forms.js'],
    pattern: /\b(?:CTA_FORM_LEGACY_SLOT_COUNT|LEGACY_FOLLOW_UP_SUBMIT_LABEL|buildLegacyCtaFormFields|buildLegacyCtaFormFieldSettings|normalizeLegacyCtaSubmitLabel)\b/g,
  },
  {
    label: 'Editor parity legacy contract name',
    files: ['src/lib/editorParityContract.js'],
    pattern: /\bLEGACY_EDITOR_PARITY_CONTRACT\b/g,
  },
  {
    label: 'Block mode static compatibility token',
    files: ['src/blocks/foundation/models.js'],
    pattern: /'static'|\bdynamic'\|'static\b/g,
  },
  {
    label: 'Root product page fallback convergence adapters',
    files: [
      'src/pages/InvestmentsPage.jsx',
      'src/pages/LoansPage.jsx',
      'src/pages/RetirementPage.jsx',
      'src/pages/ServicesPage.jsx',
    ],
    pattern: /\b(?:build[A-Za-z0-9_]*FallbackBlock|[A-Za-z0-9_]*FallbackBlock|fallbackBlock|fallbackItems|fallbackFineprint|fallbackSettings|fallbackVisionFuel)\b/g,
  },
]);

const LEGACY_ADAPTER_INVENTORY = Object.freeze([
]);

function readText(relativePath) {
  return readFileSync(path.resolve(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function walkFiles(relativeDir, {
  extensions = null,
  ignoreDirs = new Set(),
  ignoreFile = () => false,
} = {}) {
  const root = path.resolve(repoRoot, relativeDir);
  const files = [];

  function visit(absolutePath) {
    const relativePath = path.relative(repoRoot, absolutePath).split(path.sep).join('/');
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      const basename = path.basename(absolutePath);
      if (ignoreDirs.has(basename) || ignoreDirs.has(relativePath)) {
        return;
      }
      readdirSync(absolutePath).forEach((name) => visit(path.join(absolutePath, name)));
      return;
    }

    if (!stats.isFile()) {
      return;
    }

    if (ignoreFile(relativePath)) {
      return;
    }

    if (extensions && !extensions.has(path.extname(relativePath))) {
      return;
    }

    files.push(relativePath);
  }

  visit(root);
  return files.sort();
}

function collectPatternMatches(files, patterns) {
  const matches = [];

  files.forEach((relativePath) => {
    const lines = readText(relativePath).split(/\r?\n/);
    lines.forEach((line, index) => {
      patterns.forEach(({ label, pattern }) => {
        const nextPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
        if (nextPattern.test(line)) {
          matches.push({
            label,
            file: relativePath,
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    });
  });

  return matches;
}

function printFailure(title, matches) {
  console.error(`\n${title}`);
  matches.forEach((match) => {
    const label = match.label ? ` [${match.label}]` : '';
    console.error(`- ${match.file}:${match.line}${label} ${match.text}`);
  });
}

function countFileLines(relativePath) {
  return readText(relativePath).split(/\r?\n/).length;
}

function scanRouteClassifications() {
  const groups = [
    ['block-only', [...BLOCK_ONLY_MANAGED_PAGE_PATHS]],
    ['blockless', [...BLOCKLESS_MANAGED_PAGE_PATHS]],
    ['special', Object.keys(SPECIAL_MANAGED_PAGE_CLASSIFICATIONS)],
  ];
  const allClassifiedPaths = new Map();
  const overlaps = [];

  groups.forEach(([classification, paths]) => {
    paths.forEach((pathname) => {
      if (allClassifiedPaths.has(pathname)) {
        overlaps.push({
          pathname,
          classifications: [allClassifiedPaths.get(pathname), classification],
        });
        return;
      }
      allClassifiedPaths.set(pathname, classification);
    });
  });

  if (overlaps.length) {
    console.error('\nRoute classification scan failed.');
    overlaps.forEach((entry) => {
      console.error(`- ${entry.pathname} appears in ${entry.classifications.join(' and ')}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log('Route classification scan passed.');
  groups.forEach(([classification, paths]) => {
    console.log(`- ${classification}: ${paths.length}`);
  });
}

function scanStatic() {
  const sourceFiles = [
    ...walkFiles('src', {
      extensions: new Set(['.js', '.jsx', '.json']),
      ignoreFile: (relativePath) => (
        relativePath.includes('.test.')
        || relativePath.includes('.guardrail.')
      ),
    }),
    ...walkFiles('dev-data', {
      extensions: new Set(['.json']),
      ignoreDirs: new Set(['backups']),
    }),
  ];
  const sourceMatches = collectPatternMatches(sourceFiles, STATIC_SOURCE_PATTERNS);
  const staticBlockMatches = [];

  CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
    const record = readJson(relativePath);
    const blocksByPath = record?.[rootKey]?.blocksByPath || {};
    Object.entries(blocksByPath).forEach(([pathname, blocks]) => {
      (Array.isArray(blocks) ? blocks : []).forEach((block) => {
        if (block?.mode === 'static') {
          staticBlockMatches.push({
            file: `${relativePath}#${rootKey}`,
            line: 1,
            label,
            text: `${pathname} ${block?.id || '(missing id)'}`,
          });
        }
      });
    });
  });

  const matches = [...sourceMatches, ...staticBlockMatches];
  if (matches.length) {
    printFailure('Static/createStatic scan failed.', matches);
    process.exitCode = 1;
    return;
  }

  console.log('Static/createStatic scan passed.');
}

function scanRetiredLegacySourceNames() {
  const matches = [];

  RETIRED_LEGACY_SOURCE_PATTERNS.forEach((entry) => {
    const files = entry.files.filter((relativePath) => {
      try {
        statSync(path.resolve(repoRoot, relativePath));
        return true;
      } catch {
        return false;
      }
    });
    matches.push(...collectPatternMatches(files, [{ label: entry.label, pattern: entry.pattern }]));
  });

  if (matches.length) {
    printFailure('Retired legacy source-name scan failed.', matches);
    process.exitCode = 1;
    return;
  }

  console.log('Retired legacy source-name scan passed.');
}

function scanTargetBridge() {
  const sourceFiles = [
    ...walkFiles('src', {
      extensions: new Set(['.js', '.jsx', '.json']),
      ignoreFile: (relativePath) => (
        relativePath.includes('.test.')
        || relativePath.includes('.guardrail.')
      ),
    }),
  ];
  const sourceMatches = collectPatternMatches(
    sourceFiles,
    TARGET_BRIDGE_PATTERNS.map((token) => ({
      label: token,
      pattern: new RegExp(`\\b${token}\\b`, 'g'),
    })),
  );
  const dataMatches = [];

  CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
    const record = readJson(relativePath);
    const blocksByPath = record?.[rootKey]?.blocksByPath || {};
    Object.entries(blocksByPath).forEach(([pathname, blocks]) => {
      (Array.isArray(blocks) ? blocks : []).forEach((block) => {
        const settings = block?.settings && typeof block.settings === 'object'
          ? block.settings
          : {};

        TARGET_BRIDGE_PATTERNS.forEach((token) => {
          if (!Object.prototype.hasOwnProperty.call(settings, token)) {
            return;
          }
          dataMatches.push({
            label: `${label} ${token}`,
            file: `${relativePath}#${rootKey}`,
            line: 1,
            text: `${pathname} ${block?.id || '(missing id)'}`,
          });
        });
      });
    });
  });

  const matches = [...sourceMatches, ...dataMatches];

  if (matches.length) {
    printFailure('Target bridge scan failed.', matches);
    process.exitCode = 1;
    return;
  }

  console.log('Target bridge scan passed.');
}

function isPageContentBlock(block) {
  return block?.id === 'page_content' || block?.kind === 'page_content';
}

function collectPageContentFindings(label, blocksByPath = {}) {
  return Object.entries(blocksByPath)
    .flatMap(([pathname, blocks]) => (Array.isArray(blocks) ? blocks : [])
      .filter(isPageContentBlock)
      .map((block) => {
        const classification = SPECIAL_MANAGED_PAGE_CLASSIFICATIONS[pathname] || '';
        const allowed = Boolean(
          classification
          && PAGE_CONTENT_ALLOWED_SPECIAL_CLASSIFICATIONS.has(classification)
          && !BLOCK_ONLY_MANAGED_PAGE_PATHS.has(pathname)
          && !BLOCKLESS_MANAGED_PAGE_PATHS.has(pathname)
        );

        return {
          label,
          pathname,
          blockId: block?.id || '(missing id)',
          kind: block?.kind || '(missing kind)',
          classification: classification || '(unclassified)',
          allowed,
        };
      }));
}

function scanPageContent() {
  const findings = [
    ...CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.flatMap(({ label, relativePath, rootKey }) => {
      const record = readJson(relativePath);
      return collectPageContentFindings(`${label} (${relativePath}#${rootKey})`, record?.[rootKey]?.blocksByPath || {});
    }),
  ];
  const violations = findings.filter((finding) => !finding.allowed);

  if (violations.length) {
    console.error('\nPage_content scan failed.');
    violations.forEach((finding) => {
      console.error(`- ${finding.label}: ${finding.pathname} ${finding.blockId}/${finding.kind} classification=${finding.classification}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log('Page_content scan passed.');
  if (findings.length) {
    console.log('Allowed page_content routes:');
    Array.from(new Set(findings.map((finding) => `${finding.pathname} (${finding.classification})`)))
      .sort()
      .forEach((entry) => console.log(`- ${entry}`));
  }
}

function scanSnapshotSchema() {
  const findings = CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.flatMap((entry) => {
    const { label, relativePath, recordType, rootKey } = entry;
    const record = readJson(relativePath);
    return [
      ...validateContentAdminRecordSchema(record, { label, recordType }),
      ...validateContentAdminStateSchema(record?.[rootKey], { label: `${label} (${relativePath}#${rootKey})` }),
    ].map((finding) => ({
      ...finding,
      file: `${relativePath}#${rootKey}`,
    }));
  });

  if (findings.length) {
    console.error(`\nSnapshot schema scan failed. Expected schema version ${CONTENT_ADMIN_SNAPSHOT_SCHEMA_VERSION}.`);
    findings.forEach((finding) => {
      console.error(`- ${finding.file} [${finding.code}] ${finding.message}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log(`Snapshot schema scan passed. Schema version ${CONTENT_ADMIN_SNAPSHOT_SCHEMA_VERSION}.`);
}

function scanReadability() {
  const sourceFiles = [
    ...walkFiles('src', {
      extensions: new Set(['.css', '.js', '.jsx']),
      ignoreFile: (relativePath) => (
        relativePath.includes('.test.')
        || relativePath.includes('.guardrail.')
      ),
    }),
  ];
  const largeFiles = sourceFiles
    .map((relativePath) => ({
      file: relativePath,
      lines: countFileLines(relativePath),
      boundary: getReadabilityBoundaryForFile(relativePath),
    }))
    .filter((entry) => entry.lines >= READABILITY_LARGE_FILE_LINE_THRESHOLD);
  const undocumented = largeFiles.filter((entry) => !entry.boundary);
  const missingFiles = SYSTEM_READABILITY_BOUNDARIES.filter((entry) => {
    try {
      statSync(path.resolve(repoRoot, entry.file));
      return false;
    } catch {
      return true;
    }
  });

  if (undocumented.length || missingFiles.length) {
    console.error('\nReadability boundary scan failed.');
    undocumented.forEach((entry) => {
      console.error(`- ${entry.file} has ${entry.lines} lines and no readability boundary inventory entry.`);
    });
    missingFiles.forEach((entry) => {
      console.error(`- ${entry.file} is listed in readability inventory but does not exist.`);
    });
    process.exitCode = 1;
    return;
  }

  console.log(`Readability boundary scan passed. Large-file threshold: ${READABILITY_LARGE_FILE_LINE_THRESHOLD} lines.`);
  largeFiles
    .sort((left, right) => right.lines - left.lines)
    .forEach((entry) => {
      console.log(`- ${entry.file}: ${entry.lines} lines; next split: ${entry.boundary.nextSplit}`);
    });
}

function scanSafetyNets() {
  const invalidGates = SYSTEM_VISUAL_ACCESSIBILITY_GATES.filter((gate) => (
    !gate.id
    || !gate.status
    || !gate.scope
    || (gate.status === 'covered' && !gate.command)
  ));
  const invalidTargets = SYSTEM_2_0_READINESS_TARGETS.filter((target) => (
    !target.id
    || !target.status
    || !target.currentAdapter
    || !target.retireWhen
  ));

  if (invalidGates.length || invalidTargets.length) {
    console.error('\nSafety net inventory scan failed.');
    invalidGates.forEach((gate) => console.error(`- visual/a11y gate ${gate.id || '(missing id)'} is incomplete.`));
    invalidTargets.forEach((target) => console.error(`- 2.0 target ${target.id || '(missing id)'} is incomplete.`));
    process.exitCode = 1;
    return;
  }

  console.log('Safety net inventory scan passed.');
  console.log('Visual/accessibility gates:');
  SYSTEM_VISUAL_ACCESSIBILITY_GATES.forEach((gate) => {
    console.log(`- ${gate.id}: ${gate.status}${gate.command ? ` (${gate.command})` : ''}`);
  });
  console.log('2.0 readiness targets:');
  SYSTEM_2_0_READINESS_TARGETS.forEach((target) => {
    console.log(`- ${target.id}: ${target.status}; retire when: ${target.retireWhen}`);
  });
}

function scanLegacyAdapters() {
  console.log('Legacy adapter inventory:');

  LEGACY_ADAPTER_INVENTORY.forEach((entry) => {
    const matches = collectPatternMatches(
      entry.files.filter((relativePath) => {
        try {
          statSync(path.resolve(repoRoot, relativePath));
          return true;
        } catch {
          return false;
        }
      }),
      [{ label: entry.label, pattern: entry.pattern }],
    );

    console.log(`\n${entry.label}: ${matches.length} match${matches.length === 1 ? '' : 'es'}`);
    matches.slice(0, 20).forEach((match) => {
      console.log(`- ${match.file}:${match.line} ${match.text}`);
    });
    if (matches.length > 20) {
      console.log(`- ... ${matches.length - 20} more`);
    }
    if (entry.retireWhen) {
      console.log(`Retire when: ${entry.retireWhen}`);
    }
  });

  console.log('\nLegacy adapter inventory scan passed.');
}

function scanAll() {
  scanRouteClassifications();
  scanStatic();
  scanTargetBridge();
  scanPageContent();
  scanSnapshotSchema();
  scanReadability();
  scanRetiredLegacySourceNames();
  scanSafetyNets();
  scanLegacyAdapters();
}

const command = process.argv[2] || 'all';
const commands = {
  all: scanAll,
  static: scanStatic,
  'route-classifications': scanRouteClassifications,
  'target-bridge': scanTargetBridge,
  'page-content': scanPageContent,
  'snapshot-schema': scanSnapshotSchema,
  readability: scanReadability,
  'retired-legacy-source-names': scanRetiredLegacySourceNames,
  'safety-nets': scanSafetyNets,
  'legacy-adapters': scanLegacyAdapters,
};

if (!commands[command]) {
  console.error(`Unknown system check command: ${command}`);
  console.error(`Expected one of: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}

commands[command]();
