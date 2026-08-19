import { describe, expect, it } from 'vitest';
import { getMigratedBlockKinds } from '../blocks/registry';
import {
  MANAGED_ROUTE_AUTHORITY_MANIFEST,
  getBlockAuthority,
  getRouteAuthority,
  validateManagedRouteAuthorityManifest,
} from './managedRouteAuthorityManifest';

describe('managed route authority manifest', () => {
  it('covers every registered managed block kind', () => {
    const result = validateManagedRouteAuthorityManifest(getMigratedBlockKinds());
    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('uses explicit route selection rules for custom and native routes', () => {
    expect(getRouteAuthority('/')).toMatchObject({ id: 'home', routeOwner: 'HomePage', renderer: 'PageBlocksRenderer.blockRenderers' });
    expect(getRouteAuthority('/services')).toMatchObject({ id: 'services', routeOwner: 'ServicesPage' });
    expect(getRouteAuthority('/services/loans')).toMatchObject({ id: 'loans', routeOwner: 'LoansPage' });
    expect(getRouteAuthority('/services/planned-giving/charitable-trusts')).toMatchObject({
      id: 'planned-giving',
      routeOwner: 'NativeContentPage',
      sourceSelector: 'useManagedContentSource',
      composer: 'composeManagedPage',
    });
  });

  it('does not pretend known multi-path families are unambiguous', () => {
    expect(getBlockAuthority('card_grid', '/services/loans')).toMatchObject({ authorityStatus: 'ambiguous' });
    expect(getBlockAuthority('card_grid', '/services/planned-giving/ministry-impact-fund')).toMatchObject({
      authorityStatus: 'confirmed',
      renderer: 'NativeContentPage.buildManagedBlockSection',
      route: { routeOwner: 'NativeContentPage' },
    });
    expect(MANAGED_ROUTE_AUTHORITY_MANIFEST.selectionRules).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'custom-route-owner-wins' }),
      expect.objectContaining({ id: 'ambiguous-is-explicit' }),
    ]));
  });
});
