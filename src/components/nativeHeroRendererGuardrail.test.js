import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native hero renderer guardrail', () => {
  it('keeps the shared dynamic hero builder in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');
    const runtimeSource = readSource('../lib/dynamicPageBlocks.js');
    const stylesSource = readSource('../styles/service-native.css');

    expect(source).toContain('buildDynamicHeroFromBlock,');
    expect(source).toContain('parseTextHighlights,');
    expect(source).toContain('renderTextWithHighlights,');
    expect(source).toContain("from '../lib/dynamicPageBlocks';");
    expect(source).toContain('resolveHeroLineDisplayClassName,');
    expect(source).toContain('if (isTestPage) {');
    expect(source).toContain('const adminHero = buildDynamicHeroFromBlock(heroBlock);');
    expect(source).toContain('function buildTestDynamicHero(block) {');
    expect(source).toContain('const runtime = buildDynamicHeroFromBlock(block);');
    expect(source).toContain('const heroBlock = findVisibleDynamicBlockByKind(visibleBlocks, \'hero\');');
    expect(source).toContain('const adminHero = buildTestDynamicHero(heroBlock);');
    expect(source).toContain('const renderedHero = dynamicHeroBlock');
    expect(source).toContain('const renderedDynamicHero = useMemo(');
    expect(source).toContain('buildDynamicHeroFromBlock({');
    expect(source).toContain('const renderedHeroBgTone = normalizeHeroBgTone(renderedHero?.bgTone);');
    expect(source).toContain('const renderedHeroJustify = normalizeHeroJustify(renderedHero?.justify);');
    expect(source).toContain('actions: Array.isArray(renderedDynamicHero?.actions)');
    expect(source).toContain('renderedDynamicHero.actions.map((action) => toNativeActionItem(action)).filter(Boolean)');
    expect(source).toContain('className={`service-native-hero is-bg-${renderedHeroBgTone} is-justify-${renderedHeroJustify}');
    expect(source).toContain('resolveHeroLineDisplayClassName(');
    expect(source).toContain('renderedHeroBgTone,');
    expect(source).toContain('HeroTitle hero={renderedHero || { title: page.title }}');
    expect(source).not.toContain('function buildTestDynamicHero(block, resolvePathFromRef) {');
    expect(runtimeSource).toContain('function resolveDynamicHeroLineHighlights(settings, lineNumber) {');
    expect(runtimeSource).toContain('highlights: resolveDynamicHeroLineHighlights(settings, lineNumber),');
    expect(stylesSource).toContain('.service-native-page.native-info-page .service-native-hero h1.is-mango');
    expect(stylesSource).toContain('.service-native-page.native-info-page .service-native-hero h1.is-sandstone');
    expect(stylesSource).toContain('.service-native-page.native-info-page .service-native-hero h1.is-white');
  });
});
