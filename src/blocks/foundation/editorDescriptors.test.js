import { describe, expect, it } from 'vitest';
import {
  defineTransitionalActionFields,
  defineTransitionalLinkFields,
} from './editorDescriptors';

describe('editor descriptor transitional link helpers', () => {
  it('builds a canonical route-link control without split compatibility metadata', () => {
    expect(defineTransitionalLinkFields({
      hrefId: 'buttonUrl',
      hrefLabel: 'Button URL / Path',
      toId: 'buttonPageRef',
      toLabel: 'Button internal page path',
      openInNewWindowId: 'buttonOpenInNewWindow',
      openInNewWindowLabel: 'Open button in new window',
    })).toEqual([
      expect.objectContaining({
        id: 'buttonLinkJson',
        label: 'Button URL / Path',
        type: 'route_link',
        openInNewWindowLabel: 'Open button in new window',
      }),
    ]);
    expect(defineTransitionalLinkFields({
      hrefId: 'buttonUrl',
      toId: 'buttonPageRef',
      openInNewWindowId: 'buttonOpenInNewWindow',
    })[0]).not.toEqual(expect.objectContaining({
      legacyHrefFieldId: expect.any(String),
      routeRefFieldId: expect.any(String),
      linkJsonFieldId: expect.any(String),
      openInNewWindowFieldId: expect.any(String),
    }));
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
        id: 'buttonLinkJson',
        type: 'route_link',
        label: 'Button URL / Path',
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
