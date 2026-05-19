import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('hero text overflow guardrails', () => {
  it('keeps long-token wrapping scoped to home hero, native hero, and shared HUD hero selectors', () => {
    const homeStyles = readSource('../styles/home-native.css');
    const serviceStyles = readSource('../styles/service-native.css');

    expect(homeStyles).toContain('.home-native-hero .ag-panel-rail {\n  min-width: 0;\n}');
    expect(homeStyles).toContain('.home-native-hero :is(.home-native-eyebrow, .home-native-title) {\n  max-width: 100%;\n  min-width: 0;\n  overflow-wrap: anywhere;\n  word-break: normal;\n}');

    expect(serviceStyles).toContain('.service-native-hero .ag-panel-rail {\n  min-height: var(--service-native-hero-rail-min-height);\n  display: grid;\n  align-content: center;\n  justify-items: center;\n  min-width: 0;\n}');
    expect(serviceStyles).toContain('  max-width: 100%;\n  min-width: 0;\n  text-align: center;\n  text-wrap: balance;\n  overflow-wrap: anywhere;\n}');
    expect(serviceStyles).toContain('.admin-front-hud-hero-live-editor {\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n}');
    expect(serviceStyles).toContain('.admin-front-hud-hero-live-line {\n  position: relative;\n  display: grid;\n  max-width: 100%;\n  min-width: 0;\n  min-height: 0;\n}');
    expect(serviceStyles).toContain('.admin-front-hud-hero-live-line > :is(h1, h2, h3, h4, p),\n.admin-front-hud-hero-live-input {\n  grid-area: 1 / 1;\n  box-sizing: border-box;\n  max-width: 100%;\n  min-width: 0;\n  overflow-wrap: anywhere;\n}');
    expect(serviceStyles).toContain('  text-wrap: balance;\n  white-space: pre-wrap;\n  word-break: normal;\n  resize: none;\n  overflow: hidden;\n}');
    expect(serviceStyles).not.toContain('h1,\nh2,\nh3,\nh4,\np {\n  overflow-wrap: anywhere;');
  });
});
