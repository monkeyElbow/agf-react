import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';
import {
  buildDefaultRetirementBillboardRuntime,
  buildDefaultRetirementIntroRuntime,
  buildDefaultRetirementRolloverBillboardRuntime,
  DEFAULT_RETIREMENT_BILLBOARD_TITLE,
  DEFAULT_RETIREMENT_INTRO_BODY_TEXT,
  DEFAULT_RETIREMENT_INTRO_HEADING,
  DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD_TITLE,
} from './retirementOverviewSeed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('retirement overview seed guardrail', () => {
  it('keeps retirement overview intro and billboards owned by editable blocks with shared runtime fallbacks', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement'] || [];
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro');
    const billboardBlock = blocks.find((block) => block?.id === 'billboard' && block?.kind === 'billboard');
    const rolloverBlock = blocks.find((block) => block?.id === 'rollover_billboard' && block?.kind === 'billboard');
    const nativeIntro = getNativePageContent('/services/retirement', 'Retirement')?.intro;
    const runtimeIntro = buildDefaultRetirementIntroRuntime();
    const runtimeBillboard = buildDefaultRetirementBillboardRuntime();
    const runtimeRolloverBillboard = buildDefaultRetirementRolloverBillboardRuntime();

    expect(introBlock).toMatchObject({ mode: 'dynamic' });
    expect(billboardBlock).toMatchObject({ mode: 'dynamic' });
    expect(rolloverBlock).toMatchObject({ mode: 'dynamic' });
    expect(nativeIntro).toBeUndefined();
    expect(String(runtimeIntro.heading || '')).not.toBe('');
    expect(String(runtimeIntro.bodyHtml || '')).not.toBe('');
    expect(String(runtimeBillboard.title || '')).not.toBe('');
    expect(String(runtimeRolloverBillboard.title || '')).not.toBe('');
  });

  it('keeps RetirementPage and blueprints on the shared retirement overview seeds instead of page-local editorial fallbacks', () => {
    const pageSource = readSource('../pages/RetirementPage.jsx');
    const blueprintSource = readSource('./contentBlockBlueprints.js');

    expect(pageSource).toContain("from '../data/retirementOverviewSeed'");
    expect(blueprintSource).toContain("from './retirementOverviewSeed'");
    expect(pageSource).not.toContain(DEFAULT_RETIREMENT_INTRO_HEADING);
    expect(pageSource).not.toContain(DEFAULT_RETIREMENT_INTRO_BODY_TEXT);
    expect(pageSource).not.toContain(DEFAULT_RETIREMENT_BILLBOARD_TITLE);
    expect(pageSource).not.toContain(DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD_TITLE);
  });
});
