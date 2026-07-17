import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { normalizeStoredConfig } from '../context/ContentAdminContext.jsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RETIREMENT_403B_GUARDRAIL_PATHS = [
  '/services/retirement/403b',
  '/services/retirement/403b/403b-individual-enrollment',
  '/services/retirement/403b/403b-group-enrollment',
];

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(__dirname, relativePath), 'utf8'));
}

function summarizeInventory(blocks) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => ({
    id: block?.id,
    kind: block?.kind,
    mode: block?.mode,
  }));
}

describe('403(b) retirement inventory guardrail', () => {
  it('keeps shared and seed route inventories aligned to the canonical blueprint map', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const sharedBlocksByPath = sharedRecord?.state?.blocksByPath || {};
    const seedBlocksByPath = seedRecord?.state?.blocksByPath || {};
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};

    RETIREMENT_403B_GUARDRAIL_PATHS.forEach((pathname) => {
      const canonicalInventory = summarizeInventory(canonicalBlocksByPath[pathname] || []);
      const sharedInventory = summarizeInventory(sharedBlocksByPath[pathname] || []);
      const seedInventory = summarizeInventory(seedBlocksByPath[pathname] || []);

      expect(sharedInventory, `${pathname} shared inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(seedInventory, `${pathname} seed inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
    });
  });
});
