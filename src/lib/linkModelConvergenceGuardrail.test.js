import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('link model convergence guardrail', () => {
  it('keeps migrated CTA/action block link shaping on the shared helper path', () => {
    const runtimeSource = readSource('./dynamicPageBlocks.js');
    const heroDefinitionSource = readSource('../blocks/definitions/hero.definition.js');
    const introDefinitionSource = readSource('../blocks/definitions/intro.definition.js');
    const billboardDefinitionSource = readSource('../blocks/definitions/billboard.definition.js');
    const featurePanelDefinitionSource = readSource('../blocks/definitions/featurePanel.definition.js');
    const ctaBandDefinitionSource = readSource('../blocks/definitions/ctaBand.definition.js');
    const impactStatDefinitionSource = readSource('../blocks/definitions/impactStat.definition.js');
    const splitPanelDefinitionSource = readSource('../blocks/definitions/splitPanel.definition.js');
    const photoColumnDefinitionSource = readSource('../blocks/definitions/photoColumn.definition.js');
    const columnsDefinitionSource = readSource('../blocks/definitions/columns.definition.js');
    const servicesGridDefinitionSource = readSource('../blocks/definitions/servicesGrid.definition.js');
    const cardGridDefinitionSource = readSource('../blocks/definitions/cardGrid.definition.js');

    expect(runtimeSource).toContain('coerceLegacyLinkValueFromFields');
    expect(runtimeSource).toContain('function buildCanonicalActionLinkFromFields(source, {');
    expect(runtimeSource).not.toContain('coerceLegacyLinkValue({');

    expect(heroDefinitionSource).toContain('validateLegacyLinkFieldGroups');
    expect(introDefinitionSource).toContain('validateLegacyLinkFieldGroups');
    expect(columnsDefinitionSource).toContain('validateLegacyLinkFieldGroups');
    expect(photoColumnDefinitionSource).toContain('validateLegacyLinkFieldGroup');
    expect(servicesGridDefinitionSource).toContain('validateLegacyLinkFieldGroups');
    expect(cardGridDefinitionSource).toContain('validateLegacyLinkFieldGroups');

    expect(billboardDefinitionSource).toContain('validateLegacyActionFieldGroup');
    expect(featurePanelDefinitionSource).toContain('validateLegacyActionFieldGroup');
    expect(ctaBandDefinitionSource).toContain('validateLegacyActionFieldGroup');
    expect(impactStatDefinitionSource).toContain('validateLegacyActionFieldGroup');
    expect(splitPanelDefinitionSource).toContain('validateLegacyActionFieldGroups');

    [
      heroDefinitionSource,
      introDefinitionSource,
      billboardDefinitionSource,
      featurePanelDefinitionSource,
      ctaBandDefinitionSource,
      impactStatDefinitionSource,
      splitPanelDefinitionSource,
      photoColumnDefinitionSource,
      columnsDefinitionSource,
      servicesGridDefinitionSource,
      cardGridDefinitionSource,
    ].forEach((source) => {
      expect(source).not.toContain('coerceLegacyLinkValue({');
    });
  });
});
