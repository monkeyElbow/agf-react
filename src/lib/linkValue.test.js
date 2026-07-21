import { describe, expect, it } from 'vitest';
import {
  coerceLinkValue,
  coerceLinkValueFromFields,
  getCanonicalLinkJsonFieldId,
  linkValueToLinkProps,
  normalizeSplitLinkFieldSettings,
  parseLinkValueJson,
  resolveEditableHrefFromLinkFields,
  resolveRouteRefFromLinkFields,
  serializeLinkValue,
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
    expect(getCanonicalLinkJsonFieldId('button')).toBe('buttonLinkJson');

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

  it('prefers canonical link JSON over split compatibility fields when present', () => {
    const linkJson = serializeLinkValue({
      kind: 'internal',
      to: '/services/loans',
      openInNewWindow: true,
    });

    expect(parseLinkValueJson(linkJson)).toEqual({
      kind: 'internal',
      to: '/services/loans',
      openInNewWindow: true,
    });

    expect(coerceLinkValueFromFields({
      buttonLinkJson: linkJson,
      buttonUrl: 'https://example.com',
      buttonPageRef: '',
      buttonOpenInNewWindow: false,
    }, {
      hrefKeys: ['buttonUrl'],
      toKeys: ['buttonPageRef'],
      openInNewWindowKeys: ['buttonOpenInNewWindow'],
    })).toEqual({
      kind: 'internal',
      to: '/services/loans',
      openInNewWindow: true,
    });

    expect(resolveEditableHrefFromLinkFields({
      buttonLinkJson: linkJson,
      buttonUrl: '/old-path',
      buttonPageRef: '/old-path',
    }, {
      hrefKeys: ['buttonUrl'],
      toKeys: ['buttonPageRef'],
    })).toBe('/services/loans');

    expect(resolveRouteRefFromLinkFields({
      buttonLinkJson: '{"kind":"external","openInNewWindow":false,"href":"https://example.com"}',
      buttonUrl: '/old-path',
      buttonPageRef: '/old-path',
    }, {
      hrefKeys: ['buttonUrl'],
      toKeys: ['buttonPageRef'],
    })).toBe('');
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

  it('normalizes transitional split link settings before persistence', () => {
    expect(normalizeSplitLinkFieldSettings({
      buttonUrl: '/stale-path',
      buttonPageRef: '/contact-us',
      buttonOpenInNewWindow: 'false',
      button2Url: '/services/loans',
      button2PageRef: '',
      button2OpenInNewWindow: 'yes',
      button3Url: '',
      button3PageRef: '#anchor',
      button4Url: 'https://example.com/old',
      button4PageRef: '/current-page',
    })).toEqual({
      buttonUrl: '/contact-us',
      buttonPageRef: '/contact-us',
      buttonOpenInNewWindow: false,
      buttonLinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}',
      button2Url: '/services/loans',
      button2PageRef: '/services/loans',
      button2OpenInNewWindow: true,
      button2LinkJson: '{"kind":"internal","openInNewWindow":true,"to":"/services/loans"}',
      button3Url: '#anchor',
      button3PageRef: '',
      button3LinkJson: '{"kind":"anchor","openInNewWindow":false,"href":"#anchor"}',
      button4Url: '/current-page',
      button4PageRef: '/current-page',
      button4LinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/current-page"}',
    });
  });
});
