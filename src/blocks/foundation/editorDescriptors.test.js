import { describe, expect, it } from 'vitest';
import {
  defineTransitionalActionFields,
  defineTransitionalLinkFields,
} from './editorDescriptors';

describe('editor descriptor transitional link helpers', () => {
  it('builds explicit link field groups for transitional split link storage', () => {
    expect(defineTransitionalLinkFields({
      hrefId: 'buttonUrl',
      hrefLabel: 'Button URL / Path',
      toId: 'buttonPageRef',
      toLabel: 'Button internal page path',
      openInNewWindowId: 'buttonOpenInNewWindow',
      openInNewWindowLabel: 'Open button in new window',
    })).toEqual([
      expect.objectContaining({
        id: 'buttonUrl',
        label: 'Button URL / Path',
        type: 'text',
      }),
      expect.objectContaining({
        id: 'buttonPageRef',
        label: 'Button internal page path',
        type: 'text',
      }),
      expect.objectContaining({
        id: 'buttonOpenInNewWindow',
        label: 'Open button in new window',
        type: 'boolean',
      }),
    ]);
  });

  it('builds explicit action field groups with optional style and tone controls', () => {
    expect(defineTransitionalActionFields({
      labelId: 'buttonLabel',
      labelLabel: 'Button label',
      hrefId: 'buttonUrl',
      toId: 'buttonPageRef',
      styleId: 'buttonStyle',
      styleLabel: 'Button style',
      styleOptions: [{ value: 'blue', label: 'Blue' }],
      toneId: 'buttonTone',
      toneLabel: 'Button color',
      toneOptions: [{ value: 'atlantean', label: 'Blue', swatch: '#00adbb' }],
    })).toEqual([
      expect.objectContaining({
        id: 'buttonLabel',
        label: 'Button label',
        type: 'text',
      }),
      expect.objectContaining({
        id: 'buttonUrl',
        type: 'text',
      }),
      expect.objectContaining({
        id: 'buttonPageRef',
        type: 'text',
      }),
      expect.objectContaining({
        id: 'buttonStyle',
        label: 'Button style',
        type: 'select',
      }),
      expect.objectContaining({
        id: 'buttonTone',
        label: 'Button color',
        type: 'swatch',
      }),
    ]);
  });
});
