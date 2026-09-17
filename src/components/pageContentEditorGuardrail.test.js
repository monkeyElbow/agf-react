import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Page Content editor guardrails', () => {
  it('keeps body, address, layout, and background pages mutually exclusive', () => {
    const source = readFileSync(path.resolve(__dirname, '../styles/front-hud.css'), 'utf8');

    expect(source).toContain('.admin-front-hud-page-content-editor.is-section-address');
    expect(source).toContain('.admin-front-hud-page-content-editor.is-section-background');
    expect(source).toContain('.admin-front-hud-page-content-address-panel');
    expect(source).toContain('.admin-front-hud-page-content-background-panel');
    expect(source).toContain('.admin-front-hud-page-content-layout-panel');
  });

  it('keeps fine print and address data out of the body HTML source', () => {
    const source = readFileSync(path.resolve(__dirname, '../lib/pageContentEditorHtml.js'), 'utf8');

    expect(source).toContain('getPageContentBodyEditorHtml');
    expect(source).toContain('hasLegacyPageContentBodySource');
    expect(source).not.toMatch(/const fineprintHtml = pageContentLinesToHtml\(settings\.fineprint\)/);
    expect(source).not.toMatch(/const addressTitle = String\(settings\.addressTitle/);
  });
});
