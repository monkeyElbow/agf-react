import { describe, expect, it } from 'vitest';
import { scanRevisionInventories } from './content-admin-snapshot-audit.mjs';

function block(id, kind = 'content') {
  return { id, kind, mode: 'dynamic', settings: {} };
}

describe('content-admin snapshot audit revision rules', () => {
  it('does not treat historical inventory differences as corruption', () => {
    const findings = [];

    scanRevisionInventories({
      recordLabel: 'fixture',
      record: {
        state: {
          blocksByPath: {
            '/route': [block('current'), block('admin-added')],
          },
        },
        revisionsByPath: {
          '/route': [{
            id: 'historical',
            snapshot: { blocks: [block('old-only')] },
          }],
        },
      },
      findings,
    });

    expect(findings).toEqual([]);
  });

  it('still reports malformed historical inventories', () => {
    const findings = [];

    scanRevisionInventories({
      recordLabel: 'fixture',
      record: {
        revisionsByPath: {
          '/route': [{
            id: 'malformed',
            snapshot: { blocks: [block('duplicate'), block('duplicate')] },
          }],
        },
      },
      findings,
    });

    expect(findings).toEqual([
      expect.objectContaining({
        code: 'revision-inventory-invalid',
        pathname: '/route',
        revisionId: 'malformed',
      }),
    ]);
  });
});
