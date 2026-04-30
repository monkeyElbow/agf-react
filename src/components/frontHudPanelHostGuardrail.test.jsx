import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGE_LEVEL_FILES = [
  '../pages/HomePage.jsx',
  '../pages/ServicesPage.jsx',
  '../pages/InvestmentsPage.jsx',
  '../pages/RetirementPage.jsx',
  '../pages/LoansPage.jsx',
  '../pages/RatesPage.jsx',
  './NativeContentPage.jsx',
];

const BANNED_DOCKED_PANEL_COMPONENTS = [
  'HeroHudEditorPanel',
  'IntroHudEditorPanel',
  'BillboardHudEditorPanel',
  'CtaHudEditorPanel',
  'RequestFormBlockEditor',
  'NewsletterBlockEditor',
  'ColumnsHudEditorPanel',
  'GridBlockEditor',
  'TestimonialsHudEditorPanel',
  'TopStripHudEditorPanel',
  'PageContentHudEditorPanel',
  'PhotoColumnBlockEditor',
  'ServicesGridBlockEditor',
  'FieldControlGrid',
  'HeroBlockEditor',
  'ImpactStatBlockEditor',
  'LegalCopyBlockEditor',
  'IntroBlockEditor',
  'BillboardBlockEditor',
  'CalculatorCtaBlockEditor',
  'CtaBandBlockEditor',
  'FeaturePanelBlockEditor',
  'SplitPanelBlockEditor',
];

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function buildComponentImportPattern(componentName) {
  return new RegExp(
    `import\\s+(?:\\{[^\\n;]*\\b${componentName}\\b[^\\n;]*\\}|${componentName}(?:\\s*,\\s*\\{[^\\n;]*\\})?)\\s+from`,
  );
}

describe('front HUD panel host guardrail', () => {
  PAGE_LEVEL_FILES.forEach((relativePath) => {
    it(`keeps ${relativePath} on the shared docked panel host path`, () => {
      const source = readSource(relativePath);

      expect((source.match(/<BlockHudPanelHost\b/g) || []).length).toBe(1);

      BANNED_DOCKED_PANEL_COMPONENTS.forEach((componentName) => {
        expect(source).not.toMatch(new RegExp(`<${componentName}\\b`));
        expect(source).not.toMatch(buildComponentImportPattern(componentName));
      });
    });
  });
});
