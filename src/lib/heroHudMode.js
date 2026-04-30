export function isHeroHudPanelActive(activeHudPanelId, heroHudPanelId) {
  const activeId = String(activeHudPanelId || '').trim();
  const heroId = String(heroHudPanelId || '').trim();
  return Boolean(activeId && heroId && activeId === heroId);
}

export function shouldRenderHeroInlineEditor({
  hudEnabled,
  hasDynamicHero,
  activeHudPanelId,
  heroHudPanelId,
}) {
  return Boolean(hudEnabled && hasDynamicHero && isHeroHudPanelActive(activeHudPanelId, heroHudPanelId));
}
