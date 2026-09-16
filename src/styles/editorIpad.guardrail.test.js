import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontHudCss = readFileSync(path.resolve(__dirname, './front-hud.css'), 'utf8');

describe('iPad HUD editor interaction guardrails', () => {
  it('keeps touch editor rules separate from the mouse layout', () => {
    expect(frontHudCss).toContain('@media (hover: none) and (pointer: coarse) and (min-width: 700px) and (max-width: 1400px) {');
    expect(frontHudCss).toContain('.admin-hud-editor-shared-surface .admin-html-editor-controls.is-inline {');
    expect(frontHudCss).toContain('overflow-y: hidden;');
  });

  it('prevents Billboard copy toolbars from escaping their surface', () => {
    expect(frontHudCss).toMatch(
      /\.admin-hud-editor-shared-surface \.admin-billboard-editor-copy-fields \{[\s\S]*?overflow: hidden;/,
    );
  });

  it('gives iPad editors usable touch hit areas for rails, fields, sliders, and swatches', () => {
    expect(frontHudCss).toContain('width: 44px;');
    expect(frontHudCss).toContain('min-height: 38px;');
    expect(frontHudCss).toContain('min-height: 30px !important;');
    expect(frontHudCss).toContain('height: 30px !important;');
  });
});
