import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import {
  buildDefaultServicesIntroRuntime,
  buildDefaultServicesNativeIntro,
  defaultServicesIntroBillboardSettings,
  DEFAULT_SERVICES_INTRO_HEADING,
  DEFAULT_SERVICES_INTRO_HIGHLIGHTS,
} from './servicesOverviewSeed';
import { getNativePageContent } from './nativePageContent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('services overview seed guardrail', () => {
  it('keeps blueprint defaults, native route seed, and runtime fallback aligned to one canonical services intro seed', () => {
    const introBlock = contentBlockBlueprintsByPath['/services']?.find((block) => block?.id === 'intro' && block?.kind === 'billboard');
    const nativeIntro = getNativePageContent('/services', 'Services')?.intro;
    const runtimeIntro = buildDefaultServicesIntroRuntime();

    expect(introBlock?.settings).toEqual(defaultServicesIntroBillboardSettings);
    expect(nativeIntro).toEqual(buildDefaultServicesNativeIntro());
    expect(runtimeIntro.heading).toBe(DEFAULT_SERVICES_INTRO_HEADING);
    expect(runtimeIntro.headingHighlights).toEqual(DEFAULT_SERVICES_INTRO_HIGHLIGHTS);
    expect(nativeIntro?.heading).toBe(DEFAULT_SERVICES_INTRO_HEADING);
    expect(nativeIntro?.headingHighlights).toEqual(DEFAULT_SERVICES_INTRO_HIGHLIGHTS);
  });

  it('keeps ServicesPage on the shared intro seed instead of page-local editorial fallback markup', () => {
    const pageSource = readSource('../pages/ServicesPage.jsx');
    const blueprintSource = readSource('./contentBlockBlueprints.js');

    expect(pageSource).toContain("from '../data/servicesOverviewSeed'");
    expect(blueprintSource).toContain("from './servicesOverviewSeed'");
    expect(pageSource).not.toContain(DEFAULT_SERVICES_INTRO_HEADING);
    expect(blueprintSource).not.toContain(DEFAULT_SERVICES_INTRO_HEADING);
  });
});
