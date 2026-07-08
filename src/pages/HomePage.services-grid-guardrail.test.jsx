import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home page services grid guardrail', () => {
  it('keeps the live home services grid on the managed HUD and dynamic override path', () => {
    const pageSource = readSource('./HomePage.jsx');
    const resolverSource = readSource('../lib/homeBlockResolver.js');

    expect(pageSource).toContain("const HOME_SERVICES_FEATURE_HUD_PANEL_ID = 'home-services-feature-animation';");
    expect(pageSource).toContain('home_services_feature_animation: HOME_SERVICES_FEATURE_HUD_PANEL_ID,');
    expect(pageSource).toContain("home_services_feature_animation: '[data-block-id=\"home_services_feature_animation\"]',");
    expect(pageSource).toContain('const managedHomeServicesFeatureBlock = useMemo(() => (');
    expect(pageSource).toContain("block?.id === 'home_services_feature_animation'");
    expect(pageSource).toContain("const HOME_SERVICES_GRID_HUD_PANEL_ID = 'home-services-grid';");
    expect(pageSource).toContain("services_grid: HOME_SERVICES_GRID_HUD_PANEL_ID,");
    expect(pageSource).toContain("services_grid: '[data-block-id=\"services_grid\"]',");
    expect(pageSource).toContain('const dynamicServicesGridBlock = useMemo(() => (');
    expect(pageSource).toContain("block?.id === 'services_grid'");
    expect(pageSource).toContain("block?.kind === 'services_grid'");
    expect(pageSource).toContain('servicesGridManagedBlock: dynamicServicesGridBlock,');
    expect(pageSource).toContain('homeServicesFeatureIsActive: Boolean(dynamicHomeServicesFeatureBlock || !managedHomeServicesFeatureBlock),');
    expect(resolverSource).toContain("id: context.servicesGridManagedBlock?.id || block.id || 'services_grid',");
    expect(resolverSource).toContain("kind: context.servicesGridManagedBlock?.kind || block.kind || 'services_grid',");
    expect(resolverSource).toContain("mode: context.servicesGridManagedBlock?.mode || block.mode || 'static',");
  });
});
