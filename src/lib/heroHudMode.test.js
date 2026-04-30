import { describe, expect, it } from 'vitest';
import { isHeroHudPanelActive, shouldRenderHeroInlineEditor } from './heroHudMode';

describe('hero HUD mode guardrails', () => {
  it('treats only the matching hero panel as active', () => {
    expect(isHeroHudPanelActive('hero-main', 'hero-main')).toBe(true);
    expect(isHeroHudPanelActive('intro-main', 'hero-main')).toBe(false);
    expect(isHeroHudPanelActive('', 'hero-main')).toBe(false);
    expect(isHeroHudPanelActive('hero-main', '')).toBe(false);
  });

  it('allows inline hero editing only for the active hero panel', () => {
    expect(shouldRenderHeroInlineEditor({
      hudEnabled: true,
      hasDynamicHero: true,
      activeHudPanelId: 'hero-main',
      heroHudPanelId: 'hero-main',
    })).toBe(true);

    expect(shouldRenderHeroInlineEditor({
      hudEnabled: true,
      hasDynamicHero: true,
      activeHudPanelId: 'intro-main',
      heroHudPanelId: 'hero-main',
    })).toBe(false);

    expect(shouldRenderHeroInlineEditor({
      hudEnabled: true,
      hasDynamicHero: false,
      activeHudPanelId: 'hero-main',
      heroHudPanelId: 'hero-main',
    })).toBe(false);

    expect(shouldRenderHeroInlineEditor({
      hudEnabled: false,
      hasDynamicHero: true,
      activeHudPanelId: 'hero-main',
      heroHudPanelId: 'hero-main',
    })).toBe(false);
  });
});
