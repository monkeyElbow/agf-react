import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import {
  buildDefaultServicesIntroRuntime,
  DEFAULT_SERVICES_INTRO_HEADING,
} from './servicesOverviewSeed';
import { getNativePageContent } from './nativePageContent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('services overview seed guardrail', () => {
  it('keeps the services intro owned by an editable block and a shared runtime fallback', () => {
    const introBlock = contentBlockBlueprintsByPath['/services']?.find((block) => block?.id === 'intro' && block?.kind === 'billboard');
    const nativeIntro = getNativePageContent('/services', 'Services')?.intro;
    const runtimeIntro = buildDefaultServicesIntroRuntime();

    expect(introBlock).toMatchObject({ mode: 'dynamic' });
    expect(nativeIntro).toBeUndefined();
    expect(String(runtimeIntro.heading || '')).not.toBe('');
  });

  it('keeps ServicesPage on the shared intro seed instead of page-local editorial fallback markup', () => {
    const pageSource = readSource('../pages/ServicesPage.jsx');
    const blueprintSource = readSource('./contentBlockBlueprints.js');

    expect(pageSource).toContain("from '../data/servicesOverviewSeed'");
    expect(blueprintSource).toContain("from './servicesOverviewSeed'");
    expect(pageSource).toContain(') : resolvedIntro.body ? (');
    expect(pageSource).not.toContain('{resolvedIntro.body ? <p>{resolvedIntro.body}</p> : null}');
    expect(pageSource).not.toContain(DEFAULT_SERVICES_INTRO_HEADING);
    expect(blueprintSource).not.toContain(DEFAULT_SERVICES_INTRO_HEADING);
  });
});
