import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BlockOwnershipOverlay, { getBlockOwnershipVisual, isForeignOwnedBlockOwnership } from '../BlockOwnershipOverlay';
import FrontHudAnchorTag from '../FrontHudAnchorTag';
import {
  createInitialFormValues,
  validateRequiredFormFields,
} from '../../blocks/foundation/forms';
import { useContentAdmin } from '../../context/ContentAdminContext';
import {
  getDynamicColumnWidthShare,
  getVisibleDynamicColumnSlots,
  toDynamicColumnsCountToken,
} from '../../lib/dynamicColumns';
import {
  buildDynamicCtaPresentationClassName,
  buildDynamicCtaFormFromBlock,
  buildDynamicFeaturePanelFromBlock,
  buildDynamicImpactStatFromBlock,
  buildDynamicRequestFormFromBlock,
  buildDynamicServicesGridFromBlock,
  buildDynamicSiteFeatureFromBlock,
  buildDynamicTopStripFromBlock,
  isExternalLinkHref,
} from '../../lib/dynamicPageBlocks';
import {
  normalizeButtonTone,
  normalizePanelTextTone as normalizeSharedPanelTextTone,
  normalizeSemanticTextColorClass,
  normalizeSurfaceBgTone,
} from '../../lib/colorSystem';
import {
  buildPresetFamilyRuntimeClassName,
  resolvePresetFamilyClassToken,
} from '../../lib/presetFamilyContract';
import DynamicRequestFormSection from '../DynamicRequestFormSection';
import { HeroInlineLiveEditor, renderHeroRangesAsNodes } from '../HeroHudEditorShared';
import HomeImpactStoryFeature, { HomeImpactStoryStaticContent } from '../HomeImpactStoryFeature';
import HomeServicesFeatureAnimation from '../HomeServicesFeatureAnimation';
import ImpactProofStoryFeature from '../ImpactProofStoryFeature';
import InvestmentsGrowthFeature from '../InvestmentsGrowthFeature';
import LegacyGivingStewardshipStoryFeature from '../LegacyGivingStewardshipStoryFeature';
import NewsletterSignupForm from '../NewsletterSignupForm';
import { extractHeroLineColorToken } from '../../lib/heroHudRanges';
import {
  normalizeHeroTitleLetterSpacingEm,
  heroTitleSizeRemToRuntimeCss,
  normalizeHeroTitleSizeRem,
} from '../../lib/heroTitleSize';

const ACTION_BUTTON_STYLE_SET = new Set(['blue', 'dark', 'outline']);
const DYNAMIC_COLUMNS_TYPE_SET = new Set(['text', 'photo']);
const DYNAMIC_COLUMNS_STYLE_SET = new Set(['retirement', 'legacy-highlight', 'loans-value']);
const HOME_HERO_PRIMARY_LINE_SIZE_CSS = 'clamp(3.4rem, 11vw, 8rem)';
const EMPTY_OWNERSHIP = Object.freeze({
  className: '',
  overlayLabel: '',
  overlayDetail: '',
  state: 'none',
  isOwnedByOther: false,
  owner: null,
});

function SharedBlockHudAnchor({ hudAnchor }) {
  if (!hudAnchor) {
    return null;
  }

  return (
    <FrontHudAnchorTag
      label={hudAnchor.label}
      isActive={hudAnchor.isActive}
      onClick={hudAnchor.onClick}
      style={hudAnchor.style}
    />
  );
}

function normalizeToneClass(value) {
  return normalizeSemanticTextColorClass(value);
}

function normalizePanelBgTone(value) {
  return normalizeSurfaceBgTone(value, 'grey');
}

function normalizePanelTextTone(value, fallback = 'dark') {
  return normalizeSharedPanelTextTone(value, fallback);
}

function normalizeRemNumber(value, fallback) {
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) {
    return num;
  }
  return Number(fallback) || 1;
}

function normalizeHeroJustify(value) {
  const token = String(value || '').trim().toLowerCase();
  if (token === 'left' || token === 'right' || token === 'center') {
    return token;
  }
  return 'center';
}

function toBooleanSetting(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const token = value.trim().toLowerCase();
    if (token === 'true') {
      return true;
    }
    if (token === 'false') {
      return false;
    }
  }
  return Boolean(value);
}

function normalizeDynamicColumnsType(value) {
  const token = String(value || '').trim().toLowerCase();
  return DYNAMIC_COLUMNS_TYPE_SET.has(token) ? token : 'text';
}

function normalizeDynamicColumnsStyle(value) {
  const token = String(value || '').trim().toLowerCase();
  return DYNAMIC_COLUMNS_STYLE_SET.has(token) ? token : 'retirement';
}

function normalizePhotoAspect(value) {
  const token = String(value || '').trim().toLowerCase();
  if (token === 'portrait') {
    return '4 / 5';
  }
  if (token === 'landscape' || token === 'wide') {
    return '16 / 10';
  }
  return '1 / 1';
}

function parseHighlightsJson(rawValue, source = '') {
  if (rawValue == null || rawValue === '') {
    return [];
  }
  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => {
        const className = normalizeToneClass(item?.className || '');
        if (Number.isInteger(item?.start) && Number.isInteger(item?.end) && item.end > item.start && className) {
          return {
            start: Math.max(0, Math.min(source.length, item.start)),
            end: Math.max(0, Math.min(source.length, item.end)),
            className,
          };
        }
        if (item?.text && className) {
          return { text: String(item.text), className };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof rawValue !== 'string') {
    return [];
  }
  try {
    const parsed = JSON.parse(rawValue);
    return parseHighlightsJson(parsed, source);
  } catch {
    return [];
  }
}

function renderHighlightedText(source, highlights) {
  const text = String(source || '');
  const rules = Array.isArray(highlights) ? highlights.filter(Boolean) : [];
  if (!text || !rules.length) {
    return text;
  }

  const rangeRules = rules
    .filter((item) => Number.isInteger(item.start) && Number.isInteger(item.end) && item.end > item.start && item.className)
    .map((item) => ({
      start: Math.max(0, Math.min(text.length, item.start)),
      end: Math.max(0, Math.min(text.length, item.end)),
      className: normalizeToneClass(item.className),
    }))
    .filter((item) => item.className && item.end > item.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (rangeRules.length) {
    const pieces = [];
    let cursor = 0;
    let key = 0;
    const nextKey = (prefix) => {
      key += 1;
      return `${prefix}-${key}`;
    };

    rangeRules.forEach((rule) => {
      if (rule.start > cursor) {
        pieces.push(<span key={nextKey('t')}>{text.slice(cursor, rule.start)}</span>);
      }
      const start = Math.max(cursor, rule.start);
      const end = Math.max(start, rule.end);
      if (end > start) {
        pieces.push(
          <mark key={nextKey('m')} className={rule.className}>
            {text.slice(start, end)}
          </mark>,
        );
        cursor = end;
      }
    });

    if (cursor < text.length) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor)}</span>);
    }
    return pieces;
  }

  const textRules = rules
    .map((item) => ({
      text: String(item?.text || ''),
      className: normalizeToneClass(item?.className || ''),
    }))
    .filter((item) => item.text && item.className);

  if (!textRules.length) {
    return text;
  }

  const lower = text.toLowerCase();
  const pieces = [];
  let cursor = 0;
  let key = 0;
  const nextKey = (prefix) => {
    key += 1;
    return `${prefix}-${key}`;
  };

  while (cursor < text.length) {
    let next = null;

    textRules.forEach((rule) => {
      const needle = rule.text.toLowerCase();
      const idx = lower.indexOf(needle, cursor);
      if (idx < 0) {
        return;
      }
      if (!next || idx < next.index) {
        next = { index: idx, rule, length: needle.length };
      }
    });

    if (!next) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor)}</span>);
      break;
    }

    if (next.index > cursor) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor, next.index)}</span>);
    }

    pieces.push(
      <mark key={nextKey('m')} className={next.rule.className}>
        {text.slice(next.index, next.index + next.length)}
      </mark>,
    );

    cursor = next.index + next.length;
  }

  return pieces;
}

