import { describe, expect, it } from 'vitest';
import { getBlockDefinition } from '../blocks/registry';
import {
  createEditorControlProbeBlock,
  patchEditorControl,
} from './editorControlContract';
import { selectFrontHudContentSource } from './frontHudContentSource';

function definitionFor(kind) {
  return getBlockDefinition(kind);
}

function blockFor(kind, settings) {
  return createEditorControlProbeBlock(definitionFor(kind), { settings });
}

describe('editor control runtime propagation', () => {
  it('carries Billboard content, typography, width, and action controls into runtime output', () => {
    const definition = definitionFor('billboard');
    const baseBlock = blockFor('billboard', {
      title: 'Published title',
      subtitle: 'Published subtitle',
      buttonLabel: 'Learn more',
      buttonLinkJson: JSON.stringify({ kind: 'internal', to: '/published' }),
      bgTone: 'blue',
      justify: 'center',
      titleFontFamily: 'helv',
      titleFontWeight: 700,
      contentMaxWidthPx: 920,
    });
    const draftBlock = patchEditorControl(
      patchEditorControl(
        patchEditorControl(
          patchEditorControl(baseBlock, { id: 'title' }, 'Draft title'),
          { id: 'bgTone' },
          'grey',
        ),
        { id: 'titleFontWeight' },
        900,
      ),
      { id: 'contentMaxWidthPx' },
      1120,
    );
    const draftRuntime = definition.renderer.buildRuntime(draftBlock);

    expect(draftRuntime.title).toBe('Draft title');
    expect(draftRuntime.bgTone).toBe('grey');
    expect(draftRuntime.titleStyle.fontWeight).toBe(900);
    expect(draftRuntime.contentMaxWidthPx).toBe(1120);
    expect(draftRuntime.actions[0].to).toBe('/published');
  });

  it('carries CTA content, form fields, and background controls into runtime output', () => {
    const definition = definitionFor('cta_form');
    const draftBlock = blockFor('cta_form', {
      title: 'Contact our team',
      bodyHtml: '<p>Draft lead copy.</p>',
      fieldsJson: JSON.stringify([
        { id: 'email', label: 'Email address', type: 'email', required: true },
      ]),
      bgTone: 'blue',
      submitLabel: 'Send request',
    });
    const runtime = definition.renderer.buildRuntime(draftBlock);

    expect(runtime.title).toBe('Contact our team');
    expect(runtime.bodyHtml).toContain('Draft lead copy.');
    expect(runtime.bgTone).toBe('blue');
    expect(runtime.submitLabel).toBe('Send request');
    expect(runtime.fields).toEqual([
      expect.objectContaining({ id: 'email', label: 'Email address', type: 'email' }),
    ]);
  });

  it('carries Card Grid layout, card style, title tone, and card content controls into runtime output', () => {
    const definition = definitionFor('card_grid');
    const draftBlock = blockFor('card_grid', {
      title: 'Draft card grid',
      card1Title: 'First draft card',
      card1Body: 'Card body copy.',
      columns: 'four',
      contentWidth: 'browser',
      cardStyle: 'borderless-shadow',
      titleTone: 'alternating',
    });
    const runtime = definition.renderer.buildRuntime(draftBlock);

    expect(runtime.title).toBe('Draft card grid');
    expect(runtime.columns).toBe('four');
    expect(runtime.contentWidth).toBe('browser');
    expect(runtime.cardStyle).toBe('borderless-shadow');
    expect(runtime.titleTone).toBe('alternating');
    expect(runtime.cards[0]).toEqual(expect.objectContaining({
      title: 'First draft card',
      body: 'Card body copy.',
    }));
  });

  it('keeps the draft runtime in HUD while the published runtime stays unchanged until publish', () => {
    const publishedBlocks = {
      '/test': [blockFor('billboard', { title: 'Published title' })],
    };
    const draftBlocks = {
      '/test': [blockFor('billboard', { title: 'Draft title' })],
    };

    const draftSource = selectFrontHudContentSource({
      enabled: true,
      pathname: '/test',
      authoringBlocksByPath: draftBlocks,
      blocksByPath: publishedBlocks,
      publishedBlocksByPath: publishedBlocks,
    });
    const liveSource = selectFrontHudContentSource({
      enabled: false,
      pathname: '/test',
      authoringBlocksByPath: draftBlocks,
      blocksByPath: draftBlocks,
      publishedBlocksByPath: publishedBlocks,
    });

    expect(definitionFor('billboard').renderer.buildRuntime(draftSource.blocksByPath['/test'][0]).title)
      .toBe('Draft title');
    expect(definitionFor('billboard').renderer.buildRuntime(liveSource.blocksByPath['/test'][0]).title)
      .toBe('Published title');
  });
});
