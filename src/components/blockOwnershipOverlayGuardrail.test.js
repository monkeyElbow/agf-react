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
    expect(cssSource).toContain('.admin-block-ownership-overlay');
    expect(cssSource).toContain('.admin-block-ownership-overlay-card');

    expect(nativePageSource).toContain('BlockOwnershipOverlay');
    expect(nativePageSource).toContain('getOwnershipVisualForBlockId');
    expect(homeRendererSource).toContain('getBlockOwnershipVisual');
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
});
