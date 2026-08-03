import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';

const SNAPSHOT_FILES = [
  '../../dev-data/content-admin-shared.json',
  '../../dev-data/content-admin-seed-baseline.json',
];

function parseJson(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isOutlineButtonStyle(key, value) {
  if (String(value || '').trim().toLowerCase() !== 'outline') return false;
  if (['buttonStyle', 'button1Style', 'button2Style', 'loginButtonStyle', 'ratesButtonStyle', 'submitStyle'].includes(key)) {
    return true;
  }
  return /(?:card\d+Button\d*Style|col\d+ButtonStyle)$/i.test(key);
}

function buttonPrefix(styleKey) {
  return styleKey.replace(/Style$/, '');
}

function buttonLabel(settings, prefix) {
  if (prefix === 'submit') return settings.submitLabel || 'Submit';
  if (prefix === 'loginButton') return settings.loginLabel || settings.loginButtonLabel || '';
  if (prefix === 'ratesButton') return settings.ratesLabel || settings.ratesButtonLabel || '';
  return settings[`${prefix}Label`] || settings[`${prefix}Text`] || '';
}

function hasRenderableButtonSlot(settings, prefix) {
  if (prefix === 'submit') return true;
  if (prefix === 'loginButton') return settings.showLogin !== false;
  if (prefix === 'ratesButton') return settings.showRates !== false;
  if (buttonLabel(settings, prefix)) return true;
  return [
    `${prefix}LinkJson`,
    `${prefix}Href`,
    `${prefix}Url`,
    `${prefix}PageRef`,
    `${prefix}DocumentId`,
    `${prefix}Action`,
    `${prefix}TargetAnchorId`,
    `${prefix}TargetBlockId`,
  ].some((key) => String(settings[key] || '').trim());
}

function isApprovedOutlineTarget(target) {
  if (target.kind === 'external' || target.kind === 'download') return true;
  return target.kind === 'internal' && String(target.target || '').startsWith('#');
}

function classifyButtonTarget(settings, prefix) {
  const candidates = [];
  const add = (field, value) => {
    if (value && (typeof value === 'object' || String(value).trim())) {
      candidates.push({ field, value });
    }
  };

  add(`${prefix}LinkJson`, parseJson(settings[`${prefix}LinkJson`]));
  add(`${prefix}Href`, settings[`${prefix}Href`]);
  add(`${prefix}Url`, settings[`${prefix}Url`]);
  add(`${prefix}PageRef`, settings[`${prefix}PageRef`]);
  add(`${prefix}DocumentId`, settings[`${prefix}DocumentId`]);
  add(`${prefix}Action`, settings[`${prefix}Action`]);
  add(`${prefix}TargetAnchorId`, settings[`${prefix}TargetAnchorId`]);
  add(`${prefix}TargetBlockId`, settings[`${prefix}TargetBlockId`]);

  if (prefix === 'loginButton') {
    add('loginLinkJson', parseJson(settings.loginLinkJson));
    add('loginHref', settings.loginHref);
    add('loginPath', settings.loginPath);
    add('loginUrl', settings.loginUrl);
  }
  if (prefix === 'ratesButton') {
    add('ratesLinkJson', parseJson(settings.ratesLinkJson));
    add('ratesHref', settings.ratesHref);
    add('ratesPath', settings.ratesPath);
    add('ratesUrl', settings.ratesUrl);
  }

  for (const candidate of candidates) {
    const value = candidate.value;
    if (value && typeof value === 'object') {
      const kind = String(value.kind || '').trim().toLowerCase();
      const target = String(value.to || value.href || value.url || value.pageRef || '').trim();
      const documentId = String(value.documentId || value.fileId || '').trim();
      if (kind === 'document' || documentId) return { kind: 'download', target: documentId || target };
      if (kind === 'external') return { kind: 'external', target };
      if (kind === 'internal' || kind === 'anchor' || target.startsWith('/') || target.startsWith('#')) {
        return { kind: 'internal', target };
      }
      if (/^https?:\/\//i.test(target) || /^(?:mailto|tel):/i.test(target)) {
        return { kind: 'external', target };
      }
      continue;
    }

    const target = String(value || '').trim();
    if (candidate.field.endsWith('DocumentId')) return { kind: 'download', target };
    if (/\.pdf(?:$|[?#])/i.test(target) || /files\.agfinancial\.org/i.test(target)) {
      return { kind: 'download', target };
    }
    if (/^https?:\/\//i.test(target) || /^(?:mailto|tel):/i.test(target)) return { kind: 'external', target };
    if (target.startsWith('/') || target.startsWith('#')) return { kind: 'internal', target };
    if (candidate.field.endsWith('Action') || candidate.field.endsWith('TargetAnchorId') || candidate.field.endsWith('TargetBlockId')) {
      return { kind: 'internal-action', target };
    }
  }

  return { kind: 'none', target: '' };
}

function collectOutlineButtonViolations(blocksByPath, sourceLabel) {
  return Object.entries(blocksByPath || {}).flatMap(([pathname, blocks]) => (
    (Array.isArray(blocks) ? blocks : []).flatMap((block) => {
      const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
      return Object.entries(settings).flatMap(([key, value]) => {
        if (!isOutlineButtonStyle(key, value)) return [];
        const prefix = buttonPrefix(key);
        if (!hasRenderableButtonSlot(settings, prefix)) return [];
        const target = classifyButtonTarget(settings, prefix);
        if (isApprovedOutlineTarget(target)) return [];
        return [{
          source: sourceLabel,
          pathname,
          blockId: block?.id,
          key,
          label: buttonLabel(settings, prefix),
          targetKind: target.kind,
          target: target.target,
        }];
      });
    })
  ));
}

describe('button style policy guardrail', () => {
  it('uses outline buttons only for external, download, or same-page anchor targets', () => {
    const sources = [
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
    const violations = sources.flatMap(([sourceLabel, blocksByPath]) => (
      collectOutlineButtonViolations(blocksByPath, sourceLabel)
    ));

    expect(violations).toEqual([]);
  });

  it('does not permit ordinary internal route links as outline targets', () => {
    expect(isApprovedOutlineTarget({ kind: 'internal', target: '#traditional-daf-form' })).toBe(true);
    expect(isApprovedOutlineTarget({ kind: 'internal', target: '/services/contact' })).toBe(false);
  });
});
