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
    const source = readSource('./HomePage.jsx');

    expect(source).toContain("const HOME_SERVICES_FEATURE_HUD_PANEL_ID = 'home-services-feature-animation';");
    expect(source).toContain('home_services_feature_animation: HOME_SERVICES_FEATURE_HUD_PANEL_ID,');
    expect(source).toContain("home_services_feature_animation: '[data-block-id=\"home_services_feature_animation\"]',");
    expect(source).toContain('const managedHomeServicesFeatureBlock = useMemo(() => (');
    expect(source).toContain("block?.id === 'home_services_feature_animation'");
    expect(source).toContain('const dynamicHomeServicesFeatureBlock = managedHomeServicesFeatureBlock?.mode === \'dynamic\'');
    expect(source).toContain("const HOME_SERVICES_GRID_HUD_PANEL_ID = 'home-services-grid';");
    expect(source).toContain("services_grid: HOME_SERVICES_GRID_HUD_PANEL_ID,");
    expect(source).toContain("services_grid: '[data-block-id=\"services_grid\"]',");
    expect(source).toContain('const dynamicServicesGridBlock = useMemo(() => (');
    expect(source).toContain("block?.id === 'services_grid'");
    expect(source).toContain("block?.kind === 'services_grid'");
    expect(source).toContain('const servicesGridManagedBlock = dynamicServicesGridBlock;');
    expect(source).toContain('const homeServicesFeatureIsActive = Boolean(dynamicHomeServicesFeatureBlock || !homeServicesFeatureManagedBlock);');
    expect(source).toContain("if (block.type === 'site_feature' && block.id === 'home_services_feature_animation') {");
    expect(source).toContain("featureId: String(block.featureId || 'home_services_feature_animation').trim() || 'home_services_feature_animation',");
    expect(source).toContain('if (block.type === \'services_grid\' && servicesGridSettings) {');
    expect(source).toContain('if (homeServicesFeatureIsActive) {');
    expect(source).toContain("id: servicesGridManagedBlock?.id || block.id || 'services_grid',");
    expect(source).toContain("kind: servicesGridManagedBlock?.kind || block.kind || 'services_grid',");
  });
});
