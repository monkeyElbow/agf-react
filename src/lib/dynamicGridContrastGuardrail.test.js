import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('dynamic grid contrast guardrail', () => {
  it('keeps shared dark-background contrast correction on the migrated grid family path', () => {
    const helperSource = readSource('./dynamicGrid.js');
    const runtimeSource = readSource('./dynamicPageBlocks.js');
    const editorSource = readSource('../components/block-editors/migratedBlockEditors.jsx');
    const definitionSource = readSource('../blocks/definitions/cardGrid.definition.js');

    expect(helperSource).toContain("export function getGridDefaultToneForBg(bgTone)");
    expect(helperSource).toContain("'super-grey': new Set(['white', 'sand', 'sandstone'])");
    expect(helperSource).toContain("return normalizedBgTone === 'blue' || normalizedBgTone === 'grey' ? 'white' : 'super-grey';");

    expect(runtimeSource).toContain('const titleTone = normalizeGridToneToken(');
    expect(runtimeSource).toContain('Background and card-title color are separate authored controls.');
    expect(runtimeSource).toContain("const bodyTone = getGridSafeToneForBg(settings.bodyTone, bgTone, 'super-grey');");

    expect(editorSource).toContain('const titleToneField = titleToneFieldBase;');
    expect(editorSource).toContain('const bodyToneField = bodyToneFieldBase;');
    expect(editorSource).toContain("onSettingChange('bgTone', nextBgTone);");
    expect(editorSource).not.toContain("onSettingChange('titleTone', getGridSafeToneForBg(settings.titleTone, nextBgTone");
    expect(editorSource).not.toContain("onSettingChange('bodyTone', getGridSafeToneForBg(settings.bodyTone, nextBgTone");
    expect(definitionSource).not.toContain("'atlantean-dark'");
  });
});
