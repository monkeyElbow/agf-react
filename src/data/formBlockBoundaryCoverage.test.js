import { describe, expect, it } from 'vitest';
import {
  contentBlockBlueprintsByPath,
  genericPageBlockBlueprint,
} from './contentBlockBlueprints';
import {
  getFormBlockExclusiveFieldIds,
} from '../blocks/foundation/forms';

const allBlocks = [
  ...genericPageBlockBlueprint(),
  ...Object.values(contentBlockBlueprintsByPath).flat(),
];

describe('form block boundary coverage', () => {
  it('keeps CTA form editable fields free of request-form-specific controls', () => {
    const requestSpecificIds = new Set(getFormBlockExclusiveFieldIds('request_form'));
    const ctaBlocks = allBlocks.filter((block) => block?.mode === 'dynamic' && block?.kind === 'cta_form');

    expect(ctaBlocks.length).toBeGreaterThan(0);
    ctaBlocks.forEach((block) => {
      const fieldIds = new Set((Array.isArray(block?.editableFields) ? block.editableFields : []).map((field) => field?.id));
      requestSpecificIds.forEach((fieldId) => {
        expect(fieldIds.has(fieldId)).toBe(false);
      });
    });
  });

  it('keeps request-form editable fields free of CTA-form-specific controls', () => {
    const ctaSpecificIds = new Set(getFormBlockExclusiveFieldIds('cta_form'));
    const requestBlocks = allBlocks.filter((block) => block?.mode === 'dynamic' && block?.kind === 'request_form');

    expect(requestBlocks.length).toBeGreaterThan(0);
    requestBlocks.forEach((block) => {
      const fieldIds = new Set((Array.isArray(block?.editableFields) ? block.editableFields : []).map((field) => field?.id));
      ctaSpecificIds.forEach((fieldId) => {
        expect(fieldIds.has(fieldId)).toBe(false);
      });
    });
  });
});
