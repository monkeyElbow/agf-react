import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('editor link field convergence guardrail', () => {
  it('keeps migrated CTA/action definitions on the shared editor-side field helpers', () => {
    const descriptorSource = readSource('./editorDescriptors.js');
    const heroSource = readSource('../definitions/hero.definition.js');
    const introSource = readSource('../definitions/intro.definition.js');
    const billboardSource = readSource('../definitions/billboard.definition.js');
    const featurePanelSource = readSource('../definitions/featurePanel.definition.js');
    const impactStatSource = readSource('../definitions/impactStat.definition.js');
    const splitPanelSource = readSource('../definitions/splitPanel.definition.js');
    const photoColumnSource = readSource('../definitions/photoColumn.definition.js');
    const columnsSource = readSource('../definitions/columns.definition.js');
    const cardGridSource = readSource('../definitions/cardGrid.definition.js');
    const servicesGridSource = readSource('../definitions/servicesGrid.definition.js');

    expect(descriptorSource).toContain('export function defineTransitionalLinkFields({');
    expect(descriptorSource).toContain('export function defineTransitionalActionFields({');

    [
      heroSource,
      introSource,
      billboardSource,
      featurePanelSource,
      impactStatSource,
      splitPanelSource,
      photoColumnSource,
      columnsSource,
      cardGridSource,
    ].forEach((source) => {
      expect(source).toContain('defineTransitionalActionFields');
    });

    expect(servicesGridSource).toContain('defineTransitionalLinkFields');
  });
});
