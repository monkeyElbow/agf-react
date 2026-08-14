import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MANAGED_PATH_ALIASES,
  buildBreadcrumbTrail,
  isValidParent,
  normalizeManagedPathInput,
  normalizePathAliases,
  resolveAliasPath,
  toUniqueBlockId,
} from './contentAdminPathUtilities';

describe('content admin path utilities', () => {
  it('normalizes paths and collapses alias chains without allowing cycles', () => {
    expect(normalizeManagedPathInput('services//loans/')).toBe('/services/loans');
    expect(resolveAliasPath('/old', { '/old': '/older', '/older': '/current' })).toBe('/current');
    expect(resolveAliasPath('/old', { '/old': '/older', '/older': '/old' })).toBe('/old');
    expect(normalizePathAliases({ '/old/': '/new/', '/new': '/current', '/current': '/current' }, {}))
      .toEqual({ '/old': '/current', '/new': '/current' });
  });

  it('preserves the durable default aliases and protects hierarchy parent operations', () => {
    expect(DEFAULT_MANAGED_PATH_ALIASES['/services/legacy-giving']).toBe('/services/planned-giving');
    const hierarchy = {
      '/services': { path: '/services', title: 'Services', parentPath: null },
      '/services/loans': { path: '/services/loans', title: 'Loans', parentPath: '/services' },
    };
    expect(buildBreadcrumbTrail('/services/loans', hierarchy)).toEqual([
      { path: '/services', label: 'Services' },
      { path: '/services/loans', label: 'Loans' },
    ]);
    expect(isValidParent('/services', '/services/loans', hierarchy)).toBe(false);
    expect(isValidParent('/services/loans', '/services', hierarchy)).toBe(true);
  });

  it('creates stable unique IDs without touching existing content IDs', () => {
    const existing = [{ id: 'hero' }, { id: 'hero_2' }];
    expect(toUniqueBlockId('hero', existing)).toBe('hero_3');
    expect(toUniqueBlockId('new block', existing)).toBe('new_block');
  });
});
