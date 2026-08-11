import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('form block foundation guardrail', () => {
  it('keeps request adapters explicit while moving CTA onto the canonical runtime builder', () => {
    const editorSource = readSource('./block-editors/migratedBlockEditors.jsx');
    const dynamicCtaSource = readSource('./DynamicCtaSection.jsx');
    const requestSource = readSource('./DynamicRequestFormSection.jsx');
    const nativeSource = readSource('./NativeContentPage.jsx');
    const pageBlocksSource = readSource('./blocks/PageBlocksRenderer.jsx');
    const runtimeSource = readSource('../lib/dynamicPageBlocks.js');
    const stylesSource = readSource('../styles.css');

    expect(editorSource).toContain("from '../../blocks/foundation/forms'");
    expect(dynamicCtaSource).toContain("from '../blocks/foundation/forms'");
    expect(requestSource).toContain("from '../blocks/foundation/forms'");
    expect(pageBlocksSource).toContain("from '../../blocks/foundation/forms'");

    expect(nativeSource).toContain('const runtime = buildDynamicCtaFormFromBlock(block);');
    expect(nativeSource).toContain('const runtime = buildDynamicRequestFormFromBlock(block);');
    expect(dynamicCtaSource).toContain('buildDynamicCtaFormFromBlock');
    expect(pageBlocksSource).toContain('buildDynamicCtaFormFromBlock');
    expect(pageBlocksSource).toContain('buildDynamicRequestFormFromBlock');
    expect(runtimeSource).toContain('export function buildDynamicCtaFormFromBlock');
    expect(runtimeSource).toContain('export function buildDynamicRequestFormFromBlock');
    expect(runtimeSource).toContain("transitionalAdapter: 'step-fields-json'");
    expect(pageBlocksSource).toContain('cta_form: CtaFormBlock');
    expect(pageBlocksSource).toContain('request_form: RequestFormBlock');
    expect(editorSource).toContain('admin-request-form-step-field-behavior');
    expect(editorSource).toContain('admin-request-form-step-field-behavior-label');
    expect(editorSource).toContain('admin-request-form-step-field-behavior-toggles');
    expect(editorSource).toContain('className="admin-content-checkbox-row admin-content-checkbox-row--request-form"');
    expect(editorSource).toContain('<span>Required</span>');
    expect(editorSource).toContain('<span>Full width</span>');
    expect(editorSource).toContain('swatchVariant="hud"');
    expect(editorSource).toContain('admin-request-form-swatch-palette');
    expect(stylesSource).toContain('.admin-content-field-list label.admin-content-checkbox-row {');
    expect(stylesSource).toContain('.admin-request-form-step-field-behavior {');
    expect(stylesSource).toContain('.admin-request-form-step-field-behavior-toggles {');
    expect(stylesSource).toContain('.admin-swatch-list.admin-request-form-swatch-palette {');
  });
});
