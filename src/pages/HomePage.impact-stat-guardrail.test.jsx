import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home page impact stat guardrail', () => {
  it('keeps the live home impact stat block on the managed HUD and dynamic override path', () => {
    const source = readSource('./HomePage.jsx');

    expect(source).toContain("const HOME_IMPACT_STAT_HUD_PANEL_ID = 'home-impact-stat';");
    expect(source).toContain("impact_stat: HOME_IMPACT_STAT_HUD_PANEL_ID,");
    expect(source).toContain("impact_stat: '[data-block-id=\"impact_stat\"]',");
    expect(source).toContain('const dynamicImpactStatBlock = useMemo(() => (');
    expect(source).toContain("block?.id === 'impact_stat'");
    expect(source).toContain("block?.kind === 'impact_stat'");
    expect(source).toContain('const impactStatManagedBlock = dynamicImpactStatBlock;');
    expect(source).toContain('if (block.type === \'impact_stat\' && impactStatSettings) {');
    expect(source).toContain("id: impactStatManagedBlock?.id || block.id || 'impact_stat',");
    expect(source).toContain("kind: impactStatManagedBlock?.kind || block.kind || 'impact_stat',");
  });
});
