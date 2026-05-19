import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('InvestmentsPage fallback hero animation', () => {
  it('keeps the fallback investments hero off the loans-only unblur animation classes', () => {
    const filePath = path.resolve(process.cwd(), 'src/pages/InvestmentsPage.jsx');
    const source = fs.readFileSync(filePath, 'utf8');

    expect(source).toContain("heroAnimationClassForLine(INVESTMENTS_HERO_ANIMATION_PRESET, 1)");
    expect(source).toContain("heroAnimationClassForLine(INVESTMENTS_HERO_ANIMATION_PRESET, 2)");
    expect(source).toContain("heroAnimationClassForLine(INVESTMENTS_HERO_ANIMATION_PRESET, 3)");
    expect(source).not.toContain("heroAnimationClassForLine('loans-unblur', 1)");
    expect(source).not.toContain("heroAnimationClassForLine('loans-unblur', 2)");
    expect(source).not.toContain("heroAnimationClassForLine('loans-unblur', 3)");
  });

  it('preserves animationPreset from heroBlock.settings when heroHudSettings drops it', () => {
    const filePath = path.resolve(process.cwd(), 'src/pages/InvestmentsPage.jsx');
    const source = fs.readFileSync(filePath, 'utf8');

    expect(source).toContain('animationPreset: resolveInvestmentsHeroAnimationPreset(');
  });

  it('coerces stale investments hero presets back to the managed non-loans preset', () => {
    const filePath = path.resolve(process.cwd(), 'src/pages/InvestmentsPage.jsx');
    const source = fs.readFileSync(filePath, 'utf8');

    expect(source).toContain("const INVESTMENTS_HERO_ANIMATION_PRESET = getHeroSeedContract('/services/investments')?.animationPreset || 'default';");
    expect(source).toContain("if (!normalized || normalized === 'default' || normalized === 'loans-unblur') {");
  });
});
