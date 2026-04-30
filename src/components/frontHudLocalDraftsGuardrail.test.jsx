import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HUD_LOCAL_DRAFT_FILES = [
  '../pages/HomePage.jsx',
  '../pages/ServicesPage.jsx',
  '../pages/InvestmentsPage.jsx',
  '../pages/RetirementPage.jsx',
  '../pages/LoansPage.jsx',
  '../pages/AdminContentPage.jsx',
  './NativeContentPage.jsx',
];

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('front HUD local draft guardrail', () => {
  HUD_LOCAL_DRAFT_FILES.forEach((relativePath) => {
    it(`keeps ${relativePath} on local draft editing instead of context buffering`, () => {
      const source = readSource(relativePath);

      expect(source).toContain('useLocalBlockDrafts');
      expect(source).not.toMatch(/\bupdateBlockSetting\(/);
      expect(source).not.toMatch(/\bcommitBlockSettingsPatch\(/);
      expect(source).not.toMatch(/\bclaimBufferedBlockEdit\(/);
    });
  });
});
