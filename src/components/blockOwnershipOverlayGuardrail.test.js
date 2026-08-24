import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('block ownership overlay guardrail', () => {
  it('keeps the shared blue ownership overlay system wired into the page editor surfaces', () => {
    const cssSource = readSource('../styles/front-hud.css');
    const nativePageSource = readSource('./NativeContentPage.jsx');
    const homeRendererSource = readSource('./blocks/PageBlocksRenderer.jsx');
    const loansSource = readSource('../pages/LoansPage.jsx');
    const servicesSource = readSource('../pages/ServicesPage.jsx');
    const investmentsSource = readSource('../pages/InvestmentsPage.jsx');
    const retirementSource = readSource('../pages/RetirementPage.jsx');
    const ctaSectionSource = readSource('./DynamicCtaSection.jsx');

    expect(cssSource).toContain('.is-admin-owned-drafted-other::after');
    expect(cssSource).toContain('.is-admin-owned-editing-other::after');
    expect(cssSource).toContain('/* A passive draft is available to inspect, not disabled. */');
    expect(cssSource).toContain('/* A historical save is context, not a blocking state. */');
    expect(cssSource).toContain('/* Ownership badges identify passive drafts');
    expect(cssSource).toMatch(/has-active-front-hud-panel[\s\S]*\.is-admin-owned-drafted-other:not\(.is-hud-focus-target\)::after[\s\S]*opacity: var\(--ag-admin-front-hud-dim-strength/);
    expect(cssSource).toMatch(/has-active-front-hud-panel[\s\S]*\.is-admin-owned-saved-other:not\(.is-hud-focus-target\)::after[\s\S]*opacity: var\(--ag-admin-front-hud-dim-strength/);
    expect(cssSource).toContain('box-shadow: inset 0 0 0 2px rgba(0, 138, 171, 0.58), inset 6px 0 0 #008aab;');
    expect(cssSource).toContain('box-shadow: inset 0 0 0 2px rgba(83, 103, 121, 0.46), inset 6px 0 0 #536779;');
    expect(cssSource).toContain('.admin-block-ownership-overlay');
    expect(cssSource).toContain('.admin-block-ownership-overlay-card');
    expect(cssSource).toContain('.admin-block-ownership-overlay-item');
    expect(cssSource).toMatch(/\.admin-block-ownership-overlay-item\s*\{[\s\S]*?border-radius: 999px;[\s\S]*?backdrop-filter: blur\(10px\);/);
    expect(cssSource).toMatch(/\.admin-front-hud-anchor-label\s*\{[\s\S]*?border-radius: 999px;[\s\S]*?backdrop-filter: blur\(10px\);/);
    expect(cssSource).toMatch(/\.admin-front-hud-anchor-icon\s*\{[\s\S]*?border-radius: 999px;[\s\S]*?backdrop-filter: blur\(8px\);/);
    expect(cssSource).toMatch(/\.admin-front-hud-dock-tab-icon\s*\{[\s\S]*?border-radius: 999px;[\s\S]*?backdrop-filter: blur\(8px\);/);
    expect(cssSource).toContain('padding: 2px 0.5rem;');
    expect(cssSource).toContain('margin-left: 0.3rem;');
    expect(cssSource).toContain('var(--admin-block-ownership-accent');
    expect(cssSource).toContain('.admin-block-ownership-overlay-item + .admin-block-ownership-overlay-item');
    expect(cssSource).toContain('.is-admin-hidden-block::after');
    expect(cssSource).toContain('rgba(231, 164, 38, 0.28)');

    expect(nativePageSource).toContain('BlockOwnershipOverlay');
    expect(nativePageSource).toContain('getOwnershipVisualForBlockId');
    expect(homeRendererSource).toContain('getBlockOwnershipVisual');
    expect(homeRendererSource).toContain('is-admin-hidden-block');
    expect(homeRendererSource).toContain('<BlockOwnershipOverlay ownership={ownership} />');
    expect(loansSource).toContain("ownership={getOwnershipVisualForBlockId('cta_form')}");
    expect(servicesSource).toContain("ownership={getOwnershipVisualForBlockId('cta_form')}");
    expect(investmentsSource).toContain("data-block-id=\"hero\"");
    expect(retirementSource).toContain("data-block-id=\"billboard\"");
    expect(ctaSectionSource).toContain('data-block-id={dynamicCtaBlock?.id || \'cta_form\'}');
  });

  it('keeps ownership overlays gated behind HUD-on checks on the main page canvas', () => {
    const nativePageSource = readSource('./NativeContentPage.jsx');
    const loansSource = readSource('../pages/LoansPage.jsx');
    const servicesSource = readSource('../pages/ServicesPage.jsx');
    const investmentsSource = readSource('../pages/InvestmentsPage.jsx');
    const retirementSource = readSource('../pages/RetirementPage.jsx');

    expect(nativePageSource).toContain('if (!showFrontHud || !editableBlockPath || !blockId) {');
    expect(loansSource).toContain('if (!showFrontHud || !blockId) {');
    expect(servicesSource).toContain('if (!showFrontHud || !blockId) {');
    expect(investmentsSource).toContain('if (!showFrontHud || !blockId) {');
    expect(retirementSource).toContain('if (!showFrontHud || !blockId) {');
  });

  it('keeps the HUD selector inside the viewport at tablet widths', () => {
    const cssSource = readSource('../styles/front-hud.css');

    expect(cssSource).toMatch(/\.admin-front-hud-dock\s*\{[\s\S]*?width: min\(220px, calc\(100vw - 24px\)\);[\s\S]*?max-width: calc\(100vw - 24px\);/);
    expect(cssSource).toMatch(/@media \(max-width: 1100px\) \{[\s\S]*?\.admin-front-hud-dock\s*\{[\s\S]*?overflow: visible;[\s\S]*?\}[\s\S]*?\.admin-front-hud-dock-tabs\s*\{[\s\S]*?overflow-x: hidden;/);
    expect(cssSource).toContain('/* The desktop hover lift can leave the scrollport at tablet widths. */');
    expect(cssSource).toMatch(/\.admin-front-hud-dock-tab:hover[\s\S]*?\.admin-front-hud-dock-tab\.is-drag-over\s*\{[\s\S]*?transform: none;/);
  });
});
