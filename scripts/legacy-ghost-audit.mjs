#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const AUDITS = Object.freeze({
  'retirement-403b-rmha': {
    roots: ['src', 'dev-server', 'dev-data'],
    ignorePath: (relativePath, options = {}) => (
      (!options.includeBackups && relativePath.startsWith('dev-data/backups/'))
      || relativePath.startsWith('dist/')
      || relativePath.includes('/node_modules/')
    ),
    patterns: [
      {
        label: 'retired strategy enroll block',
        needle: 'strategy_enroll_cta',
        activeRisk: true,
      },
      {
        label: 'retired strategy enroll selector',
        needle: 'retirement-403b-native-strategy-enroll-cta',
        activeRisk: true,
      },
      {
        label: '403b page_content fallback',
        needle: '"page_content"',
        activeRisk: true,
        onlyWhen: ({ path: filePath, text, pointer }) => (
          text.includes('/services/retirement/403b')
          || isRetirement403bSnapshotPath(filePath, pointer)
        ),
      },
      {
        label: 'target-section bridge field',
        needle: 'targetSection',
        activeRisk: true,
        onlyWhen: ({ path: filePath, text, pointer }) => (
          text.includes('/services/retirement/403b')
          || isRetirement403bSnapshotPath(filePath, pointer)
        ),
      },
      {
        label: 'legacy RMHA bullet class',
        needle: 'ret403b-housing-feature-bullet-intro',
        activeRisk: true,
      },
      {
        label: 'legacy RMHA bullet copy',
        needle: 'The maximum housing allowance exemption in any tax year is the lesser of:',
        activeRisk: true,
      },
      {
        label: 'leaked old RMHA lead copy',
        needle: 'The unique benefit, which gives ministers a significant tax savings',
        activeRisk: true,
      },
      {
        label: 'canonical RMHA title',
        needle: "Retired Ministers' Housing Allowance",
        activeRisk: false,
      },
      {
        label: 'old standalone RMHA feature selector',
        needle: 'retirement-ministers-housing-feature',
        activeRisk: true,
      },
      {
        label: 'old RMHA feature selector',
        needle: 'ret403b-housing-feature-',
        activeRisk: true,
      },
      {
        label: '403b route class',
        needle: 'retirement-403b-native-',
        activeRisk: false,
      },
    ],
  },
});

function isRetirement403bSnapshotPath(filePath, textPath) {
  if (!filePath.includes('content-admin')) {
    return false;
  }

  return String(textPath || '').includes('.blocksByPath./services/retirement/403b');
}

function usage() {
  console.log('Usage: node scripts/legacy-ghost-audit.mjs <audit-name> [--json]');
  console.log('');
  console.log('Available audits:');
  Object.keys(AUDITS).forEach((name) => console.log(`- ${name}`));
}

function listFiles(relativeRoot, ignorePath, options = {}) {
  const root = path.resolve(repoRoot, relativeRoot);
  const files = [];

  function visit(absolutePath) {
    const stats = statSync(absolutePath);
    const relativePath = path.relative(repoRoot, absolutePath).split(path.sep).join('/');

    if (ignorePath(relativePath, options)) {
      return;
    }

    if (stats.isDirectory()) {
      readdirSync(absolutePath).forEach((entry) => visit(path.join(absolutePath, entry)));
      return;
    }

    if (!stats.isFile()) {
      return;
    }

    if (/\.(js|jsx|mjs|cjs|css|json|md|txt)$/.test(relativePath)) {
      files.push(relativePath);
    }
  }

  visit(root);
  return files;
}

function flattenJson(value, prefix = '$') {
  const entries = [];

  function visit(node, nodePath) {
    if (node == null) {
      return;
    }

    if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
      entries.push({
        pointer: nodePath,
        text: String(node),
      });
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${nodePath}[${index}]`));
      return;
    }

    if (typeof node === 'object') {
      Object.entries(node).forEach(([key, item]) => visit(item, `${nodePath}.${key}`));
    }
  }

  visit(value, prefix);
  return entries;
}

function readSearchUnits(relativePath) {
  const absolutePath = path.resolve(repoRoot, relativePath);
  const source = readFileSync(absolutePath, 'utf8');

  if (relativePath.endsWith('.json')) {
    try {
      return flattenJson(JSON.parse(source)).map((entry) => ({
        path: relativePath,
        line: entry.pointer,
        pointer: entry.pointer,
        text: entry.text,
      }));
    } catch {
      return source.split(/\r?\n/).map((line, index) => ({
        path: relativePath,
        line: index + 1,
        text: line,
      }));
    }
  }

  return source.split(/\r?\n/).map((line, index) => ({
    path: relativePath,
    line: index + 1,
    text: line,
  }));
}

function runAudit(auditName, options = {}) {
  const audit = AUDITS[auditName];
  if (!audit) {
    usage();
    process.exitCode = 1;
    return [];
  }

  const files = audit.roots
    .flatMap((root) => listFiles(root, audit.ignorePath || (() => false), options))
    .sort();
  const results = [];

  files.forEach((filePath) => {
    readSearchUnits(filePath).forEach((unit) => {
      audit.patterns.forEach((pattern) => {
        if (!unit.text.includes(pattern.needle)) {
          return;
        }
        if (typeof pattern.onlyWhen === 'function' && !pattern.onlyWhen(unit)) {
          return;
        }
        results.push({
          label: pattern.label,
          needle: pattern.needle,
          activeRiskPattern: Boolean(pattern.activeRisk),
          path: unit.path,
          line: unit.line,
          text: unit.text.trim().slice(0, 220),
        });
      });
    });
  });

  return results;
}

function summarizeResults(results) {
  const activeRiskResults = results.filter((result) => result.activeRiskPattern);
  const activeDevDataRisks = activeRiskResults.filter((result) => result.path.startsWith('dev-data/'));
  const activeBackupRisks = activeRiskResults.filter((result) => result.path.startsWith('dev-data/backups/'));

  return {
    total: results.length,
    riskPatterns: activeRiskResults.length,
    activeDevDataRisks: activeDevDataRisks.length,
    activeBackupRisks: activeBackupRisks.length,
  };
}

const auditName = process.argv[2];
const outputJson = process.argv.includes('--json');
const includeBackups = process.argv.includes('--include-backups');

if (!auditName || auditName === '--help' || auditName === '-h') {
  usage();
  process.exit(auditName ? 0 : 1);
}

const results = runAudit(auditName, { includeBackups });

if (outputJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const summary = summarizeResults(results);
  console.log(`Legacy ghost audit: ${auditName}`);
  console.log(`Matches: ${summary.total}`);
  console.log(`Risk-pattern matches: ${summary.riskPatterns}`);
  console.log(`Active dev-data risk matches: ${summary.activeDevDataRisks}`);
  if (includeBackups) {
    console.log(`Active backup risk matches: ${summary.activeBackupRisks}`);
  }
  results.forEach((result) => {
    const risk = result.activeRiskPattern ? 'risk-pattern' : 'context';
    console.log(`- ${result.path}:${result.line} [${risk}] ${result.label}: ${result.text}`);
  });
}
