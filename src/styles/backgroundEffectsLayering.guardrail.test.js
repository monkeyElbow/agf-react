import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = readFileSync(path.resolve(__dirname, './service-native.css'), 'utf8');
const frontHudSource = readFileSync(path.resolve(__dirname, './front-hud.css'), 'utf8');

describe('background effects layering', () => {
  it('keeps overscan lights behind card surfaces without elevating whole rails', () => {
    expect(source).toContain('.block-background-effects {\n  position: absolute;\n  inset: 0;\n  z-index: 0;');
    expect(source).toContain('.block-background-effects {\n  position: absolute;\n  inset: 0;\n  z-index: 0;\n  pointer-events: none;');
    expect(source).toContain(':is(.service-native-section, .service-native-intro, .service-native-hero):not(.has-block-background-effects) {\n  position: relative;\n  z-index: 1;');
    expect(source).toContain('.has-block-background-effects > :is(.ag-panel-rail, .ag-panel-rail-wide) {\n  position: relative;\n  z-index: 1;');
    expect(source).toContain(
      '[data-block-id]:has(> .block-background-effects) > :is(.ag-panel-rail, .ag-panel-rail-wide)',
    );
    expect(source).toContain('.block-background-effects.is-uncropped {\n  /* Keep the authored edge-wash behavior, while cards remain above it. */\n  overflow: visible;\n  z-index: 0;');
    expect(source).toContain(':is(.service-native-section, .service-native-intro, .service-native-hero) .service-native-card,\n[data-block-id] .services-breakdown-panel {\n  position: relative;\n  z-index: 1;');
    expect(source).toContain('> :is(.ag-panel-rail, .ag-panel-rail-wide) {\n  z-index: auto;');
    expect(source).toContain('isolation: auto;\n  z-index: auto;');
    expect(frontHudSource).toContain(
      '.service-native-page:has(.block-background-effects.is-uncropped) :is(.service-native-hero, .service-native-intro, .service-native-section),\n.service-native-page:has(.block-background-effects.is-uncropped) [data-block-id] {\n  isolation: auto;\n  z-index: auto;',
    );
    expect(frontHudSource).toContain(
      '> :not(.block-background-effects) {\n  position: relative;\n  z-index: 1;',
    );
    expect(frontHudSource).toContain(
      '> :is(.ag-panel-rail, .ag-panel-rail-wide) {\n  z-index: auto;',
    );
    expect(frontHudSource).toContain(
      '.service-native-page:has(.block-background-effects.is-uncropped)\n  :is(.native-dynamic-page-content, .test-dynamic-page-content) {\n  position: relative;\n  z-index: 1;\n  background-color: #fff;',
    );
    expect(frontHudSource).toContain(
      '.service-native-page:has(.block-background-effects.is-uncropped)\n  .native-dynamic-page-content.retirement-individual-enrollment-return {\n  background-color: transparent;',
    );
    expect(frontHudSource).toContain(
      '.service-native-page:has(.block-background-effects.is-uncropped)\n  .native-dynamic-page-content.retirement-individual-enrollment-qualify-disclosure {\n  background-color: transparent;',
    );
    expect(frontHudSource).toMatch(
      /\.is-front-hud-docked \.admin-front-hud-tool\.is-docked \{[\s\S]*?z-index: 2000;/,
    );
  });
});
