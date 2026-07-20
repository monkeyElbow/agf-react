import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import {
  buildDefaultLoansIntroRuntime,
  defaultLoansIntroSettings,
  DEFAULT_LOANS_INTRO_BODY_TEXT,
  DEFAULT_LOANS_INTRO_HEADING,
} from './loansIntroSeed';
import { getNativePageContent } from './nativePageContent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('loans intro seed guardrail', () => {
  it('keeps blueprint defaults, native route seed, and runtime fallback aligned to one canonical loans intro seed', () => {
    const introBlock = contentBlockBlueprintsByPath['/services/loans']?.find((block) => block?.id === 'intro' && block?.kind === 'intro');
    const nativeIntro = getNativePageContent('/services/loans', 'Loans')?.intro;
    const runtimeIntro = buildDefaultLoansIntroRuntime();

    expect(introBlock?.settings).toEqual(defaultLoansIntroSettings);
    expect(nativeIntro).toBeUndefined();
    expect(runtimeIntro.heading).toBe(DEFAULT_LOANS_INTRO_HEADING);
    expect(runtimeIntro.bodyHtml).toContain(DEFAULT_LOANS_INTRO_BODY_TEXT);
  });

  it('keeps LoansPage on the shared intro seed instead of page-local editorial fallback copy', () => {
    const pageSource = readSource('../pages/LoansPage.jsx');
    const blueprintSource = readSource('./contentBlockBlueprints.js');

    expect(pageSource).toContain("from '../data/loansIntroSeed'");
    expect(blueprintSource).toContain("from './loansIntroSeed'");
    expect(pageSource).toContain(') : resolvedIntro.body ? (');
    expect(pageSource).not.toContain('{resolvedIntro.body ? <p>{resolvedIntro.body}</p> : null}');
    expect(pageSource).not.toContain(DEFAULT_LOANS_INTRO_HEADING);
    expect(pageSource).not.toContain(DEFAULT_LOANS_INTRO_BODY_TEXT);
    expect(blueprintSource).not.toContain(DEFAULT_LOANS_INTRO_HEADING);
    expect(blueprintSource).not.toContain(DEFAULT_LOANS_INTRO_BODY_TEXT);
  });
});
