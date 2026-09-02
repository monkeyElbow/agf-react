import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const editorSource = readFileSync(path.resolve(__dirname, './block-editors/migratedBlockEditors.jsx'), 'utf8');
const definitionSource = readFileSync(path.resolve(__dirname, '../blocks/definitions/cardGrid.definition.js'), 'utf8');

describe('card-grid editor wiring', () => {
  it('keeps subtitle swatches in subtitle editor and body tone in appearance', () => {
    const headerStart = editorSource.indexOf('function CardGridHeaderEditor');
    const headerEnd = editorSource.indexOf('function CardGridButtonEditor', headerStart);
    const headerSource = editorSource.slice(headerStart, headerEnd);
    const gridStart = editorSource.indexOf('export function GridBlockEditor');
    const gridEnd = editorSource.indexOf('export function', gridStart + 1);
    const gridSource = editorSource.slice(gridStart, gridEnd > gridStart ? gridEnd : undefined);

    expect(headerSource).not.toContain("label: 'Subtitle color'");
    expect(headerSource).not.toContain('subtitleColorField: subtitleColorFieldProp');
    expect(headerSource).toContain('admin-card-grid-header-editor-columns');
    expect(headerSource).toContain('headerControlFields');
    expect(headerSource).toContain('baseColorClassName={normalizeSemanticTextColorClass(settings.subtitleClassName)}');
    expect(headerSource).toContain("onBaseColorChange={(nextValue) => onSettingChange('subtitleClassName', nextValue)}");
    expect(headerSource).toContain('previewWrapClassName={`is-bg-${gridBgTone}`}');
    expect(headerSource).toContain("className={`is-bg-${gridBgTone}${subheadSizeRem !== null ? ' is-subhead-sized' : ''}`}");
    expect(gridSource).toContain('const appearanceFields = [titleToneField, bodyToneField]');
    expect(gridSource).toContain('<BackgroundEditorPage');
    expect(gridSource).toContain('backgroundEffectsJson={settings.backgroundEffectsJson}');
    expect(gridSource).toContain('const headerControlFields = [headerSizeField, headerWidthField, subheadSizeField, ...spacingFields].filter(Boolean);');
    expect(gridSource).not.toContain('admin-card-grid-hud-group--spacing');
    expect(readFileSync(path.resolve(__dirname, '../styles/admin.css'), 'utf8')).toContain(
      '.admin-card-grid-header-editor .admin-color-text-preview.is-sandstone',
    );
  });

  it('exposes block-level subhead sizing with a representable range step', () => {
    expect(definitionSource).toContain("id: 'subheadSizeRem'");
    expect(definitionSource).toContain("label: 'Grid subhead size (rem)'");
    expect(definitionSource).toContain('step: 0.05');
    expect(definitionSource).toContain("id: 'headerSizeRem'");
    expect(definitionSource).toContain("label: 'Header size (rem)'");
  });

  it('exposes header width and separates header-to-subhead from post-subhead spacing', () => {
    expect(definitionSource).toContain("id: 'headerWidthPercent'");
    expect(definitionSource).toContain("label: 'Header width (%)'");
    expect(definitionSource).toContain('defaultValue: DEFAULT_DYNAMIC_GRID_HEADER_WIDTH_PERCENT');
    expect(definitionSource).toContain("id: 'headerCardsSpaceRem'");
    expect(definitionSource).toContain("label: 'Space after subhead'");
    expect(editorSource).toContain("fieldById.get('headerWidthPercent')");
    expect(editorSource).toContain("fieldById.get('headerCardsSpaceRem')");
    expect(editorSource).toContain("label: hasHeaderSubhead ? 'Space below subhead' : 'Space below header'");
    const rendererSource = readFileSync(path.resolve(__dirname, '../components/NativeContentPage.jsx'), 'utf8');
    expect(rendererSource).toContain("'--dynamic-grid-header-width'");
    expect(rendererSource).toContain("'--dynamic-grid-header-cards-space'");
    expect(rendererSource).not.toContain('headerSubheadSpaceConfigured');
    const nativeCssSource = readFileSync(path.resolve(__dirname, '../styles/service-native.css'), 'utf8');
    expect(nativeCssSource).toContain('width: var(--dynamic-grid-header-width, auto);');
    expect(nativeCssSource).toContain('max-width: var(--dynamic-grid-header-width, 86ch);');
    expect(nativeCssSource).toContain('margin-top: var(--dynamic-grid-header-cards-space, 0);');
  });

  it('exposes block-level card-title line height as a slider', () => {
    expect(definitionSource).toContain("id: 'cardTitleLineHeight'");
    expect(definitionSource).toContain("label: 'Card title line height'");
    expect(definitionSource).toContain('min: 0.8');
    expect(definitionSource).toContain('max: 1.5');
    expect(definitionSource).toContain('defaultValue: DEFAULT_DYNAMIC_GRID_CARD_TITLE_LINE_HEIGHT');
    expect(editorSource).toContain("fieldById.get('cardTitleLineHeight')");
    expect(editorSource).toContain("'cardTitleLineHeight', 'cardBodyLineHeight', 'cardBulletLineHeight'");
  });

  it('exposes an alternating body-color option for card copy', () => {
    expect(definitionSource).toContain("id: 'bodyTone'");
    expect(definitionSource).toContain('options: GRID_CARD_BODY_TONE_OPTIONS');
    expect(definitionSource).toContain("value: 'alternating'");
  });

  it('exposes Insurance coverage hover scale as a scoped boolean control', () => {
    expect(definitionSource).toContain("id: 'cardHoverScale'");
    expect(definitionSource).toContain("label: 'Scale cards on hover'");
    expect(definitionSource).toContain("cardHoverScale: false");
    expect(editorSource).toContain("includes('insurance-native-coverage')");
    expect(editorSource).toContain("fieldById.get('cardHoverScale')");
    expect(editorSource).toContain('allowedLayoutFieldIds.add(\'cardHoverScale\')');
    const nativeCssSource = readFileSync(path.resolve(__dirname, '../styles/service-native.css'), 'utf8');
    expect(nativeCssSource).toContain('.insurance-native-coverage.is-card-hover-scale');
    expect(nativeCssSource).toContain('transform: translateY(-4px) scale(1.02);');
    expect(nativeCssSource).toContain('.insurance-native-coverage.is-card-hover-scale-disabled');
  });

  it('keeps outlined cards selectable and separates outline from shadow', () => {
    expect(definitionSource).toContain("{ value: 'card2', label: 'Outlined' }");
    expect(definitionSource).toContain("id: 'cardOutline'");
    expect(definitionSource).toContain("label: 'Card outline'");
    expect(definitionSource).toContain("id: 'cardShadow'");
    expect(definitionSource).toContain("label: 'Card shadow'");
    expect(editorSource).toContain("allowedLayoutFieldIds.add('cardOutline')");
    expect(editorSource).toContain("allowedLayoutFieldIds.add('cardShadow')");
    const rendererSource = readFileSync(path.resolve(__dirname, './NativeContentPage.jsx'), 'utf8');
    const nativeCssSource = readFileSync(path.resolve(__dirname, '../styles/service-native.css'), 'utf8');
    expect(rendererSource).toContain("cardOutline === true ? ' is-card-outline' : ''");
    expect(rendererSource).toContain("cardShadow === true ? ' is-card-shadow' : ''");
    expect(nativeCssSource).toContain('.is-card-outline .service-native-card');
    expect(nativeCssSource).toContain('.is-card-shadow .service-native-card');
  });
});
