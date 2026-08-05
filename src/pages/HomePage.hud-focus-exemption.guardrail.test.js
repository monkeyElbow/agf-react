import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home page HUD focus exemption guardrail', () => {
  it('keeps managed home services and impact blocks exempt from the shared dim overlay when their HUD is active', () => {
    const source = readSource('../styles/front-hud.css');

    expect(source).toContain('.home-native-page.has-active-front-hud-panel :is(');
    expect(source).toContain('.home-services-feature,');
    expect(source).toContain('.home-native-services,');
    expect(source).toContain('.home-native-impact,');
    expect(source).toContain('.home-native-page.has-active-front-hud-panel.hud-focus-home-services-feature-animation [data-block-id="home_services_feature_animation"],');
    expect(source).toContain('.home-native-page.has-active-front-hud-panel.hud-focus-home-services-grid [data-block-id="services_grid"],');
    expect(source).toContain('.home-native-page.has-active-front-hud-panel.hud-focus-home-impact-stat [data-block-id="impact_stat"] {');
    expect(source).toContain('.home-native-page.has-active-front-hud-panel.hud-focus-home-services-feature-animation [data-block-id="home_services_feature_animation"]::after,');
    expect(source).toContain('.home-native-page.has-active-front-hud-panel.hud-focus-home-services-grid [data-block-id="services_grid"]::after,');
    expect(source).toContain('.home-native-page.has-active-front-hud-panel.hud-focus-home-impact-stat [data-block-id="impact_stat"]::after {');
  });
});
