import { describe, expect, it } from 'vitest';
import {
  coerceLinkValue,
  coerceLinkValueFromFields,
  linkValueToLinkProps,
  validateActionFieldGroup,
  validateLinkFieldGroups,
  validateLinkValue,
} from './linkValue';

describe('link value helpers', () => {
  it('validates canonical internal and external links', () => {
    expect(validateLinkValue({ kind: 'internal', to: '/services/loans' }).valid).toBe(true);
    expect(validateLinkValue({ kind: 'external', href: 'https://www.agfinancial.org' }).valid).toBe(true);
    expect(validateLinkValue({ kind: 'external', href: '/services/loans' }).valid).toBe(false);
  });

  it('coerces legacy page refs and URLs into canonical link values', () => {
    expect(coerceLinkValue({ to: '/services/investments' })).toEqual({
      kind: 'internal',
      to: '/services/investments',
      openInNewWindow: false,
    });

    expect(coerceLinkValue({ href: 'mailto:info@agfinancial.org' })).toEqual({
      kind: 'email',
      href: 'mailto:info@agfinancial.org',
      openInNewWindow: false,
    });

    expect(coerceLinkValue({ documentId: 'ministers-plan-pdf' })).toEqual({
      kind: 'document',
      documentId: 'ministers-plan-pdf',
      openInNewWindow: false,
    });
  });

  it('coerces legacy split field groups through one shared field resolver', () => {
    expect(coerceLinkValueFromFields({
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

    expect(coerceLinkValueFromFields({
      browsePath: 'https://example.com',
    }, {
      hrefKeys: ['browsePath'],
    })).toEqual({
      kind: 'external',
      href: 'https://example.com',
      openInNewWindow: false,
    });

    expect(coerceLinkValueFromFields({
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
    expect(validateActionFieldGroup({
      buttonLabel: 'Open dashboard',
      buttonPageRef: '/services/investments',
    }, {
      labelKeys: ['buttonLabel'],
      toKeys: ['buttonPageRef'],
    })).toBe(true);

    expect(validateActionFieldGroup({
      buttonLabel: 'Download packet',
      buttonDocumentId: 'form-planned-giving-will-planning-document',
    }, {
      labelKeys: ['buttonLabel'],
      toKeys: ['buttonPageRef'],
      hrefKeys: ['buttonUrl'],
    })).toBe(true);

    expect(validateActionFieldGroup({
      buttonLabel: 'Start the process',
      buttonAction: 'open_cta_form',
      buttonTargetAnchorId: 'charitable-trusts-inline-form',
    }, {
      labelKeys: ['buttonLabel'],
      actionKeys: ['buttonAction'],
      targetAnchorIdKeys: ['buttonTargetAnchorId'],
      targetBlockIdKeys: ['buttonTargetBlockId'],
    })).toBe(true);

    expect(validateActionFieldGroup({
      buttonLabel: 'Broken external',
      buttonUrl: '/not-external',
    }, {
      labelKeys: ['buttonLabel'],
      hrefKeys: ['buttonUrl'],
    })).toBe(true);

    expect(validateActionFieldGroup({
      buttonLabel: 'Broken external',
      buttonUrl: 'ftp://example.com',
    }, {
      labelKeys: ['buttonLabel'],
      hrefKeys: ['buttonUrl'],
    })).toBe(false);

    expect(validateLinkFieldGroups({
      card1ButtonPageRef: '/services/loans',
      card2ButtonUrl: 'https://example.com',
    }, [
      { toKeys: ['card1ButtonPageRef'] },
      { hrefKeys: ['card2ButtonUrl'] },
    ])).toBe(true);
  });

  it('maps canonical links back into the legacy runtime props used by existing renderers', () => {
    expect(linkValueToLinkProps({ kind: 'internal', to: '/services/retirement' })).toEqual({
      to: '/services/retirement',
      href: undefined,
      documentId: undefined,
      openInNewWindow: false,
    });

    expect(linkValueToLinkProps({ kind: 'external', href: 'https://example.com', openInNewWindow: true })).toEqual({
      to: undefined,
      href: 'https://example.com',
      documentId: undefined,
      openInNewWindow: true,
    });
  });
});
