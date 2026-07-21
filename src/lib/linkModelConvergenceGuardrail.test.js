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
    const linkValueSource = readSource('./linkValue.js');
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
    const snapshotAuditSource = readSource('../../scripts/content-admin-snapshot-audit.mjs');
    const contentAdminContextSource = readSource('../context/ContentAdminContext.jsx');
    const contentAdminStoreSource = readSource('../../dev-server/contentAdminStore.js');

    expect(runtimeSource).toContain('coerceLinkValueFromFields');
    expect(runtimeSource).toContain('function buildCanonicalActionLinkFromFields(source, {');
    expect(runtimeSource).not.toContain('coerceLinkValue({');
    expect(linkValueSource).toContain('export function coerceLinkValue');
    expect(linkValueSource).toContain('export function parseLinkValueJson');
    expect(linkValueSource).toContain('export function serializeLinkValue');
    expect(linkValueSource).toContain('export function normalizeSplitLinkFieldSettings');
    expect(linkValueSource).toContain('export function validateActionFieldGroup');
    expect(linkValueSource).not.toContain('coerceLegacyLinkValue');
    expect(linkValueSource).not.toContain('validateLegacyActionFieldGroup');
    expect(linkValueSource).not.toContain('validateLegacyLinkFieldGroup');
    expect(linkValueSource).not.toContain('linkValueToLegacyLinkProps');
    expect(snapshotAuditSource).toContain('split-link-page-ref-not-internal');
    expect(snapshotAuditSource).toContain('split-link-internal-target-drift');
    expect(snapshotAuditSource).toContain('split-link-page-ref-missing');
    expect(snapshotAuditSource).toContain('split-link-target-conflict');
    expect(snapshotAuditSource).toContain('canonical-link-json-invalid');
    expect(snapshotAuditSource).toContain('canonical-link-json-missing');
    expect(snapshotAuditSource).toContain('canonical-link-json-mismatch');
    expect(contentAdminContextSource).toContain('normalizeSplitLinkFieldSettings');
    expect(contentAdminStoreSource).toContain('normalizeSplitLinkFieldSettings');

    expect(heroDefinitionSource).toContain('validateActionFieldGroup');
    expect(introDefinitionSource).toContain('validateLinkFieldGroups');
    expect(columnsDefinitionSource).toContain('validateLinkFieldGroups');
    expect(photoColumnDefinitionSource).toContain('validateLinkFieldGroup');
    expect(servicesGridDefinitionSource).toContain('validateLinkFieldGroups');
    expect(cardGridDefinitionSource).toContain('validateLinkFieldGroups');

    expect(billboardDefinitionSource).toContain('validateActionFieldGroup');
    expect(featurePanelDefinitionSource).toContain('validateActionFieldGroup');
    expect(ctaBandDefinitionSource).toContain('validateActionFieldGroup');
    expect(impactStatDefinitionSource).toContain('validateActionFieldGroup');
    expect(splitPanelDefinitionSource).toContain('validateActionFieldGroups');

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
      expect(source).not.toContain('coerceLinkValue({');
    });
  });
});
