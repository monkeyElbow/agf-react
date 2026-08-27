import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import {
  coerceLinkValueFromFields,
  parseLinkValueJson,
  validateLinkValue,
} from '../lib/linkValue';
import { shouldUseUniversalOutlineButtonLink } from '../lib/dynamicPageBlocks';

const SNAPSHOT_FILES = [
  '../../dev-data/content-admin-shared.json',
  '../../dev-data/content-admin-seed-baseline.json',
];

const SUPPORTED_BUTTON_STYLES = new Set(['blue', 'dark', 'white', 'ghost', 'link', 'outline', 'primary']);
const BUTTON_STYLE_KEYS = new Set([
  'buttonStyle',
  'button1Style',
  'button2Style',
  'loginButtonStyle',
  'ratesButtonStyle',
  'submitStyle',
]);

function isButtonStyleKey(key) {
  return BUTTON_STYLE_KEYS.has(key) || /(?:card\d+Button\d*Style|col\d+ButtonStyle)$/i.test(key);
}

function readSources() {
  return [
    ['source blueprints', contentBlockBlueprintsByPath],
    ...SNAPSHOT_FILES.flatMap((relativePath) => {
      const record = JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
      return [
        [`${relativePath} state`, record.state?.blocksByPath || {}],
        [`${relativePath} baseSnapshot`, record.baseSnapshot?.blocksByPath || {}],
        [`${relativePath} seedState`, record.seedState?.blocksByPath || {}],
      ];
    }),
  ];
}

function collectInvalidButtonStyles(blocksByPath, sourceLabel) {
  return Object.entries(blocksByPath || {}).flatMap(([pathname, blocks]) => (
    (Array.isArray(blocks) ? blocks : []).flatMap((block) => {
      const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
      return Object.entries(settings).flatMap(([key, value]) => {
        if (!isButtonStyleKey(key)) return [];
        const style = String(value || '').trim().toLowerCase();
        return style && !SUPPORTED_BUTTON_STYLES.has(style)
          ? [{ source: sourceLabel, pathname, blockId: block?.id, key, style }]
          : [];
      });
    })
  ));
}

function collectInvalidCanonicalLinks(blocksByPath, sourceLabel) {
  return Object.entries(blocksByPath || {}).flatMap(([pathname, blocks]) => (
    (Array.isArray(blocks) ? blocks : []).flatMap((block) => {
      const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
      return Object.entries(settings).flatMap(([key, value]) => {
        if (!/LinkJson$/i.test(key) || !String(value || '').trim()) return [];
        const link = parseLinkValueJson(value);
        return link && validateLinkValue(link).valid
          ? []
          : [{ source: sourceLabel, pathname, blockId: block?.id, key, value }];
      });
    })
  ));
}

function validateExplicitButtonSlot(settings, prefix = 'button') {
  const style = String(settings?.[`${prefix}Style`] || '').trim().toLowerCase();
  const link = parseLinkValueJson(settings?.[`${prefix}LinkJson`]);
  return SUPPORTED_BUTTON_STYLES.has(style) && Boolean(link) && validateLinkValue(link).valid;
}

describe('button policy guardrail', () => {
  it('validates supported styles and canonical link targets independently', () => {
    const sources = readSources();
    const styleViolations = sources.flatMap(([sourceLabel, blocksByPath]) => (
      collectInvalidButtonStyles(blocksByPath, sourceLabel)
    ));
    const linkViolations = sources.flatMap(([sourceLabel, blocksByPath]) => (
      collectInvalidCanonicalLinks(blocksByPath, sourceLabel)
    ));

    expect(styleViolations).toEqual([]);
    expect(linkViolations).toEqual([]);
  });

  it('allows either supported explicit style for anchors and internal routes', () => {
    expect(validateExplicitButtonSlot({
      buttonStyle: 'outline',
      buttonLinkJson: '{"kind":"anchor","href":"#traditional-daf-form"}',
    })).toBe(true);
    expect(validateExplicitButtonSlot({
      buttonStyle: 'blue',
      buttonLinkJson: '{"kind":"anchor","href":"#traditional-daf-form"}',
    })).toBe(true);
    expect(validateExplicitButtonSlot({
      buttonStyle: 'outline',
      buttonLinkJson: '{"kind":"internal","to":"/services/contact"}',
    })).toBe(true);
    expect(validateExplicitButtonSlot({
      buttonStyle: 'blue',
      buttonLinkJson: '{"kind":"internal","to":"/services/contact"}',
    })).toBe(true);
  });

  it('keeps canonical link settings ahead of compatibility fields', () => {
    const link = coerceLinkValueFromFields({
      buttonStyle: 'outline',
      buttonLinkJson: '{"kind":"anchor","href":"#traditional-daf-form"}',
      buttonUrl: 'https://example.com/legacy',
      buttonPageRef: '/legacy-route',
    }, {
      linkJsonKeys: ['buttonLinkJson'],
      hrefKeys: ['buttonUrl'],
      toKeys: ['buttonPageRef'],
    });

    expect(link).toEqual({
      kind: 'anchor',
      href: '#traditional-daf-form',
      openInNewWindow: false,
    });
    expect(validateLinkValue(link).valid).toBe(true);
  });

  it('preserves the prior explicit DAF style without making the URL authoritative', () => {
    const blocks = contentBlockBlueprintsByPath['/services/planned-giving/donor-advised-fund'] || [];
    const hero = blocks.find((block) => block?.id === 'hero');
    const howItWorks = blocks.find((block) => block?.id === 'how_it_works');

    expect(hero?.settings?.button1Style).toBe('outline');
    expect(howItWorks?.settings?.buttonStyle).toBe('outline');
    expect(validateExplicitButtonSlot({
      buttonStyle: howItWorks?.settings?.buttonStyle,
      buttonLinkJson: howItWorks?.settings?.buttonLinkJson,
    })).toBe(true);
  });

  it('keeps legacy external/PDF inference from overriding explicit styles', () => {
    expect(shouldUseUniversalOutlineButtonLink({ href: 'https://example.com', buttonStyle: 'blue' })).toBe(false);
    expect(shouldUseUniversalOutlineButtonLink({ to: '/docs/file.pdf', buttonStyle: 'outline' })).toBe(false);
    expect(shouldUseUniversalOutlineButtonLink({ href: 'https://example.com' })).toBe(true);
  });
});
