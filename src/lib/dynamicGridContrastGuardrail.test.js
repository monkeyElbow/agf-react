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

    expect(helperSource).toContain("export function getGridDefaultToneForBg(bgTone)");
    expect(helperSource).toContain("'super-grey': new Set(['white', 'sand'])");
    expect(helperSource).toContain("return normalizedBgTone === 'blue' || normalizedBgTone === 'grey' ? 'white' : 'super-grey';");

    expect(runtimeSource).toContain("const titleTone = getGridSafeToneForBg(settings.titleTone, bgTone, 'super-grey');");
    expect(runtimeSource).toContain("const bodyTone = getGridSafeToneForBg(settings.bodyTone, bgTone, 'super-grey');");

    expect(editorSource).toContain("const nextTitleTone = getGridSafeToneForBg(settings.titleTone, gridBgTone, 'super-grey', titleToneFieldBase.options);");
    expect(editorSource).toContain("const nextBodyTone = getGridSafeToneForBg(settings.bodyTone, gridBgTone, 'super-grey', bodyToneFieldBase.options);");
    expect(editorSource).toContain("onSettingChange('titleTone', getGridSafeToneForBg(settings.titleTone, nextBgTone, 'super-grey', titleToneFieldBase.options));");
    expect(editorSource).toContain("onSettingChange('bodyTone', getGridSafeToneForBg(settings.bodyTone, nextBgTone, 'super-grey', bodyToneFieldBase.options));");
  });
});
