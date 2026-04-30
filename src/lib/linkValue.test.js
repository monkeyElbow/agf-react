import { describe, expect, it } from 'vitest';
import {
  coerceLegacyLinkValue,
  coerceLegacyLinkValueFromFields,
  linkValueToLegacyLinkProps,
  validateLegacyActionFieldGroup,
  validateLegacyLinkFieldGroups,
  validateLinkValue,
} from './linkValue';

describe('link value helpers', () => {
  it('validates canonical internal and external links', () => {
    expect(validateLinkValue({ kind: 'internal', to: '/services/loans' }).valid).toBe(true);
    expect(validateLinkValue({ kind: 'external', href: 'https://www.agfinancial.org' }).valid).toBe(true);
    expect(validateLinkValue({ kind: 'external', href: '/services/loans' }).valid).toBe(false);
  });

  it('coerces legacy page refs and URLs into canonical link values', () => {
    expect(coerceLegacyLinkValue({ to: '/services/investments' })).toEqual({
      kind: 'internal',
      to: '/services/investments',
      openInNewWindow: false,
    });

    expect(coerceLegacyLinkValue({ href: 'mailto:info@agfinancial.org' })).toEqual({
      kind: 'email',
      href: 'mailto:info@agfinancial.org',
      openInNewWindow: false,
    });

    expect(coerceLegacyLinkValue({ documentId: 'ministers-plan-pdf' })).toEqual({
      kind: 'document',
      documentId: 'ministers-plan-pdf',
      openInNewWindow: false,
    });
  });

  it('coerces legacy split field groups through one shared field resolver', () => {
    expect(coerceLegacyLinkValueFromFields({
      buttonPageRef: '/services/investments',
      buttonOpenInNewWindow: true,
    }, {
      toKeys: ['buttonPageRef'],
      openInNewWindowKeys: ['buttonOpenInNewWindow'],
    })).toEqual({
      kind: 'internal',
      to: '/services/investments',
      openInNewWindow: true,
    });

    expect(coerceLegacyLinkValueFromFields({
      browsePath: 'https://example.com',
    }, {
      hrefKeys: ['browsePath'],
    })).toEqual({
      kind: 'external',
      href: 'https://example.com',
      openInNewWindow: false,
    });

    expect(coerceLegacyLinkValueFromFields({
      buttonPageRef: 'https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf',
    }, {
      toKeys: ['buttonPageRef'],
    })).toEqual({
      kind: 'external',
      href: 'https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf',
      openInNewWindow: false,
    });
  });

  it('keeps transitional action and link validators explicit and narrow', () => {
    expect(validateLegacyActionFieldGroup({
      buttonLabel: 'Open dashboard',
      buttonPageRef: '/services/investments',
    }, {
      labelKeys: ['buttonLabel'],
      toKeys: ['buttonPageRef'],
    })).toBe(true);

    expect(validateLegacyActionFieldGroup({
      buttonLabel: 'Broken external',
      buttonUrl: '/not-external',
    }, {
      labelKeys: ['buttonLabel'],
      hrefKeys: ['buttonUrl'],
    })).toBe(true);

    expect(validateLegacyActionFieldGroup({
      buttonLabel: 'Broken external',
      buttonUrl: 'ftp://example.com',
    }, {
      labelKeys: ['buttonLabel'],
      hrefKeys: ['buttonUrl'],
    })).toBe(false);

    expect(validateLegacyLinkFieldGroups({
      card1ButtonPageRef: '/services/loans',
      card2ButtonUrl: 'https://example.com',
    }, [
      { toKeys: ['card1ButtonPageRef'] },
      { hrefKeys: ['card2ButtonUrl'] },
    ])).toBe(true);
  });

  it('maps canonical links back into the legacy runtime props used by existing renderers', () => {
    expect(linkValueToLegacyLinkProps({ kind: 'internal', to: '/services/retirement' })).toEqual({
      to: '/services/retirement',
      href: undefined,
      documentId: undefined,
      openInNewWindow: false,
    });

    expect(linkValueToLegacyLinkProps({ kind: 'external', href: 'https://example.com', openInNewWindow: true })).toEqual({
      to: undefined,
      href: 'https://example.com',
      documentId: undefined,
      openInNewWindow: true,
    });
  });
});
