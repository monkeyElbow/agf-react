import { describe, expect, it } from 'vitest';
import {
  RUNTIME_AUTHORITY_GLOBAL_KEY,
  buildRuntimeAuthorityDescriptor,
  clearRuntimeAuthorityDescriptor,
  publishRuntimeAuthorityDescriptor,
  readRuntimeAuthorityDescriptor,
} from './runtimeAuthorityDescriptor';

describe('runtime authority descriptor', () => {
  it('reports source, revisions, route owner, renderer, editor, and CSS family', () => {
    const descriptor = buildRuntimeAuthorityDescriptor({
      pathname: '/services/planned-giving/ministry-impact-fund',
      block: { id: 'gift-types', kind: 'card_grid' },
      section: {
        renderContract: {
          version: 1,
          presetId: 'bullet-cards',
          rootClassName: 'service-native-section',
          runtimeClassName: 'is-card-grid-bullet-cards',
        },
      },
      source: 'draft',
      draftRevision: 'draft-7',
      publishedRevision: 'published-4',
      activeRevision: 'draft-7',
      hudEnabled: true,
      runtimeBuildId: 'vite-1',
    });

    expect(descriptor).toMatchObject({
      pathname: '/services/planned-giving/ministry-impact-fund',
      blockId: 'gift-types',
      blockKind: 'card_grid',
      source: 'draft',
      draftRevision: 'draft-7',
      publishedRevision: 'published-4',
      activeRevision: 'draft-7',
      hudEnabled: true,
      runtimeBuildId: 'vite-1',
      routeOwner: 'NativeContentPage',
      composer: 'composeManagedPage',
      editor: 'blockRegistry.getBlockDefinition',
      renderContract: { presetId: 'bullet-cards' },
    });
    expect(descriptor.cssFamily).toContain('service-native.css');
  });

  it('publishes diagnostics without changing application state', () => {
    const target = {};
    const payload = publishRuntimeAuthorityDescriptor([
      { pathname: '/test', blockId: 'hero', blockKind: 'hero', source: 'published' },
    ], { pathname: '/test', hudEnabled: false, runtimeBuildId: 'vite-2' });

    expect(payload).toMatchObject({ pathname: '/test', hudEnabled: false, runtimeBuildId: 'vite-2' });
    expect(target[RUNTIME_AUTHORITY_GLOBAL_KEY]).toBeUndefined();
    target[RUNTIME_AUTHORITY_GLOBAL_KEY] = payload;
    expect(readRuntimeAuthorityDescriptor(target)).toEqual(payload);
    clearRuntimeAuthorityDescriptor(target);
    expect(readRuntimeAuthorityDescriptor(target)).toBeNull();
  });
});
