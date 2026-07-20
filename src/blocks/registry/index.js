import { flattenEditorFields } from '../foundation/editorDescriptors';
import { getDefinitionSections } from '../foundation/models';
import { billboardBlockDefinition } from '../definitions/billboard.definition';
import { calculatorCtaBlockDefinition } from '../definitions/calculatorCta.definition';
import { cardGridBlockDefinition } from '../definitions/cardGrid.definition';
import { columnsBlockDefinition } from '../definitions/columns.definition';
import { ctaBandBlockDefinition } from '../definitions/ctaBand.definition';
import { ctaFormBlockDefinition } from '../definitions/ctaForm.definition';
import { featurePanelBlockDefinition } from '../definitions/featurePanel.definition';
import { heroBlockDefinition } from '../definitions/hero.definition';
import { heroPieBlockDefinition } from '../definitions/heroPie.definition';
import { impactStatBlockDefinition } from '../definitions/impactStat.definition';
import { introBlockDefinition } from '../definitions/intro.definition';
import { legalCopyBlockDefinition } from '../definitions/legalCopy.definition';
import { newsletterBlockDefinition } from '../definitions/newsletter.definition';
import { pageContentBlockDefinition } from '../definitions/pageContent.definition';
import { photoColumnBlockDefinition } from '../definitions/photoColumn.definition';
import { ratesBlockDefinition } from '../definitions/rates.definition';
import { requestFormBlockDefinition } from '../definitions/requestForm.definition';
import { servicesGridBlockDefinition } from '../definitions/servicesGrid.definition';
import { siteFeatureBlockDefinition } from '../definitions/siteFeature.definition';
import { splitPanelBlockDefinition } from '../definitions/splitPanel.definition';
import { testimonialsBlockDefinition } from '../definitions/testimonials.definition';
import { topStripBlockDefinition } from '../definitions/topStrip.definition';

const MIGRATED_BLOCK_DEFINITIONS = Object.freeze({
  content: pageContentBlockDefinition,
  calculator_cta: calculatorCtaBlockDefinition,
  cta_band: ctaBandBlockDefinition,
  cta_form: ctaFormBlockDefinition,
  request_form: requestFormBlockDefinition,
  hero: heroBlockDefinition,
  hero_pie: heroPieBlockDefinition,
  impact_stat: impactStatBlockDefinition,
  intro: introBlockDefinition,
  legal_copy: legalCopyBlockDefinition,
  billboard: billboardBlockDefinition,
  columns: columnsBlockDefinition,
  feature_panel: featurePanelBlockDefinition,
  photo_column: photoColumnBlockDefinition,
  card_grid: cardGridBlockDefinition,
  newsletter: newsletterBlockDefinition,
  rates: ratesBlockDefinition,
  services_grid: servicesGridBlockDefinition,
  site_feature: siteFeatureBlockDefinition,
  split_panel: splitPanelBlockDefinition,
  testimonials: testimonialsBlockDefinition,
  top_strip: topStripBlockDefinition,
});

export { DEFAULT_SERVICE_HERO_PIE_SLICES } from '../../lib/dynamicPageBlocks';

export function getMigratedBlockKinds() {
  return Object.keys(MIGRATED_BLOCK_DEFINITIONS);
}

export function getBlockDefinition(kind) {
  const token = String(kind || '').trim();
  return MIGRATED_BLOCK_DEFINITIONS[token] || null;
}

export function getBlockPresetDefinitions(kind) {
  return Array.isArray(getBlockDefinition(kind)?.presets) ? getBlockDefinition(kind).presets : [];
}

export function getBlockPresetDefinition(kind, presetId) {
  const token = String(presetId || '').trim().toLowerCase();
  return getBlockPresetDefinitions(kind).find((preset) => String(preset?.id || '').trim().toLowerCase() === token) || null;
}

export function resolveBlockPresetDefinition(block) {
  const definition = getBlockDefinition(block?.kind);
  if (!definition) {
    return null;
  }

  const presets = Array.isArray(definition.presets) ? definition.presets : [];
  if (!presets.length) {
    return null;
  }

  const explicitPresetId = String(block?.presetId || '').trim().toLowerCase();
  if (explicitPresetId) {
    const byExplicitPresetId = presets.find((preset) => String(preset?.id || '').trim().toLowerCase() === explicitPresetId);
    if (byExplicitPresetId) {
      return byExplicitPresetId;
    }
  }

  const templateId = String(block?.templateId || '').trim().toLowerCase();
  if (templateId) {
    const byTemplateId = presets.find((preset) => (
      Array.isArray(preset?.templateIds)
      && preset.templateIds.some((candidate) => String(candidate || '').trim().toLowerCase() === templateId)
    ));
    if (byTemplateId) {
      return byTemplateId;
    }
  }

  return presets.find((preset) => String(preset?.id || '').trim().toLowerCase() === 'default') || presets[0] || null;
}

export function isSingletonBlockKind(kind) {
  return Boolean(getBlockDefinition(kind)?.singleton);
}

export function getSingletonBlockKinds() {
  return getAllBlockDefinitions()
    .filter((definition) => Boolean(definition?.singleton))
    .map((definition) => definition.kind);
}

export function getAllBlockDefinitions() {
  return Object.values(MIGRATED_BLOCK_DEFINITIONS);
}

export function getBlockEditorSections(kind, surface = 'admin') {
  const definition = getBlockDefinition(kind);
  if (!definition) {
    return [];
  }
  return getDefinitionSections(definition, surface);
}

export function getEditableFieldsForKind(kind, surface = 'admin') {
  return flattenEditorFields(getBlockEditorSections(kind, surface));
}

export function applyCanonicalDefinitionToBlock(block, surface = 'admin') {
  const definition = getBlockDefinition(block?.kind);
  if (!definition || String(block?.mode || '').trim() !== 'dynamic') {
    return block;
  }

  return {
    ...block,
    editableFields: getEditableFieldsForKind(block.kind, surface),
  };
}

export function applyCanonicalDefinitionsToBlueprintMap(blueprintsByPath, surface = 'admin') {
  return Object.fromEntries(
    Object.entries(blueprintsByPath || {}).map(([path, blocks]) => ([
      path,
      (Array.isArray(blocks) ? blocks : []).map((block) => applyCanonicalDefinitionToBlock(block, surface)),
    ])),
  );
}
