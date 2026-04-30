import { PAGE_CONTENT_IDENTITY } from './pageContentIdentity';

export const CANONICAL_SINGLE_BLOCK_CONTRACT = Object.freeze({
  hero: Object.freeze({
    kind: 'hero',
    editorType: 'hero',
    label: 'Hero',
    cssNamespace: 'hero',
    rootClassName: 'service-native-hero',
    aliases: Object.freeze([]),
    sampleTemplateId: 'hero',
  }),
  intro: Object.freeze({
    kind: 'intro',
    editorType: 'intro',
    label: 'Intro',
    cssNamespace: 'intro',
    rootClassName: 'service-native-intro',
    aliases: Object.freeze([]),
    sampleTemplateId: 'intro',
  }),
  content: Object.freeze({
    kind: PAGE_CONTENT_IDENTITY.kind,
    editorType: PAGE_CONTENT_IDENTITY.editorType,
    label: PAGE_CONTENT_IDENTITY.label,
    cssNamespace: PAGE_CONTENT_IDENTITY.cssNamespace,
    rootClassName: PAGE_CONTENT_IDENTITY.rootClassName,
    aliases: Object.freeze([PAGE_CONTENT_IDENTITY.editorType]),
    sampleTemplateId: PAGE_CONTENT_IDENTITY.templateId,
  }),
  billboard: Object.freeze({
    kind: 'billboard',
    editorType: 'billboard',
    label: 'Billboard',
    cssNamespace: 'billboard',
    rootClassName: 'dynamic-billboard',
    aliases: Object.freeze([]),
    sampleTemplateId: 'billboard',
  }),
  testimonials: Object.freeze({
    kind: 'testimonials',
    editorType: 'testimonials',
    label: 'Testimonials',
    cssNamespace: 'testimonials',
    rootClassName: 'native-dynamic-testimonials',
    aliases: Object.freeze([]),
    sampleTemplateId: 'testimonials',
  }),
  newsletter: Object.freeze({
    kind: 'newsletter',
    editorType: 'newsletter',
    label: 'Newsletter',
    cssNamespace: 'newsletter',
    rootClassName: 'native-dynamic-newsletter',
    aliases: Object.freeze([]),
    sampleTemplateId: 'newsletter',
  }),
});

export const CANONICAL_SINGLE_BLOCK_KINDS = Object.freeze(
  Object.keys(CANONICAL_SINGLE_BLOCK_CONTRACT),
);

export const CANONICAL_SINGLE_BLOCK_EDITOR_TYPES = Object.freeze(
  Array.from(new Set(
    CANONICAL_SINGLE_BLOCK_KINDS.flatMap((kind) => {
      const contract = CANONICAL_SINGLE_BLOCK_CONTRACT[kind];
      return [contract.editorType, ...(Array.isArray(contract.aliases) ? contract.aliases : [])];
    }),
  )),
);

export function getCanonicalSingleBlockContract(token) {
  const normalized = String(token || '').trim();
  if (!normalized) {
    return null;
  }

  const byKind = CANONICAL_SINGLE_BLOCK_CONTRACT[normalized];
  if (byKind) {
    return byKind;
  }

  return CANONICAL_SINGLE_BLOCK_KINDS
    .map((kind) => CANONICAL_SINGLE_BLOCK_CONTRACT[kind])
    .find((contract) => (
      contract.editorType === normalized
      || (Array.isArray(contract.aliases) && contract.aliases.includes(normalized))
    )) || null;
}

export function isCanonicalSingleBlockKind(kind) {
  return Boolean(CANONICAL_SINGLE_BLOCK_CONTRACT[String(kind || '').trim()]);
}