function renderTextWithStrong(source) {
  const text = String(source || '');
  if (!text.includes('**')) {
    return text;
  }

  const chunks = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return chunks.map((chunk, index) => {
    const isStrong = chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4;
    if (!isStrong) {
      return <span key={`t-${index}`}>{chunk}</span>;
    }
    return <strong key={`s-${index}`}>{chunk.slice(2, -2)}</strong>;
  });
}

function TopStripBlock({ block, resolveTo, ownership, hudAnchor }) {
  const runtime = buildDynamicTopStripFromBlock(block);
  if (!runtime) {
    return null;
  }

  const ratesTo = runtime.ratesIsExternal ? runtime.ratesPath : resolveTo(runtime.ratesPath, '/rates');
  const loginTarget = runtime.loginOpenInNewWindow ? '_blank' : undefined;
  const ratesTarget = runtime.ratesOpenInNewWindow ? '_blank' : undefined;
  const rateRel = ratesTarget ? 'noreferrer noopener' : undefined;
  const loginRel = loginTarget ? 'noreferrer noopener' : undefined;
  const stripClassName = `home-native-strip is-bg-${runtime.bgTone} is-text-${runtime.textTone}`;
  const loginClassName = `home-native-strip-login-btn is-style-${runtime.loginStyle} is-tone-${runtime.loginTone}`;
  const ratesClassName = `home-native-strip-rates is-style-${runtime.ratesStyle} is-tone-${runtime.ratesTone}`;

  return (
    <section
      className={`${stripClassName}${ownership?.className || ''}`}
      data-block-id={block?.id || undefined}
      style={{ '--strip-font-size': `${runtime.sectionFontSizeRem}rem`, '--strip-item-gap': `${runtime.itemGapRem}rem` }}
    >
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="home-native-strip-fluid">
        {runtime.showLogin ? (
          <a href={runtime.loginHref} target={loginTarget} rel={loginRel} className={loginClassName}>
            {runtime.loginLabel}
          </a>
        ) : null}
        <div className="home-native-strip-right">
          {runtime.showPhone ? <a href={runtime.phoneHref} className="home-native-strip-phone">{runtime.phone}</a> : null}
          {runtime.showRates ? (
            runtime.ratesIsExternal ? (
              <a href={ratesTo} target={ratesTarget} rel={rateRel} className={ratesClassName}>{runtime.ratesLabel}</a>
            ) : (
              <Link to={ratesTo} target={ratesTarget} rel={rateRel} className={ratesClassName}>{runtime.ratesLabel}</Link>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

function HeroBlock({ block, resolveTo, heroHud, ownership, hudAnchor }) {
  const legacyLine1Text = [String(block.eyebrowPrefix || '').trim(), String(block.highlight || '').trim()]
    .filter(Boolean)
    .join(' ')
    .trim();
  const legacyLine2Text = [String(block.titlePrefix || '').trim(), String(block.accentWord || '').trim()]
    .filter(Boolean)
    .join(' ')
    .trim();
  const line1Text = String(
    block.line1Text
    || block.eyebrow
    || (legacyLine1Text ? `${legacyLine1Text}.` : ''),
  ).trim();
  const line2Text = String(
    block.line2Text
    || block.title
    || (legacyLine2Text ? `${legacyLine2Text}.` : ''),
  ).trim();
  const legacyLine1Highlight = String(block.highlight || '').trim() || 'investment';
  const legacyLine2Highlight = String(block.accentWord || '').trim() || 'church';
  let line1Highlights = parseHighlightsJson(block.line1HighlightsJson, line1Text);
  let line2Highlights = parseHighlightsJson(block.line2HighlightsJson, line2Text);
  if (!line1Highlights.length && line1Text && legacyLine1Highlight) {
    line1Highlights = parseHighlightsJson(
      JSON.stringify([{ text: legacyLine1Highlight, className: 'is-atlantean' }]),
      line1Text,
    );
  }
  if (!line2Highlights.length && line2Text && legacyLine2Highlight) {
    line2Highlights = parseHighlightsJson(
      JSON.stringify([{ text: legacyLine2Highlight, className: 'is-mango' }]),
      line2Text,
    );
  }
  const line3Text = String(block.line3Text || '').trim();
  const line3Highlights = parseHighlightsJson(block.line3HighlightsJson, line3Text);
  const line1ClassName = String(block.line1ClassName || 'home-native-eyebrow').trim() || 'home-native-eyebrow';
  const line2ClassName = String(block.line2ClassName || 'home-native-title line1 line2').trim() || 'home-native-title line1 line2';
  const line3ClassName = String(block.line3ClassName || 'home-native-title line3').trim() || 'home-native-title line3';
  const lineHeight = Number.isFinite(Number(block.lineHeight)) ? Number(block.lineHeight) : 0.9;
  const heroTitleSize = heroTitleSizeRemToRuntimeCss(normalizeHeroTitleSizeRem(block.titleSizeRem));
  const heroTitleLetterSpacing = `${normalizeHeroTitleLetterSpacingEm(block.titleLetterSpacingEm)}em`;
  const bgTone = normalizePanelBgTone(block.bgTone || 'white');
  const justify = ['left', 'center', 'right'].includes(String(block.justify || '').trim().toLowerCase())
    ? String(block.justify || '').trim().toLowerCase()
    : 'left';
  const heroClassName = `home-native-hero is-bg-${bgTone} is-justify-${justify}`;
  const liveLines = [
    {
      key: 'line1',
      label: 'Line 1',
      text: line1Text,
      className: line1ClassName,
      fontSize: HOME_HERO_PRIMARY_LINE_SIZE_CSS,
      lineColor: extractHeroLineColorToken(line1ClassName),
      highlights: line1Highlights,
    },
    {
      key: 'line2',
      label: 'Line 2',
      text: line2Text,
      className: line2ClassName,
      fontSize: heroTitleSize,
      lineColor: extractHeroLineColorToken(line2ClassName),
      highlights: line2Highlights,
    },
    {
      key: 'line3',
      label: 'Line 3',
      text: line3Text,
      className: line3ClassName,
      fontSize: heroTitleSize,
      lineColor: extractHeroLineColorToken(line3ClassName),
      highlights: line3Highlights,
    },
  ];
  const visibleLiveLines = heroHud?.isEditing
    ? liveLines
    : liveLines.filter((line) => String(line.text || '').trim());
  const ctaLabel = String(block.button1Label || block.ctaLabel || 'Contact us').trim();
  const rawCtaTarget = String(
    block.button1Url
    || block.button1PageRef
    || block.ctaPath
    || '/contact-us',
  ).trim();
  const openInNewWindow = Boolean(block.button1OpenInNewWindow);
  const isExternal = /^(https?:|mailto:|tel:)/i.test(rawCtaTarget);
  const ctaTarget = isExternal ? rawCtaTarget : resolveTo(rawCtaTarget, '/contact-us');

  return (
    <section
      ref={heroHud?.sectionRef || undefined}
      className={`${heroClassName}${ownership?.className || ''}`}
      data-block-id={block?.id || undefined}
    >
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail">
        {heroHud?.isEditing ? (
          <HeroInlineLiveEditor
            lines={visibleLiveLines}
            activeLineKey={heroHud?.activeLineKey || ''}
            fontSize={heroTitleSize}
            lineHeight={lineHeight}
            letterSpacing={block.titleLetterSpacingEm}
            onLineTextChange={heroHud.onLineTextChange}
            commitOnBlurOnly={heroHud?.commitOnBlurOnly === true}
            readOnly={isForeignOwnedBlockOwnership(ownership)}
            onLineInteract={heroHud.onLineInteract}
            setLineInputRef={heroHud.setLineInputRef}
            renderLineContent={(line) => renderHeroRangesAsNodes(line.text, line.highlights)}
            resolveLineClassName={(line, index) => line.className || `line${index + 1}`}
            resolveLineTagName={(line) => (line.key === 'line1' ? 'p' : 'h1')}
          />
        ) : (
          <>
            {line1Text ? (
              <p
                className={line1ClassName}
                style={{ lineHeight, fontSize: HOME_HERO_PRIMARY_LINE_SIZE_CSS, letterSpacing: heroTitleLetterSpacing }}
              >
                {line1Highlights.length ? renderHighlightedText(line1Text, line1Highlights) : line1Text}
              </p>
            ) : null}
            {line2Text ? (
              <h1 className={line2ClassName} style={{ lineHeight, fontSize: heroTitleSize, letterSpacing: heroTitleLetterSpacing }}>
                {line2Highlights.length ? renderHighlightedText(line2Text, line2Highlights) : line2Text}
              </h1>
            ) : null}
            {line3Text ? (
              <h1 className={line3ClassName} style={{ lineHeight, fontSize: heroTitleSize, letterSpacing: heroTitleLetterSpacing }}>
                {line3Highlights.length ? renderHighlightedText(line3Text, line3Highlights) : line3Text}
              </h1>
            ) : null}
          </>
        )}
        {ctaLabel ? (
          isExternal ? (
            <a
              href={ctaTarget}
              target={openInNewWindow ? '_blank' : undefined}
              rel={openInNewWindow ? 'noreferrer noopener' : undefined}
              className="home-native-cta"
            >
              {ctaLabel}
            </a>
          ) : (
            <Link
              to={ctaTarget}
              target={openInNewWindow ? '_blank' : undefined}
              rel={openInNewWindow ? 'noreferrer noopener' : undefined}
              className="home-native-cta"
            >
              {ctaLabel}
            </Link>
          )
        ) : null}
      </div>
    </section>
  );
}

function ServicesGridBlock({ block, resolveTo, ownership, hudAnchor }) {
  const runtime = buildDynamicServicesGridFromBlock(block);
  if (!runtime) {
    return null;
  }

  return (
    <section
      className={`home-native-services${ownership?.className || ''}`}
      data-block-id={block.id || 'services_grid'}
      style={{
        '--home-services-heading-size': `${runtime.headingSizeRem}rem`,
        '--home-services-card-title-size': `${runtime.cardTitleSizeRem}rem`,
        '--home-services-card-padding-y': `${runtime.cardPaddingRem}rem`,
      }}
    >
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail">
        <h2>{runtime.heading}</h2>
        <div className="home-native-services-grid">
          {runtime.cards.map((card) => {
            const cardTarget = resolveTo(card.path, '/services');
            const isExternal = isExternalLinkHref(cardTarget);

            return (
              <article key={card.path || card.title} className={`home-native-card fade-up${card.featured ? ' is-featured' : ''}`}>
                {isExternal ? (
                  <a
                    href={cardTarget}
                    className="home-native-card-hitarea"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                ) : (
                  <Link
                    to={cardTarget}
                    className="home-native-card-hitarea"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                )}
                <img src={card.image} alt={card.imageAlt || ''} loading="lazy" />
                <h3>
                  {isExternal ? (
                    <a href={cardTarget}>{card.title}</a>
                  ) : (
                    <Link to={cardTarget}>{card.title}</Link>
                  )}
                </h3>
                {isExternal ? (
                  <a href={cardTarget} className="home-native-card-action">{card.action}</a>
                ) : (
                  <Link to={cardTarget} className="home-native-card-action">{card.action}</Link>
                )}
              </article>
            );
          })}
        </div>
        <div className="home-native-browse-wrap">
          {isExternalLinkHref(resolveTo(runtime.browsePath, '/services')) ? (
            <a href={resolveTo(runtime.browsePath, '/services')} className="home-native-browse-link">{runtime.browseLabel}</a>
          ) : (
            <Link to={resolveTo(runtime.browsePath, '/services')} className="home-native-browse-link">{runtime.browseLabel}</Link>
          )}
        </div>
      </div>
    </section>
  );
}

function ImpactStatBlock({ block, resolveTo, ownership, hudAnchor }) {
  const runtime = buildDynamicImpactStatFromBlock(block);
  if (!runtime) {
    return null;
  }

  return (
    <section className={`home-native-impact${ownership?.className || ''}`} data-block-id={block.id || 'impact_stat'}>
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <HomeImpactStoryStaticContent
        headline={`${runtime.titlePrefix} ${runtime.highlight}.`}
        highlightedWord={runtime.highlight}
        body={runtime.body}
        action={runtime.action}
        metrics={runtime.stats}
        resolveTo={resolveTo}
        countUp={runtime.countUp}
        reveal
      />
    </section>
  );
}

function normalizeActionButtonStyle(value) {
  const token = String(value || '').trim().toLowerCase();
  return ACTION_BUTTON_STYLE_SET.has(token) ? token : 'blue';
}

function normalizeActionButtonTone(value, fallback = 'atlantean') {
  return normalizeButtonTone(value, fallback);
}

function toActionButtonClassName(style, tone) {
  const normalizedStyle = normalizeActionButtonStyle(style);
  const defaultTone = normalizedStyle === 'dark' ? 'super-grey' : 'atlantean';
  const normalizedTone = normalizedStyle === 'outline'
    ? normalizeActionButtonTone(tone, defaultTone)
    : defaultTone;
  return [
    normalizedStyle === 'dark' ? 'is-dark' : '',
    normalizedStyle === 'outline' ? 'is-outline' : '',
    `is-tone-${normalizedTone}`,
  ].filter(Boolean).join(' ');
}

function buildColumnsAction(label, url, style, tone, pageRef, resolveTo, useFamilyPresetCtaStyle = false) {
  const nextLabel = String(label || '').trim();
  const nextUrl = String(url || '').trim();
  if (!nextLabel || !nextUrl) {
    return null;
  }

  const isExternal = /^(https?:|mailto:|tel:)/i.test(nextUrl);
  const className = useFamilyPresetCtaStyle
    ? 'home-native-cta'
    : `service-native-btn ${toActionButtonClassName(style, tone)}`.trim();

  if (isExternal) {
    return {
      label: nextLabel,
      href: nextUrl,
      className,
    };
  }

  return {
    label: nextLabel,
    to: pageRef ? resolveTo(pageRef, nextUrl) : nextUrl,
    className,
  };
}

function ColumnsAction({ item }) {
  if (!item) {
    return null;
  }

  if (item.href) {
    return (
      <a href={item.href} className={item.className} target="_blank" rel="noreferrer noopener">
        {item.label}
      </a>
    );
  }

  return (
    <Link to={item.to || '/'} className={item.className}>
      {item.label}
    </Link>
  );
}

function buildLegacyHomeCtaFields(block) {
  return [
    {
      id: 'field1',
      label: 'Name',
      type: 'text',
      placeholder: '',
      required: true,
      options: [],
    },
    {
      id: 'field2',
      label: 'Email',
      type: 'email',
      placeholder: '',
      required: true,
      options: [],
    },
    {
      id: 'field3',
      label: 'Phone',
      type: 'tel',
      placeholder: String(block.phonePlaceholder || '(555) 555-5555').trim(),
      required: false,
      options: [],
    },
    {
      id: 'field4',
      label: 'Message',
      type: 'textarea',
      placeholder: String(block.messagePlaceholder || 'What would you like to discuss?').trim(),
      required: false,
      options: [],
    },
  ];
}

function CtaFormBlock({ block, ownership, hudAnchor }) {
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const explicitTitle = String(block.title || '').trim();
  const legacyTitle = [
    String(block.headingPrefix || '').trim(),
    String(block.headingHighlight || '').trim(),
    String(block.headingSuffix || block.heading || '').trim(),
  ].filter(Boolean).join(' ').trim();
  const runtime = useMemo(() => (
    buildDynamicCtaFormFromBlock(
      {
        ...block,
        kind: block.kind || block.type || 'cta_form',
        mode: block.mode || 'dynamic',
        title: explicitTitle || legacyTitle,
        bodyHtml: String(block.bodyHtml || '').trim()
          || (String(block.note || '').trim() ? `<p>${String(block.note || '').trim()}</p>` : ''),
        submitLabel: String(block.submitLabel || '').trim() || String(block.buttonLabel || '').trim(),
      },
      {
        fallbackFields: buildLegacyHomeCtaFields(block),
      },
    )
  ), [block, explicitTitle, legacyTitle]);
  const fields = Array.isArray(runtime?.fields) ? runtime.fields : [];

  useEffect(() => {
    setValues(createInitialFormValues(fields, { multiValueTypes: ['multiselect'], booleanTypes: ['checkbox'] }));
    setSubmitted(false);
    setErrorMessage('');
  }, [fields]);

  if (!runtime) {
    return null;
  }

  const resolvedTitle = String(runtime.title || '').trim();
  const bodyHtml = String(runtime.bodyHtml || '').trim();
  const subtitle = String(runtime.subtitle || '').trim();
  const bgTone = normalizePanelBgTone(runtime.bgTone || 'white');
  const submitLabel = String(runtime.submitLabel || '').trim() || 'Follow-up with me';
  const successMessage = String(runtime.successMessage || '').trim() || 'Thanks. We will reach out soon.';
  const salesforceUrl = String(runtime.salesforceUrl || '').trim();
  const presentationClassName = buildDynamicCtaPresentationClassName(runtime);
  const submitClassName = [
    toActionButtonClassName(runtime.submitStyle, runtime.submitTone),
    String(block.submitClassName || '').trim(),
  ].filter(Boolean).join(' ');
  const submitButtonClassName = `service-native-btn${submitClassName ? ` ${submitClassName}` : ''}`;

  const onChangeField = (fieldId, nextValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: nextValue }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validate = () => {
    return validateRequiredFormFields(fields, values, {
      multiValueTypes: ['multiselect'],
      booleanTypes: ['checkbox'],
      resolveMessage: (field) => `Please complete "${field.label}" before submitting.`,
    });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const nextError = validate();
    if (nextError) {
      setErrorMessage(nextError);
      return;
    }
    setErrorMessage('');
    setSubmitted(true);
    setValues(createInitialFormValues(fields, { multiValueTypes: ['multiselect'], booleanTypes: ['checkbox'] }));
  };

  return (
    <section
      className={`service-native-section native-dynamic-cta is-bg-${bgTone}${presentationClassName ? ` ${presentationClassName}` : ''}${ownership?.className || ''}`}
      data-block-id={block?.id || undefined}
      data-cta-display-mode={runtime?.displayMode || 'default'}
      data-cta-trigger-mode={runtime?.triggerMode || 'default'}
    >
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail">
        {resolvedTitle ? (
          <div className="native-info-section-copy">
            {resolvedTitle ? (
              <h2 className={String(runtime.titleClassName || '').trim() || undefined}>
                {renderHighlightedText(resolvedTitle, runtime.titleHighlights || [])}
              </h2>
            ) : null}
            {subtitle ? <p className="native-info-section-subtitle">{subtitle}</p> : null}
          </div>
        ) : null}

        {submitted ? (
          <div
            className="native-info-inline-form dynamic-cta-form"
            aria-label={resolvedTitle || 'CTA form'}
            data-cta-state="success"
            data-cta-display-mode={runtime?.displayMode || 'default'}
            data-cta-trigger-mode={runtime?.triggerMode || 'default'}
          >
            <div className="dynamic-cta-form-success" role="status">
              <h5>Thank you.</h5>
              <p>{successMessage}</p>
              {salesforceUrl ? (
                <p className="dynamic-cta-form-salesforce-note">Salesforce endpoint saved for future wiring: {salesforceUrl}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            className="native-info-inline-form dynamic-cta-form"
            aria-label={resolvedTitle || 'CTA form'}
            data-cta-state="ready"
            data-cta-display-mode={runtime?.displayMode || 'default'}
            data-cta-trigger-mode={runtime?.triggerMode || 'default'}
          >
            <form onSubmit={onSubmit} noValidate>
              {fields.map((field) => {
                const fieldId = `home-dynamic-cta-${field.id}`;
                const options = Array.isArray(field.options) ? field.options : [];

                if (field.type === 'multiselect') {
                  const selectedValues = Array.isArray(values[field.id]) ? values[field.id] : [];
                  return (
                    <label key={field.id} htmlFor={fieldId}>
                      {field.label}
                      <select
                        id={fieldId}
                        multiple
                        size={Math.min(Math.max(options.length || 3, 3), 8)}
                        value={selectedValues}
                        onChange={(event) => {
                          const nextValues = Array.from(event.target.selectedOptions || []).map((option) => option.value);
                          onChangeField(field.id, nextValues);
                        }}
                        required={Boolean(field.required)}
                      >
                        {options.map((option) => (
                          <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.type === 'select') {
                  return (
                    <label key={field.id} htmlFor={fieldId}>
                      {field.label}
                      <select
                        id={fieldId}
                        value={String(values[field.id] || '')}
                        onChange={(event) => onChangeField(field.id, event.target.value)}
                        required={Boolean(field.required)}
                      >
                        <option value="">{field.placeholder || 'Select one'}</option>
                        {options.map((option) => (
                          <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.type === 'textarea') {
                  return (
                    <label key={field.id} htmlFor={fieldId}>
                      {field.label}
                      <textarea
                        id={fieldId}
                        rows={4}
                        value={values[field.id] || ''}
                        onChange={(event) => onChangeField(field.id, event.target.value)}
                        placeholder={field.placeholder || undefined}
                        required={Boolean(field.required)}
                      />
                    </label>
                  );
                }

                if (field.type === 'checkbox') {
                  return (
                    <label key={field.id} htmlFor={fieldId} className="dynamic-cta-checkbox-field">
                      <span>{field.label}</span>
                      <input
                        id={fieldId}
                        type="checkbox"
                        checked={Boolean(values[field.id])}
                        onChange={(event) => onChangeField(field.id, event.target.checked)}
                        required={Boolean(field.required)}
                      />
                    </label>
                  );
                }

                return (
                  <label key={field.id} htmlFor={fieldId}>
                    {field.label}
                    <input
                      id={fieldId}
                      type={field.type || 'text'}
                      value={values[field.id] || ''}
                      onChange={(event) => onChangeField(field.id, event.target.value)}
                      placeholder={field.placeholder || undefined}
                      required={Boolean(field.required)}
                    />
                  </label>
                );
              })}
              {errorMessage ? <p className="dynamic-cta-form-error" role="alert">{errorMessage}</p> : null}
              {bodyHtml ? (
                <div className="native-info-rich-html dynamic-cta-form-callout" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              ) : null}
              <button type="submit" className={submitButtonClassName}>{submitLabel}</button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function NewsletterBlock({ block, ownership, hudAnchor }) {
  const bgTone = normalizePanelBgTone(block.bgTone);
  const textTone = normalizePanelTextTone(
    block.textTone,
    bgTone === 'white' || bgTone === 'sand' ? 'dark' : 'white',
  );
  const legacyHeadingPrefix = String(block.headingPrefix || block.heading || '').trim();
  const legacyHeadingHighlight = String(block.headingHighlight || '').trim();
  const title = String(block.title || '').trim() || [legacyHeadingPrefix, legacyHeadingHighlight].filter(Boolean).join(' ').trim();
  const titleClassName = normalizeToneClass(block.titleClassName || '');
  const titleHighlights = parseHighlightsJson(
    block.titleHighlightsJson,
    title,
  );
  const bodyHtml = String(block.bodyHtml || '').trim();
  const body = String(block.body || '').trim();

  return (
    <section className={`home-native-newsletter is-bg-${bgTone} is-text-${textTone}${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail">
        <h2 className={titleClassName || undefined}>
          {titleHighlights.length ? renderHighlightedText(title, titleHighlights) : title}
        </h2>
        {bodyHtml ? (
          <div className="home-native-newsletter-copy" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        ) : body ? (
          <p>{body}</p>
        ) : null}
        <div className="home-native-newsletter-embed" aria-label="Newsletter signup form">
          <NewsletterSignupForm className="is-home-newsletter" />
        </div>
      </div>
    </section>
  );
}

function SiteFeatureBlock({ block, resolveTo, ownership, hudAnchor }) {
  const runtime = buildDynamicSiteFeatureFromBlock({
    ...block,
    kind: block.kind || block.type || 'site_feature',
    mode: block.mode || 'dynamic',
  });
  if (!runtime) {
    return null;
  }

  const action = runtime.action
    ? buildColumnsAction(
      runtime.action.label,
      runtime.action.href || runtime.action.to,
      runtime.action.style,
      runtime.action.tone,
      runtime.action.to,
      resolveTo,
    )
    : null;

  if (runtime.runtimeKey === 'home_impact_story') {
    return (
      <section className={`home-native-impact home-impact-story${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
        <BlockOwnershipOverlay ownership={ownership} />
        <SharedBlockHudAnchor hudAnchor={hudAnchor} />
        <HomeImpactStoryFeature
          headline={runtime.title}
          body={runtime.body}
          action={runtime.action}
          metrics={runtime.metrics}
          resolveTo={resolveTo}
        />
      </section>
    );
  }

  if (runtime.runtimeKey === 'home_services_feature_animation') {
    return (
      <section className={`home-services-feature${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
        <BlockOwnershipOverlay ownership={ownership} />
        <SharedBlockHudAnchor hudAnchor={hudAnchor} />
        <HomeServicesFeatureAnimation
          headline={runtime.title}
          subhead={runtime.subhead}
          panels={runtime.panels}
          resolveTo={resolveTo}
        />
      </section>
    );
  }

  if (runtime.runtimeKey === 'legacy_giving_stewardship_story') {
    return (
      <section className={`service-native-section legacy-giving-stewardship legacy-stewardship-story${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
        <BlockOwnershipOverlay ownership={ownership} />
        <SharedBlockHudAnchor hudAnchor={hudAnchor} />
        <LegacyGivingStewardshipStoryFeature
          headline={runtime.title}
          beats={runtime.beats}
          action={runtime.action}
          resolveTo={resolveTo}
        />
      </section>
    );
  }

  if (runtime.runtimeKey === 'impact_proof_story') {
    return (
      <section className={`service-native-section impact-native-stats impact-proof-story${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
        <BlockOwnershipOverlay ownership={ownership} />
        <SharedBlockHudAnchor hudAnchor={hudAnchor} />
        <ImpactProofStoryFeature
          headline={runtime.title}
          body={runtime.body}
          action={runtime.action}
          metrics={runtime.metrics}
          resolveTo={resolveTo}
        />
      </section>
    );
  }

  if (runtime.runtimeKey === 'investments_growth_feature') {
    return (
      <InvestmentsGrowthFeature
        blockId={block?.id || 'growth_feature'}
        runtime={runtime}
        resolveTo={resolveTo}
        ownership={ownership}
        hudAnchor={hudAnchor}
      />
    );
  }

  return (
    <section className={`service-native-section native-dynamic-site-feature${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail">
        <div className="service-native-dark-feature">
          <div className="service-native-dark-feature-inner">
            <div
              className="service-native-dark-feature-media"
              style={runtime.imageUrl ? { backgroundImage: `url(${runtime.imageUrl})` } : undefined}
              role={runtime.imageAlt ? 'img' : undefined}
              aria-label={runtime.imageAlt || undefined}
            />
            <div className="service-native-dark-feature-copy">
              {runtime.title ? <h3>{runtime.title}</h3> : null}
              {runtime.body ? <p>{runtime.body}</p> : null}
              {action ? (
                <div className="service-native-action-row">
                  <ColumnsAction item={action} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturePanelBlock({ block, resolveTo, ownership, hudAnchor }) {
  const runtime = buildDynamicFeaturePanelFromBlock({
    ...block,
    kind: block.kind || block.type || 'feature_panel',
    mode: block.mode || 'dynamic',
  });
  if (!runtime) {
    return null;
  }

  const bodyHtml = String(runtime.bodyHtml || '').trim();
  const action = runtime.action
    ? buildColumnsAction(
      runtime.action.label,
      runtime.action.href || runtime.action.to,
      runtime.action.style,
      runtime.action.tone,
      runtime.action.to,
      resolveTo,
    )
    : null;

  return (
    <section className={`service-native-section native-dynamic-feature-panel${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail">
        <div className="service-native-dark-feature">
          <div className="service-native-dark-feature-inner">
            <div
              className="service-native-dark-feature-media"
              style={runtime.imageUrl ? { backgroundImage: `url(${runtime.imageUrl})` } : undefined}
              role={runtime.imageAlt ? 'img' : undefined}
              aria-label={runtime.imageAlt || undefined}
            />
            <div className="service-native-dark-feature-copy">
              {runtime.title ? <h3>{runtime.title}</h3> : null}
              {bodyHtml ? (
                <div className="native-info-rich-html" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              ) : runtime.body ? (
                <p>{runtime.body}</p>
              ) : null}
              {action ? (
                <div className="service-native-action-row">
                  <ColumnsAction item={action} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ColumnsBlock({
  block,
  resolveTo,
  ownership,
  hudAnchor,
  sectionId = '',
  extraSectionClassName = '',
}) {
  const isDynamicColumnsBlock = String(block?.mode || '').trim().toLowerCase() === 'dynamic';
  const dynamicBlock = isDynamicColumnsBlock && block?.settings
    ? { ...block, ...(block.settings || {}) }
    : block;
  if (isDynamicColumnsBlock) {
    const title = String(dynamicBlock.title || '').trim();
    const titleClassName = normalizeToneClass(dynamicBlock.titleClassName || '');
    const titleHighlights = parseHighlightsJson(dynamicBlock.titleHighlightsJson, title);
    const leadLine = String(dynamicBlock.leadLine || '').trim();
    const leadLineClassName = normalizeToneClass(dynamicBlock.leadLineClassName || '');
    const leadLineHighlights = parseHighlightsJson(dynamicBlock.leadLineHighlightsJson, leadLine);
    const followupLine = String(dynamicBlock.followupLine || '').trim();
    const followupLineClassName = normalizeToneClass(dynamicBlock.followupLineClassName || '');
    const followupLineHighlights = parseHighlightsJson(dynamicBlock.followupLineHighlightsJson, followupLine);
    const bodyHtml = String(dynamicBlock.bodyHtml || '').trim();
    const columnsStyle = normalizeDynamicColumnsStyle(dynamicBlock.columnsStyle);
    const justify = normalizeHeroJustify(dynamicBlock.justify || 'center');
    const bgTone = columnsStyle === 'legacy-highlight'
      ? 'blue'
      : normalizePanelBgTone(dynamicBlock.bgTone || 'white');
    const contentWidth = String(dynamicBlock.contentWidth || '').trim().toLowerCase() === 'browser'
      ? 'browser'
      : 'content';
    const visibleColumnSlots = getVisibleDynamicColumnSlots(dynamicBlock);
    const columns = toDynamicColumnsCountToken(visibleColumnSlots.length);
    const presetClassToken = resolvePresetFamilyClassToken(dynamicBlock);
    const presetRuntimeClassName = buildPresetFamilyRuntimeClassName('columns', presetClassToken);
    const useFamilyPresetCtaStyle = (
      columnsStyle === 'retirement'
      && (presetClassToken === 'housing-allowance' || presetClassToken === 'do-the-math')
    );
    const shouldAnimateColumnsItems = presetClassToken === 'value-cards';
    const columnTitleSizeRem = Number(dynamicBlock.columnTitleSizeRem);
    const photoMaxWidthPx = Number(dynamicBlock.photoMaxWidthPx);
    const photoCornerRadiusPx = Number(dynamicBlock.photoCornerRadiusPx);
    const sectionStyle = {};
    if (Number.isFinite(columnTitleSizeRem) && columnTitleSizeRem > 0) {
      sectionStyle['--dynamic-columns-column-title-size'] = `${columnTitleSizeRem}rem`;
    }
    if (Number.isFinite(photoMaxWidthPx) && photoMaxWidthPx > 0) {
      sectionStyle['--dynamic-columns-photo-max-width'] = `${Math.round(photoMaxWidthPx)}px`;
    }
    if (Number.isFinite(photoCornerRadiusPx) && photoCornerRadiusPx >= 0) {
      sectionStyle['--dynamic-columns-photo-radius'] = `${Math.round(photoCornerRadiusPx)}px`;
    }
    sectionStyle['--dynamic-columns-photo-aspect'] = normalizePhotoAspect(dynamicBlock.photoAspect);
    const hasIntroCopy = Boolean(title || leadLine || bodyHtml || followupLine);
    const isLegacyHighlight = columnsStyle === 'legacy-highlight';
    const columnsItems = visibleColumnSlots
      .map((slot) => {
        const enabledValue = dynamicBlock[`col${slot}Enabled`];
        const isEnabled = enabledValue === undefined ? slot <= 2 : toBooleanSetting(enabledValue);
        if (!isEnabled) {
          return null;
        }

        const type = isLegacyHighlight ? 'text' : normalizeDynamicColumnsType(dynamicBlock[`col${slot}Type`]);
        const columnTitle = String(dynamicBlock[`col${slot}Title`] || '').trim();
        const columnTitleClassName = normalizeToneClass(dynamicBlock[`col${slot}TitleClassName`] || '');
        const columnTitleHighlights = parseHighlightsJson(dynamicBlock[`col${slot}TitleHighlightsJson`], columnTitle);
        const columnBody = String(dynamicBlock[`col${slot}Body`] || '').trim();
        const columnImage = String(dynamicBlock[`col${slot}ImageUrl`] || '').trim();
        const columnImageAlt = String(dynamicBlock[`col${slot}ImageAlt`] || '').trim();
        const columnAction = buildColumnsAction(
          dynamicBlock[`col${slot}ButtonLabel`],
          dynamicBlock[`col${slot}ButtonUrl`],
          dynamicBlock[`col${slot}ButtonStyle`],
          dynamicBlock[`col${slot}ButtonTone`],
          dynamicBlock[`col${slot}ButtonPageRef`],
          resolveTo,
          useFamilyPresetCtaStyle,
        );

        if (isLegacyHighlight && !columnTitle) {
          return null;
        }

        if (!isLegacyHighlight && !columnTitle && !columnBody && !columnImage && !columnAction) {
          return null;
        }

        return {
          slot,
          type,
          widthShare: getDynamicColumnWidthShare(dynamicBlock, slot),
          title: columnTitle,
          titleClassName: columnTitleClassName,
          titleHighlights: columnTitleHighlights,
          body: columnBody,
          image: columnImage,
          imageAlt: columnImageAlt,
          action: columnAction,
        };
      })
      .filter(Boolean);
    const gridTemplateColumns = columnsItems.length
      ? columnsItems.map((column) => `minmax(0, ${column.widthShare}fr)`).join(' ')
      : '';
    const gridStyle = gridTemplateColumns
      ? { '--dynamic-columns-grid-template': gridTemplateColumns }
      : undefined;

    return (
      <section
        id={sectionId || undefined}
        className={[
          'service-native-section',
          'native-dynamic-columns',
          `is-bg-${bgTone}`,
          `is-width-${contentWidth}`,
          `is-columns-style-${columnsStyle}`,
          presetRuntimeClassName,
          String(extraSectionClassName || '').trim(),
          String(ownership?.className || '').trim(),
        ].filter(Boolean).join(' ')}
        data-block-id={dynamicBlock?.id || undefined}
        style={Object.keys(sectionStyle).length ? sectionStyle : undefined}
      >
        <BlockOwnershipOverlay ownership={ownership} />
        <SharedBlockHudAnchor hudAnchor={hudAnchor} />
        <div className={contentWidth === 'browser' ? 'ag-panel-rail-wide' : 'ag-panel-rail'}>
          {hasIntroCopy ? (
            <div className={`native-info-section-copy is-justify-${justify}`}>
              {title ? (
                <h2 className={titleClassName || undefined} data-columns-selection-key="title">
                  {titleHighlights.length ? renderHighlightedText(title, titleHighlights) : renderTextWithStrong(title)}
                </h2>
              ) : null}
              {leadLine ? (
                <p className={`native-columns-lead-line${leadLineClassName ? ` ${leadLineClassName}` : ''}`}>
                  {leadLineHighlights.length ? renderHighlightedText(leadLine, leadLineHighlights) : renderTextWithStrong(leadLine)}
                </p>
              ) : null}
              {bodyHtml ? (
                <div className="native-info-rich-html" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              ) : null}
              {followupLine ? (
                <p className={`native-columns-followup-line${followupLineClassName ? ` ${followupLineClassName}` : ''}`}>
                  {followupLineHighlights.length
                    ? renderHighlightedText(followupLine, followupLineHighlights)
                    : renderTextWithStrong(followupLine)}
                </p>
              ) : null}
            </div>
          ) : null}

          {columnsItems.length ? (
            <div className={`native-columns-grid is-${columns}`} style={gridStyle}>
              {columnsItems.map((column, columnIndex) => (
                <article
                  key={`${dynamicBlock?.id || 'columns'}-${column.slot || columnIndex + 1}`}
                  className={[
                    'native-columns-item',
                    `is-${column.type || 'text'}`,
                    shouldAnimateColumnsItems ? 'fade-up' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {column.image ? (
                    <div className="native-columns-media-wrap">
                      <img
                        src={column.image}
                        alt={column.imageAlt || ''}
                        className="native-columns-media"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="native-columns-copy">
                    {column.title ? (
                      <h3
                        className={[
                          column.type === 'photo' ? 'native-columns-photo-label' : '',
                          column.titleClassName || '',
                        ].filter(Boolean).join(' ') || undefined}
                        data-columns-selection-key={column.slot ? `col${column.slot}Title` : undefined}
                      >
                        {column.titleHighlights?.length
                          ? renderHighlightedText(column.title, column.titleHighlights)
                          : renderTextWithStrong(column.title)}
                      </h3>
                    ) : null}
                    {!isLegacyHighlight && column.body ? (
                      <p className={column.type === 'photo' ? 'native-columns-photo-caption' : undefined}>
                        {renderTextWithStrong(column.body)}
                      </p>
                    ) : null}
                    {!isLegacyHighlight && column.action ? (
                      <div className="service-native-action-row">
                        <ColumnsAction item={column.action} />
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const columns = Array.isArray(block.columnsData)
    ? block.columnsData
    : [
        {
          type: block.col1Type || 'photo',
          imageUrl: block.col1ImageUrl,
          imageAlt: block.col1ImageAlt,
          title: block.col1Title,
          titleClassName: normalizeToneClass(block.col1TitleClassName || ''),
          titleHighlights: parseHighlightsJson(block.col1TitleHighlightsJson, block.col1Title),
          body: block.col1Body,
          buttonLabel: block.col1ButtonLabel,
          buttonUrl: block.col1ButtonUrl,
        },
        {
          type: block.col2Type || 'text',
          imageUrl: block.col2ImageUrl,
          imageAlt: block.col2ImageAlt,
          title: block.col2Title,
          titleClassName: normalizeToneClass(block.col2TitleClassName || ''),
          titleHighlights: parseHighlightsJson(block.col2TitleHighlightsJson, block.col2Title),
          body: block.col2Body,
          buttonLabel: block.col2ButtonLabel,
          buttonUrl: block.col2ButtonUrl,
        },
      ];

  const photoCol = columns.find((col) => col?.type === 'photo' && col.imageUrl);
  const textCol = columns.find((col) => col?.type !== 'photo') || {};
  const photoIndex = columns.indexOf(photoCol);
  const textIndex = columns.indexOf(textCol);
  const imageOnLeft = photoIndex >= 0 && textIndex >= 0 ? photoIndex < textIndex : true;
  const bgClass = block.bgTone === 'sand' ? ' is-sand' : '';

  const renderAction = (label, url) => {
    if (!label || !url) return null;
    const isExternal = /^(https?:|mailto:)/i.test(url);
    return isExternal ? (
      <a href={url} className="home-native-cta" target="_blank" rel="noreferrer noopener">{label}</a>
    ) : (
      <Link to={resolveTo(url, '/')} className="home-native-cta">{label}</Link>
    );
  };

  return (
    <section className={`home-native-feature${bgClass}${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className={`ag-panel-rail home-native-feature-grid${imageOnLeft ? ' is-image-left' : ' is-image-right'}`}>
        <div className="home-native-feature-media">
          {photoCol?.imageUrl ? (
            <img src={photoCol.imageUrl} alt={photoCol.imageAlt || ''} loading="lazy" />
          ) : null}
        </div>
        <div className="home-native-feature-copy">
          {textCol?.title ? (
            <h3 className={textCol.titleClassName || undefined}>
              {textCol.titleHighlights?.length
                ? renderHighlightedText(textCol.title, textCol.titleHighlights)
                : textCol.title}
            </h3>
          ) : null}
          {textCol?.body ? <p>{textCol.body}</p> : null}
          {renderAction(textCol.buttonLabel, textCol.buttonUrl)}
        </div>
      </div>
    </section>
  );
}

function RequestFormBlock({ block, ownership, hudAnchor }) {
  const runtime = buildDynamicRequestFormFromBlock({
    ...block,
    kind: block.kind || block.type || 'request_form',
    mode: block.mode || 'dynamic',
  });
  if (!runtime) {
    return null;
  }

  return (
    <section
      className={`service-native-section ${runtime.sectionClassName}${ownership?.className || ''}`}
      style={runtime.sectionStyle}
      data-block-id={block?.id || undefined}
    >
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail">
        <DynamicRequestFormSection
          config={{
            title: runtime.title,
            titleClassName: runtime.titleClassName,
            titleHighlightsJson: runtime.titleHighlightsJson,
            subtitle: runtime.subtitle,
            bodyHtml: runtime.bodyHtml,
            body: runtime.body,
            steps: runtime.steps,
            submitLabel: runtime.submitLabel,
            successMessage: runtime.successMessage,
            salesforceUrl: runtime.salesforceUrl,
            formClassName: runtime.formClassName,
          }}
        />
      </div>
    </section>
  );
}

const blockRenderers = {
  top_strip: TopStripBlock,
  hero: HeroBlock,
  services_grid: ServicesGridBlock,
  impact_stat: ImpactStatBlock,
  cta_form: CtaFormBlock,
  columns: ColumnsBlock,
  newsletter: NewsletterBlock,
  request_form: RequestFormBlock,
  feature_panel: FeaturePanelBlock,
  site_feature: SiteFeatureBlock,
};

export default function PageBlocksRenderer({
  blocks,
  heroHud = null,
  ownershipEnabled = true,
  ownershipPathname = '/',
  hudAnchorsByBlockId = null,
  activeHudPanelId = '',
  hudDockCollapsed = true,
  hudOpacityRatio = 0,
  onHudAnchorClick = null,
}) {
  const {
    resolveManagedPathFromRef,
    getBlockCollaboration = () => null,
    devIdentity = null,
  } = useContentAdmin();
  const resolveTo = (pathRef, fallback = '/') => {
    const resolved = resolveManagedPathFromRef(pathRef, pathRef);
    return resolved || fallback;
  };
  const resolveHudAnchor = (block) => {
    const blockId = String(block?.id || '').trim();
    if (!blockId || !hudAnchorsByBlockId || typeof onHudAnchorClick !== 'function') {
      return null;
    }
    const panel = hudAnchorsByBlockId[blockId];
    if (!panel?.panelId || !panel?.label) {
      return null;
    }
    return {
      label: panel.label,
      isActive: !hudDockCollapsed && activeHudPanelId === panel.panelId,
      onClick: () => onHudAnchorClick(panel.panelId, panel.anchorSelector),
      style: { '--ag-admin-front-hud-opacity': String(hudOpacityRatio) },
    };
  };

  return (
    <>
      {blocks.map((block, index) => {
        const blockKind = String(block?.kind || block?.type || '').trim();
        const Renderer = blockRenderers[blockKind];
        if (!Renderer) {
          return null;
        }
        const hudAnchor = resolveHudAnchor(block);
        return (
          <Renderer
            key={`${blockKind || 'block'}-${index}`}
            block={block}
            resolveTo={resolveTo}
            heroHud={blockKind === 'hero' ? heroHud : null}
            hudAnchor={hudAnchor}
            ownership={ownershipEnabled
              ? getBlockOwnershipVisual(
                getBlockCollaboration(ownershipPathname, block?.id),
                devIdentity?.userId,
              )
              : EMPTY_OWNERSHIP}
          />
        );
      })}
    </>
  );
}
