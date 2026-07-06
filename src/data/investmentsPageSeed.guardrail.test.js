import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import {
  defaultInvestmentsCtaSettings,
  defaultInvestmentsGrowthFeatureSettings,
} from './investmentsPageSeed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('investments page seed guardrail', () => {
  it('keeps investments growth feature and CTA defaults aligned to shared page seeds', () => {
    const blocks = contentBlockBlueprintsByPath['/services/investments'] || [];
    const growthBlock = blocks.find((block) => block?.id === 'growth_feature' && block?.kind === 'site_feature');
    const ctaBlock = blocks.find((block) => block?.id === 'cta_form' && block?.kind === 'cta_form');

    expect(growthBlock?.settings).toEqual(defaultInvestmentsGrowthFeatureSettings);
    expect(ctaBlock?.settings?.title).toBe(defaultInvestmentsCtaSettings.title);
    expect(ctaBlock?.settings?.bodyHtml).toBe(defaultInvestmentsCtaSettings.bodyHtml);
    expect(ctaBlock?.settings?.submitLabel).toBe(defaultInvestmentsCtaSettings.submitLabel);
    expect(ctaBlock?.settings?.field4Placeholder).toBe(defaultInvestmentsCtaSettings.field4Placeholder);
  });

  it('keeps InvestmentsPage on the shared investments page seeds instead of local default objects', () => {
    const pageSource = readSource('../pages/InvestmentsPage.jsx');

    expect(pageSource).toContain("from '../data/investmentsPageSeed'");
    expect(pageSource).not.toContain("const defaultInvestmentsCtaSettings = {");
    expect(pageSource).not.toContain("const defaultInvestmentsGrowthFeatureSettings = {");
  });
});
