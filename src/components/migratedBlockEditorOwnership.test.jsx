import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getAllBlockDefinitions, getBlockEditorSections } from '../blocks/registry';
import { getEditorParityContract } from '../lib/editorParityContract';
import {
  BillboardBlockEditor,
  CalculatorCtaBlockEditor,
  CalculatorWidgetBlockEditor,
  CtaFormBlockEditor,
  ColumnsBlockEditor,
  FeaturePanelBlockEditor,
  getMigratedBlockEditorComponent,
  GridBlockEditor,
  HeroBlockEditor,
  HeroPieBlockEditor,
  ImpactStatBlockEditor,
  IntroBlockEditor,
  LegalCopyBlockEditor,
  NewsletterBlockEditor,
  PageContentBlockEditor,
  PageContentHudBlockEditor,
  PhotoColumnBlockEditor,
  RatesBlockEditor,
  RequestFormBlockEditor,
  ServicesGridBlockEditor,
  SiteFeatureBlockEditor,
  SplitPanelBlockEditor,
  TestimonialsBlockEditor,
  TestimonialsHudBlockEditor,
  TopStripBlockEditor,
  TopStripHudBlockEditor,
} from './block-editors/migratedBlockEditors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('migrated block editor ownership', () => {
  it('resolves migrated admin and HUD editors from the shared migrated editor module', () => {
    expect(getMigratedBlockEditorComponent('hero', 'admin')).toBe(HeroBlockEditor);
    expect(getMigratedBlockEditorComponent('hero', 'hud')).toBe(HeroBlockEditor);
    expect(getMigratedBlockEditorComponent('hero_pie', 'admin')).toBe(HeroPieBlockEditor);
    expect(getMigratedBlockEditorComponent('hero_pie', 'hud')).toBe(HeroPieBlockEditor);
    expect(getMigratedBlockEditorComponent('calculator_cta', 'admin')).toBe(CalculatorCtaBlockEditor);
    expect(getMigratedBlockEditorComponent('calculator_cta', 'hud')).toBe(CalculatorCtaBlockEditor);
    expect(getMigratedBlockEditorComponent('calculator_intro', 'admin')).toBe(CalculatorWidgetBlockEditor);
    expect(getMigratedBlockEditorComponent('calculator_intro', 'hud')).toBe(CalculatorWidgetBlockEditor);
    expect(getMigratedBlockEditorComponent('calculator_widget', 'admin')).toBe(CalculatorWidgetBlockEditor);
    expect(getMigratedBlockEditorComponent('calculator_widget', 'hud')).toBe(CalculatorWidgetBlockEditor);
    expect(getMigratedBlockEditorComponent('cta_form', 'admin')).toBe(CtaFormBlockEditor);
    expect(getMigratedBlockEditorComponent('cta_form', 'hud')).toBeNull();
    expect(getMigratedBlockEditorComponent('request_form', 'admin')).toBe(RequestFormBlockEditor);
    expect(getMigratedBlockEditorComponent('request_form', 'hud')).toBe(RequestFormBlockEditor);
    expect(getMigratedBlockEditorComponent('impact_stat', 'admin')).toBe(ImpactStatBlockEditor);
    expect(getMigratedBlockEditorComponent('impact_stat', 'hud')).toBe(ImpactStatBlockEditor);
    expect(getMigratedBlockEditorComponent('legal_copy', 'admin')).toBe(LegalCopyBlockEditor);
    expect(getMigratedBlockEditorComponent('legal_copy', 'hud')).toBe(LegalCopyBlockEditor);
    expect(getMigratedBlockEditorComponent('rates', 'admin')).toBe(RatesBlockEditor);
    expect(getMigratedBlockEditorComponent('rates', 'hud')).toBe(RatesBlockEditor);
    expect(getMigratedBlockEditorComponent('content', 'admin')).toBe(PageContentBlockEditor);
    expect(getMigratedBlockEditorComponent('content', 'hud')).toBe(PageContentHudBlockEditor);
    expect(getMigratedBlockEditorComponent('top_strip', 'admin')).toBe(TopStripBlockEditor);
    expect(getMigratedBlockEditorComponent('top_strip', 'hud')).toBe(TopStripHudBlockEditor);
    expect(getMigratedBlockEditorComponent('intro', 'admin')).toBe(IntroBlockEditor);
    expect(getMigratedBlockEditorComponent('intro', 'hud')).not.toBe(IntroBlockEditor);
    expect(getMigratedBlockEditorComponent('billboard', 'admin')).toBe(BillboardBlockEditor);
    expect(getMigratedBlockEditorComponent('billboard', 'hud')).toBe(BillboardBlockEditor);
    expect(getMigratedBlockEditorComponent('columns', 'admin')).toBe(ColumnsBlockEditor);
    expect(getMigratedBlockEditorComponent('columns', 'hud')).not.toBe(ColumnsBlockEditor);
    expect(getMigratedBlockEditorComponent('columns', 'hud')).toBeTruthy();
    expect(getMigratedBlockEditorComponent('feature_panel', 'admin')).toBe(FeaturePanelBlockEditor);
    expect(getMigratedBlockEditorComponent('feature_panel', 'hud')).toBe(FeaturePanelBlockEditor);
    expect(getMigratedBlockEditorComponent('card_grid', 'admin')).toBe(GridBlockEditor);
    expect(getMigratedBlockEditorComponent('card_grid', 'hud')).toBe(GridBlockEditor);
    expect(getMigratedBlockEditorComponent('newsletter', 'admin')).toBe(NewsletterBlockEditor);
    expect(getMigratedBlockEditorComponent('newsletter', 'hud')).toBe(NewsletterBlockEditor);
    expect(getMigratedBlockEditorComponent('photo_column', 'admin')).toBe(PhotoColumnBlockEditor);
    expect(getMigratedBlockEditorComponent('photo_column', 'hud')).toBe(PhotoColumnBlockEditor);
    expect(getMigratedBlockEditorComponent('split_panel', 'admin')).toBe(SplitPanelBlockEditor);
    expect(getMigratedBlockEditorComponent('split_panel', 'hud')).toBe(SplitPanelBlockEditor);
    expect(getMigratedBlockEditorComponent('services_grid', 'admin')).toBe(ServicesGridBlockEditor);
    expect(getMigratedBlockEditorComponent('services_grid', 'hud')).toBe(ServicesGridBlockEditor);
    expect(getMigratedBlockEditorComponent('site_feature', 'admin')).toBe(SiteFeatureBlockEditor);
    expect(getMigratedBlockEditorComponent('site_feature', 'hud')).toBe(SiteFeatureBlockEditor);
    expect(getMigratedBlockEditorComponent('testimonials', 'admin')).toBe(TestimonialsBlockEditor);
    expect(getMigratedBlockEditorComponent('testimonials', 'hud')).toBe(TestimonialsHudBlockEditor);
  });

  it('keeps migrated editor sections sourced from one canonical registry path', () => {
    ['content', 'calculator_cta', 'calculator_intro', 'calculator_widget', 'cta_form', 'request_form', 'hero', 'hero_pie', 'impact_stat', 'intro', 'legal_copy', 'billboard', 'columns', 'feature_panel', 'photo_column', 'card_grid', 'card_chart', 'newsletter', 'rates', 'services_grid', 'site_feature', 'split_panel', 'testimonials', 'top_strip'].forEach((kind) => {
      expect(getBlockEditorSections(kind, 'admin').length).toBeGreaterThan(0);
      expect(getBlockEditorSections(kind, 'hud').length).toBeGreaterThan(0);
    });
  });

  it('keeps every canonical dynamic block wired to admin and HUD editing ownership', () => {
    const source = readSource('./BlockHudPanelHost.jsx');

    getAllBlockDefinitions().forEach((definition) => {
      expect(getMigratedBlockEditorComponent(definition.kind, 'admin')).toBeTruthy();
      expect(typeof definition.renderer.buildRuntime).toBe('function');
      expect(getEditorParityContract(definition.kind)?.label).toBe(definition.label);

      if (definition.kind === 'cta_form') {
        expect(getMigratedBlockEditorComponent(definition.kind, 'hud')).toBeNull();
        expect(getEditorParityContract(definition.kind)?.mode).toBe('dedicated-hud-adapter');
        expect(source).toContain("case 'cta_form':");
        expect(source).toContain('<CtaHudEditorPanel');
        return;
      }

      expect(getMigratedBlockEditorComponent(definition.kind, 'hud')).toBeTruthy();
    });
  });

  it('keeps BlockHudPanelHost off the AdminContentPage migrated editor import path', () => {
    const source = readSource('./BlockHudPanelHost.jsx');

    expect(source).toContain("from './block-editors/migratedBlockEditors'");
    expect(source).toContain("getMigratedBlockEditorComponent(block.kind, 'hud')");
    expect(source).not.toMatch(/import\s*\{[^}]*HeroBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*HeroPieBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*IntroBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*BillboardBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*CalculatorCtaBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*ColumnsBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*CtaBandBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*FeaturePanelBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*GridBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*ImpactStatBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*LegalCopyBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*NewsletterBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*PageContentBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*PhotoColumnBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*RatesBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*RequestFormBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*ServicesGridBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*SplitPanelBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*TopStripBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
    expect(source).not.toMatch(/import\s*\{[^}]*TestimonialsBlockEditor[^}]*\}\s*from\s*'..\/pages\/AdminContentPage'/s);
  });

  it('keeps AdminContentPage composing migrated editors from the shared module', () => {
    const source = readSource('../pages/AdminContentPage.jsx');

    expect(source).toContain("from '../components/block-editors/migratedBlockEditors'");
    expect(source).toContain("getMigratedBlockEditorComponent(selectedBlock.kind, 'admin')");
    expect(source).not.toMatch(/export function HeroBlockEditor/);
    expect(source).not.toMatch(/export function CalculatorCtaBlockEditor/);
    expect(source).not.toMatch(/export function CtaBandBlockEditor/);
    expect(source).not.toMatch(/export function CtaFormBlockEditor/);
    expect(source).not.toMatch(/export function RequestFormBlockEditor/);
    expect(source).not.toMatch(/export function HeroPieBlockEditor/);
    expect(source).not.toMatch(/export function IntroBlockEditor/);
    expect(source).not.toMatch(/export function LegalCopyBlockEditor/);
    expect(source).not.toMatch(/export function BillboardBlockEditor/);
    expect(source).not.toMatch(/export function ColumnsBlockEditor/);
    expect(source).not.toMatch(/export function GridBlockEditor/);
    expect(source).not.toMatch(/export function NewsletterBlockEditor/);
    expect(source).not.toMatch(/export function PageContentBlockEditor/);
    expect(source).not.toMatch(/export function RatesBlockEditor/);
    expect(source).not.toMatch(/export function TopStripBlockEditor/);
    expect(source).not.toMatch(/export function TestimonialsBlockEditor/);
  });
});
