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
    const pageSource = readSource('./HomePage.jsx');
    const resolverSource = readSource('../lib/homeBlockResolver.js');

    expect(pageSource).toContain("const HOME_IMPACT_STAT_HUD_PANEL_ID = 'home-impact-stat';");
    expect(pageSource).toContain("impact_stat: HOME_IMPACT_STAT_HUD_PANEL_ID,");
    expect(pageSource).toContain("impact_stat: '[data-block-id=\"impact_stat\"]',");
    expect(pageSource).toContain('const dynamicImpactStatBlock = useMemo(() => (');
    expect(pageSource).toContain("block?.id === 'impact_stat'");
    expect(pageSource).toContain("block?.kind === 'impact_stat'");
    expect(pageSource).toContain('impactStatManagedBlock: dynamicImpactStatBlock,');
    expect(resolverSource).toContain("id: context.impactStatManagedBlock?.id || block.id || 'impact_stat',");
    expect(resolverSource).toContain("kind: context.impactStatManagedBlock?.kind || block.kind || 'impact_stat',");
    expect(resolverSource).toContain("mode: context.impactStatManagedBlock?.mode || block.mode || 'static',");
  });
});
