import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defaultInvestmentsIntroSettings as blueprintIntroDefaults } from './contentBlockBlueprints';
import {
  buildDefaultInvestmentsIntroRuntime,
  defaultInvestmentsIntroSettings,
  DEFAULT_INVESTMENTS_INTRO_BODY_TEXT,
  DEFAULT_INVESTMENTS_INTRO_EXTRA_LINE,
  DEFAULT_INVESTMENTS_INTRO_HEADING,
} from './investmentsIntroSeed';
import { getNativePageContent } from './nativePageContent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('investments intro seed guardrail', () => {
  it('keeps blueprint defaults and runtime fallback aligned to one canonical intro seed', () => {
    const nativeIntro = getNativePageContent('/services/investments', 'Investments')?.intro;
    const runtimeIntro = buildDefaultInvestmentsIntroRuntime();

    expect(blueprintIntroDefaults).toEqual(defaultInvestmentsIntroSettings);
    expect(nativeIntro).toBeUndefined();
    expect(runtimeIntro.heading).toBe(DEFAULT_INVESTMENTS_INTRO_HEADING);
    expect(runtimeIntro.bodyHtml).toContain(DEFAULT_INVESTMENTS_INTRO_BODY_TEXT);
    expect(runtimeIntro.extraLine).toBe(DEFAULT_INVESTMENTS_INTRO_EXTRA_LINE);
  });

  it('keeps InvestmentsPage and contentBlockBlueprints on the shared intro seed instead of local literal copy', () => {
    const investmentsPageSource = readSource('../pages/InvestmentsPage.jsx');
    const blueprintSource = readSource('./contentBlockBlueprints.js');

    expect(investmentsPageSource).toContain("from '../data/investmentsIntroSeed'");
    expect(blueprintSource).toContain("from './investmentsIntroSeed'");
    expect(investmentsPageSource).not.toContain('Invest like it matters. Because it does.');
    expect(investmentsPageSource).not.toContain('Every dollar you invest generates a strong return while funding church construction and ministry growth.');
    expect(investmentsPageSource).not.toContain("That's the power of faith-driven investing.");
    expect(blueprintSource).not.toContain('Invest like it matters. Because it does.');
    expect(blueprintSource).not.toContain('Every dollar you invest generates a strong return while funding church construction and ministry growth.');
  });
});
