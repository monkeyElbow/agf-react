import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const editorSource = readFileSync(path.resolve(__dirname, './block-editors/migratedBlockEditors.jsx'), 'utf8');
const definitionSource = readFileSync(path.resolve(__dirname, '../blocks/definitions/cardGrid.definition.js'), 'utf8');
const presentationSource = readFileSync(path.resolve(__dirname, '../lib/dynamicGridPresentation.js'), 'utf8');
const hostSource = readFileSync(path.resolve(__dirname, './BlockHudPanelHost.jsx'), 'utf8');

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
    expect(gridSource).toContain('const cardColorFields = [titleToneField, bodyToneField]');
    expect(gridSource).toContain('const cardGridTypographyFields = [');
    expect(gridSource).toContain('typographyFieldColumns.map');
    expect(gridSource).toContain("const presetId = String(presetDefinition?.id || block?.presetId || '').trim().toLowerCase() || 'default';");
    expect(gridSource).toContain('<BackgroundEditorPage');
    expect(gridSource).toContain('<HudEditorModelLayout');
    expect(gridSource).toContain('blockOptions = null');
    const layoutPageStart = gridSource.indexOf('admin-card-grid-hud-page--layout');
    const appearancePageStart = gridSource.indexOf('admin-card-grid-hud-page--appearance');
    expect(gridSource.indexOf('typographyFieldColumns.map', layoutPageStart)).toBeGreaterThan(layoutPageStart);
    expect(gridSource.indexOf('typographyFieldColumns.map', layoutPageStart)).toBeLessThan(appearancePageStart);
    expect(gridSource.slice(layoutPageStart, appearancePageStart)).not.toContain('admin-billboard-editor-panel-index');
    expect(gridSource).toContain('backgroundEffectsJson={settings.backgroundEffectsJson}');
    expect(gridSource).toContain('const headerControlFields = [headerSizeField, headerWidthField, subheadSizeField, ...spacingFields].filter(Boolean);');
    expect(gridSource).not.toContain('admin-card-grid-hud-group--spacing');
    const frontHudCssSource = readFileSync(path.resolve(__dirname, '../styles/front-hud.css'), 'utf8');
    expect(hostSource).toContain("  'card_grid',");
    expect(hostSource).not.toContain('const cardGridSections = blockKind === \'card_grid\'');
    expect(frontHudCssSource).not.toContain('admin-hud-editor-compatibility-layout--card_grid');
    expect(frontHudCssSource).toContain('.admin-card-grid-hud-group--layout');
    expect(gridSource).toContain('const layoutFieldColumns = buildFieldColumns(layoutFields');
    expect(gridSource).toContain('const typographyFieldColumns = buildFieldColumns(cardGridTypographyFields');
    expect(gridSource).toContain('data-editor-panel-column={index + 1}');
    expect(gridSource).toContain('data-editor-panel-column={index + 3}');
    expect(frontHudCssSource).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
    expect(frontHudCssSource).toContain('grid-column: span 1;');
    expect(frontHudCssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(frontHudCssSource).toContain(
      '.admin-card-grid-hud-group--typography\n  .admin-card-grid-hud-fields > label:is',
    );
    expect(frontHudCssSource).toContain("label:is([data-editor-field-id='titleTone'], [data-editor-field-id='bodyTone'])");
    expect(frontHudCssSource).toContain('.admin-range-number-control--unit-tooltip');
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

  it('exposes universal card title and body justification on Card typography', () => {
    expect(definitionSource).toContain("id: 'cardTitleJustify'");
    expect(definitionSource).toContain("label: 'Card title justify'");
    expect(definitionSource).toContain("id: 'cardBodyJustify'");
    expect(definitionSource).toContain("label: 'Card body justify'");
    expect(editorSource).toContain("fieldById.get('cardTitleJustify')");
    expect(editorSource).toContain("fieldById.get('cardBodyJustify')");
    expect(editorSource).toContain("field.type === 'select' ? 'select' : 'range'");
    const rendererSource = readFileSync(path.resolve(__dirname, './NativeContentPage.jsx'), 'utf8');
    expect(rendererSource).toContain("'--dynamic-grid-card-title-justify'");
    expect(rendererSource).toContain("'--dynamic-grid-card-title-justify-content'");
    expect(rendererSource).toContain("'--dynamic-grid-card-body-justify'");
    const nativeCssSource = readFileSync(path.resolve(__dirname, '../styles/service-native.css'), 'utf8');
    expect(nativeCssSource).toContain('text-align: var(--dynamic-grid-card-title-justify, center) !important;');
    expect(nativeCssSource).toContain('justify-content: var(--dynamic-grid-card-title-justify-content, center) !important;');
    expect(nativeCssSource).toContain('text-align: var(--dynamic-grid-card-body-justify, left) !important;');
    expect(nativeCssSource).toContain('.service-native-card-flow > :is(');
    const adminCssSource = readFileSync(path.resolve(__dirname, '../styles/admin.css'), 'utf8');
    expect(adminCssSource).toContain('.admin-justify-pill-control');
    expect(adminCssSource).toContain('height: 1.625rem;');
    expect(adminCssSource).toContain('width: 1.5rem;');
  });

  it('exposes scoped horizontal number positioning for numbered cards', () => {
    expect(definitionSource).toContain("id: 'numberPositionPercent'");
    expect(definitionSource).toContain("label: 'Number position (− left / + right)'");
    expect(definitionSource).toContain('min: -50');
    expect(definitionSource).toContain('max: 50');
    expect(editorSource).toContain('isNumberedStepCardsGrid');
    expect(editorSource).toContain("fieldById.get('numberPositionPercent')");
    const rendererSource = readFileSync(path.resolve(__dirname, '../components/NativeContentPage.jsx'), 'utf8');
    expect(rendererSource).toContain("'--numbered-step-card-number-offset'");
    const numberedCssSource = readFileSync(path.resolve(__dirname, '../styles/service-native-numbered-cards.css'), 'utf8');
    expect(numberedCssSource).toContain('left: var(--numbered-step-card-number-offset, 0%);');
  });

  it('exposes an alternating body-color option for card copy', () => {
    expect(definitionSource).toContain("id: 'bodyTone'");
    expect(definitionSource).toContain('options: GRID_CARD_BODY_TONE_OPTIONS');
    expect(presentationSource).toContain("value: 'alternating'");
    expect(definitionSource).toContain("id: 'fineprintSizeRem'");
    expect(editorSource).toContain("fieldById.get('fineprintSizeRem')");
  });

  it('keeps card body editing separate from the complete fineprint control group', () => {
    const adminCssSource = readFileSync(path.resolve(__dirname, '../styles/admin.css'), 'utf8');
    const frontHudCssSource = readFileSync(path.resolve(__dirname, '../styles/front-hud.css'), 'utf8');

    expect(editorSource).toContain('admin-card-grid-body-fineprint-columns');
    expect(editorSource).toContain('admin-card-grid-body-editor');
    expect(editorSource).toContain('admin-card-grid-fineprint-controls');
    expect(adminCssSource).toContain('.admin-card-grid-body-fineprint-columns');
    expect(adminCssSource).toContain('grid-template-columns: minmax(0, 1.15fr) minmax(16rem, 0.85fr);');
    expect(adminCssSource).toContain("label[data-editor-field-id$='Fineprint']");
    expect(adminCssSource).toContain('.admin-justify-pill-btn');
    expect(frontHudCssSource).toContain('.admin-card-grid-fineprint-controls');
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
    expect(definitionSource).toContain("type: 'outline_mode'");
    expect(definitionSource).toContain("id: 'cardOutlineTone'");
    expect(definitionSource).toContain("label: 'Border color'");
    expect(definitionSource).toContain("value: 'alternating'");
    expect(definitionSource).toContain("id: 'cardOutlineWidth'");
    expect(definitionSource).toContain("label: 'Border width'");
    expect(editorSource).toContain("field.id !== 'cardOutlineTone'");
    expect(definitionSource).toContain("id: 'cardShadow'");
    expect(definitionSource).toContain("label: 'Card shadow'");
    expect(editorSource).toContain("allowedLayoutFieldIds.add('cardOutline')");
    expect(editorSource).toContain("allowedLayoutFieldIds.add('cardShadow')");
    expect(editorSource).toContain("const cardOutlineIsOff = settings.cardOutline === false");
    expect(editorSource).toContain("disabled: cardOutlineIsOff");
    expect(editorSource).toContain('const handleGridLayoutChange = (fieldId, nextValue) =>');
    expect(editorSource).toContain("if (fieldId === 'cardOutlineWidth')");
    expect(editorSource).toContain("onSettingChange('cardOutline', true)");
    expect(editorSource).toContain('onSettingChange={handleGridLayoutChange}');
    const adminCssSource = readFileSync(path.resolve(__dirname, '../styles/admin.css'), 'utf8');
    expect(adminCssSource).toContain("label[data-editor-field-id='cardShadow'] {\n  grid-column: 1;\n  grid-row: 5;");
    const frontHudCssSource = readFileSync(path.resolve(__dirname, '../styles/front-hud.css'), 'utf8');
    expect(frontHudCssSource).not.toContain("label[data-editor-field-id='cardShadow'] {\n  grid-column: 1;\n  grid-row: 5;");
    const rendererSource = readFileSync(path.resolve(__dirname, './NativeContentPage.jsx'), 'utf8');
    const nativeCssSource = readFileSync(path.resolve(__dirname, '../styles/service-native.css'), 'utf8');
    expect(rendererSource).toContain("cardOutline === true ? ' is-card-outline' : ''");
    expect(rendererSource).toContain("is-card-outline-${cardOutlineTone}");
    expect(rendererSource).toContain("--dynamic-grid-card-outline-width");
    expect(rendererSource).toContain("cardShadow === true ? ' is-card-shadow' : ''");
    expect(nativeCssSource).toContain('.is-card-outline .service-native-card');
    expect(nativeCssSource).toContain('.is-card-outline.is-card-outline-mango');
    expect(nativeCssSource).toContain('.is-card-outline.is-card-outline-alternating');
    expect(nativeCssSource).toContain('--dynamic-grid-card-outline-three');
    expect(nativeCssSource).toContain('var(--dynamic-grid-card-outline-width, 1.5px)');
    expect(nativeCssSource).toContain('.is-card-shadow .service-native-card');
  });
});
