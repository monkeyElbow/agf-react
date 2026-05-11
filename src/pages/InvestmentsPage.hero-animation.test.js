import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('InvestmentsPage fallback hero animation', () => {
  it('applies the third-step animation class to the fallback third line', () => {
    const filePath = path.resolve(process.cwd(), 'src/pages/InvestmentsPage.jsx');
    const source = fs.readFileSync(filePath, 'utf8');

    expect(source).toContain("heroAnimationClassForLine('loans-unblur', 1)");
    expect(source).toContain("heroAnimationClassForLine('loans-unblur', 2)");
    expect(source).toContain("heroAnimationClassForLine('loans-unblur', 3)");
    expect(source).toContain('<h1 className={`line3 ${heroAnimationClassForLine(\'loans-unblur\', 3)}`}>');
  });

  it('preserves animationPreset from heroBlock.settings when heroHudSettings drops it', () => {
    const filePath = path.resolve(process.cwd(), 'src/pages/InvestmentsPage.jsx');
    const source = fs.readFileSync(filePath, 'utf8');

    expect(source).toContain('animationPreset: heroHudSettings.animationPreset || heroBlock.settings?.animationPreset');
  });
});

