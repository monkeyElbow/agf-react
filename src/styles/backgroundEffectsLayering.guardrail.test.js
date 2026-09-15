import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = readFileSync(path.resolve(__dirname, './service-native.css'), 'utf8');
const frontHudSource = readFileSync(path.resolve(__dirname, './front-hud.css'), 'utf8');

describe('background effects layering', () => {
  it('lets an uncropped light bridge the next block while keeping authored content above it', () => {
    expect(source).toContain('.block-background-effects {\n  position: absolute;\n  inset: 0;\n  z-index: 0;');
    expect(source).toContain(':is(.service-native-section, .service-native-intro, .service-native-hero):not(.has-block-background-effects) {\n  position: relative;\n  z-index: 1;');
    expect(source).toContain('.has-block-background-effects > :is(.ag-panel-rail, .ag-panel-rail-wide) {\n  position: relative;\n  z-index: 1;');
    expect(source).toContain(
      '[data-block-id]:has(> .block-background-effects) > :is(.ag-panel-rail, .ag-panel-rail-wide)',
    );
    expect(source).toContain(
      ':is(.service-native-section, .service-native-intro, .service-native-hero):has(> .block-background-effects.is-uncropped),\n[data-block-id]:has(> .block-background-effects.is-uncropped) {\n  isolation: auto;',
    );
    expect(source).toContain(
      '.service-native-page:has(.block-background-effects.is-uncropped) :is(.service-native-section, .service-native-intro, .service-native-hero) > :is(.ag-panel-rail, .ag-panel-rail-wide),',
    );
    expect(source).toContain('.block-background-effects.is-uncropped {\n  overflow: visible;\n  z-index: 2;');
    expect(frontHudSource).toContain(
      '.service-native-page:has(.block-background-effects.is-uncropped) :is(.service-native-hero, .service-native-intro, .service-native-section) {\n  isolation: auto;\n  z-index: auto;',
    );
    expect(frontHudSource).toMatch(
      /\.is-front-hud-docked \.admin-front-hud-tool\.is-docked \{[\s\S]*?z-index: 2000;/,
    );
    expect(frontHudSource).toContain(
      '.service-native-page:has(.block-background-effects.is-uncropped) :is(.service-native-hero, .service-native-intro, .service-native-section) > :is(.ag-panel-rail, .ag-panel-rail-wide),',
    );
  });
});
