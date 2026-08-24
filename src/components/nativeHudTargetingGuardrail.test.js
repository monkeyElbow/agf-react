import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native HUD targeting guardrail', () => {
  it('keeps native HUD block selection and section targeting on block-instance identities', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('function findVisibleDynamicBlockByKind(blocks, kind) {');
    expect(source).toContain('const hudDockPanels = useMemo(');
    expect(source).toContain('const hudPanelByBlockId = useMemo(() => (');
    expect(source).toContain('const firstDynamicSectionIndexByBlockId = useMemo(() => {');
    expect(source).toContain('const dynamicSectionPanel = dynamicSectionBlockId ? (renderHudPanelByBlockId[dynamicSectionBlockId] || null) : null;');
    expect(source).toContain('activeHudBlockId === dynamicSectionBlockId');
    expect(source).toContain('dynamicHudSectionRefs.current[dynamicSectionBlockId] = node;');
    expect(source).toContain('const fallbackSelector = String(panel?.anchorSelector || \'\').trim();');
    expect(source).not.toContain("const dynamicGridBlock = findVisibleDynamicBlockByKind(visibleEditablePageBlocks, 'card_grid');");
    expect(source).not.toContain('const firstDynamicSectionIndexByHudPanel = useMemo(() => {');
    expect(source).not.toContain('const panelId = getDynamicSectionHudPanelId(section);');
    expect(source).not.toContain('const fallbackSelector = NATIVE_HUD_FALLBACK_SELECTORS_BY_PANEL_ID[panelId]');
    expect(source).not.toContain("const dynamicHeroBlock = visibleEditablePageBlocks.find((block) => block?.id === 'hero' && block?.mode === 'dynamic') || null;");
    expect(source).not.toContain("return section?.id === 'dynamic-cta-form' || className.includes('dynamic-cta');");
  });
});
