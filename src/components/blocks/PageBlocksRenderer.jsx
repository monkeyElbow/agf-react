import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BlockOwnershipOverlay, { getBlockOwnershipVisual, isForeignOwnedBlockOwnership } from '../BlockOwnershipOverlay';
import SafeRichText from '../SafeRichText';
import FrontHudAnchorTag from '../FrontHudAnchorTag';
import MissionAssureLogo from '../MissionAssureLogo';
import { FrontHudStructureControls, HeroInlineLiveEditor } from '../BlockHudPanelHostLoader';
import {
  createInitialFormValues,
  normalizeFollowUpSubmitLabel,
  validateRequiredFormFields,
} from '../../blocks/foundation/forms';
import { useContentAdmin } from '../../context/ContentAdminContextCore';
import {
  getDynamicColumnWidthShare,
  getVisibleDynamicColumnSlots,
  toDynamicColumnsCountToken,
} from '../../lib/dynamicColumns';
import {
  buildDynamicBillboardFromBlock,
  buildDynamicCtaPresentationClassName,
  buildDynamicCtaFormFromBlock,
  buildDynamicFeaturePanelFromBlock,
  buildDynamicImpactStatFromBlock,
  buildDynamicRequestFormFromBlock,
  buildDynamicServicesGridFromBlock,
  buildDynamicSiteFeatureFromBlock,
  buildDynamicTopStripFromBlock,
  isExternalLinkHref,
  normalizeUniversalOutlineButtonClassName,
  shouldUseUniversalOutlineButtonLink,
} from '../../lib/dynamicPageBlocks';
import {
  normalizeButtonTone,
  normalizePanelTextTone as normalizeSharedPanelTextTone,
  normalizeSemanticTextColorClass,
  normalizeSurfaceBgTone,
} from '../../lib/colorSystem';
import { normalizeBlockForRender } from '../../lib/blockPresentationContracts';
import { composeManagedBlockOrder, getManagedBlockRenderKey } from '../../lib/managedBlockOrder';
import {
  buildPresetFamilyRuntimeClassName,
  resolvePresetFamilyClassToken,
} from '../../lib/presetFamilyContract';
import {
  coerceLinkValueFromFields,
  linkValueToEditableHref,
} from '../../lib/linkValue';
import DynamicRequestFormSection from '../DynamicRequestFormSection';
import { renderHeroRangesAsNodes } from '../HeroHudEditorShared';
import HomeImpactStoryFeature, { HomeImpactStoryStaticContent } from '../HomeImpactStoryFeature';
import HomeServicesFeatureAnimation from '../HomeServicesFeatureAnimation';
import ImpactProofStoryFeature from '../ImpactProofStoryFeature';
import InvestmentsGrowthFeature from '../InvestmentsGrowthFeature';
import LegacyGivingStewardshipStoryFeature from '../LegacyGivingStewardshipStoryFeature';
import NewsletterSignupForm from '../NewsletterSignupForm';
import PlannedGivingStepIcon from '../PlannedGivingStepIcon';
import {
  extractHeroLineColorToken,
  resolveHeroLineDisplayClassName,
} from '../../lib/heroHudRanges';
import {
  normalizeHeroTitleLetterSpacingEm,
  heroTitleSizeRemToRuntimeCss,
  normalizeHeroTitleSizeRem,
} from '../../lib/heroTitleSize';
import {
  buildHeroLineStyle,
  normalizeHeroLineGapEm,
} from '../../lib/heroLineStyle';
import { setupInvestmentsGrowthRevealMotion } from '../../lib/investmentsGrowthReveal';
import { buildRuntimeAuthorityDescriptor, publishRuntimeAuthorityDescriptor } from '../../lib/runtimeAuthorityDescriptor';
import { RUNTIME_BUILD_ID } from '../../lib/runtimeBuild';

const ACTION_BUTTON_STYLE_SET = new Set(['blue', 'dark', 'outline']);
const DYNAMIC_COLUMNS_TYPE_SET = new Set(['text', 'photo', 'flow-step', 'support']);
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

function isAdminHiddenBlock(block) {
  return block?.hidden === true || block?.hidden === 'true';
}
const HOME_DO_THE_MATH_BLOCK_ID = 'home_do_the_math';
const HOME_DO_THE_MATH_PRESS_SEQUENCE_MS = 1140;

function SharedBlockHudAnchor({ hudAnchor }) {
  if (!hudAnchor) {
    return null;
  }

  return (
    <FrontHudAnchorTag
      label={hudAnchor.label}
      icon={hudAnchor.icon}
      isActive={hudAnchor.isActive}
      onClick={hudAnchor.onClick}
      style={hudAnchor.style}
      structureControls={hudAnchor.structureControls}
    />
  );
}

function normalizeToneClass(value) {
  return normalizeSemanticTextColorClass(value);
}

function sanitizeClassName(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter((token) => /^[a-zA-Z0-9_-]+$/.test(token))
    .join(' ');
}

function normalizePanelBgTone(value) {
  return normalizeSurfaceBgTone(value, 'grey');
}

function normalizePanelTextTone(value, fallback = 'dark') {
  return normalizeSharedPanelTextTone(value, fallback);
}

function isObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getBlockSettingsSource(block) {
  return isObject(block?.settings) ? block.settings : block;
}

function readCanonicalBlockString(block, canonicalKey, legacyKeys = []) {
  const source = getBlockSettingsSource(block);
  const keys = [canonicalKey, ...(Array.isArray(legacyKeys) ? legacyKeys : [legacyKeys])].filter(Boolean);
  const presentKey = keys.find((key) => Object.prototype.hasOwnProperty.call(source || {}, key));
  if (presentKey) {
    return String(source?.[presentKey] ?? '').trim();
  }
  return '';
}

function hasCanonicalBlockField(block, keys = []) {
  const source = getBlockSettingsSource(block);
  return (Array.isArray(keys) ? keys : [keys]).some((key) => (
    key && Object.prototype.hasOwnProperty.call(source || {}, key)
  ));
}

function toRendererBlock(block) {
  if (!isObject(block) || !isObject(block.settings)) {
    return block;
  }

  const settings = block.settings;
  return {
    id: block.id,
    kind: block.kind,
    type: block.type,
    mode: block.mode,
    presetId: block.presetId,
    templateId: block.templateId,
    settings,
    ...settings,
  };
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

export function renderHighlightedText(source, highlights) {
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
  const loginLabel = String(runtime.loginLabel || '').trim() || 'Secure Login';
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
          <a
            href={runtime.loginHref}
            target={loginTarget}
            rel={loginRel}
            className={loginClassName}
            aria-label={loginLabel}
          >
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
  const source = getBlockSettingsSource(block);
  const legacyLine1Text = [String(source.eyebrowPrefix || '').trim(), String(source.highlight || '').trim()]
    .filter(Boolean)
    .join(' ')
    .trim();
  const legacyLine2Text = [String(source.titlePrefix || '').trim(), String(source.accentWord || '').trim()]
    .filter(Boolean)
    .join(' ')
    .trim();
  const line1Text = String(
    readCanonicalBlockString(block, 'line1Text', ['eyebrow'])
    || (Object.prototype.hasOwnProperty.call(source || {}, 'line1Text') ? '' : source.eyebrow)
    || (legacyLine1Text ? `${legacyLine1Text}.` : ''),
  ).trim();
  const line2Text = String(
    readCanonicalBlockString(block, 'line2Text', ['title'])
    || (Object.prototype.hasOwnProperty.call(source || {}, 'line2Text') ? '' : source.title)
    || (legacyLine2Text ? `${legacyLine2Text}.` : ''),
  ).trim();
  const legacyLine1Highlight = String(source.highlight || '').trim() || 'investment';
  const legacyLine2Highlight = String(source.accentWord || '').trim() || 'church';
  let line1Highlights = parseHighlightsJson(source.line1HighlightsJson, line1Text);
  let line2Highlights = parseHighlightsJson(source.line2HighlightsJson, line2Text);
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
  const line3Text = String(source.line3Text || '').trim();
  const line3Highlights = parseHighlightsJson(source.line3HighlightsJson, line3Text);
  const bgTone = normalizePanelBgTone(source.bgTone || 'white');
  const line1ClassName = resolveHeroLineDisplayClassName(
    String(source.line1ClassName || 'home-native-eyebrow').trim() || 'home-native-eyebrow',
    bgTone,
  );
  const line2ClassName = resolveHeroLineDisplayClassName(
    String(source.line2ClassName || 'home-native-title line1 line2').trim() || 'home-native-title line1 line2',
    bgTone,
  );
  const line3ClassName = resolveHeroLineDisplayClassName(
    String(source.line3ClassName || 'home-native-title line3').trim() || 'home-native-title line3',
    bgTone,
  );
  const lineHeight = Number.isFinite(Number(source.lineHeight)) ? Number(source.lineHeight) : 0.9;
  const lineGap = normalizeHeroLineGapEm(source.lineGap);
  const heroTitleSize = heroTitleSizeRemToRuntimeCss(normalizeHeroTitleSizeRem(source.titleSizeRem));
  const heroTitleLetterSpacing = `${normalizeHeroTitleLetterSpacingEm(source.titleLetterSpacingEm)}em`;
  const justify = ['left', 'center', 'right'].includes(String(source.justify || '').trim().toLowerCase())
    ? String(source.justify || '').trim().toLowerCase()
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
  const hasCtaLabel = isObject(block?.settings) || hasCanonicalBlockField(block, ['button1Label', 'ctaLabel']);
  const ctaLabel = hasCtaLabel
    ? readCanonicalBlockString(block, 'button1Label', ['ctaLabel'])
    : 'Contact us';
  const ctaLink = coerceLinkValueFromFields(source, {
    linkJsonKeys: ['button1LinkJson'],
    hrefKeys: ['button1Url'],
    toKeys: ['button1PageRef', 'ctaPath'],
    openInNewWindowKeys: ['button1OpenInNewWindow'],
  });
  const hasCtaLink = hasCanonicalBlockField(block, [
    'button1LinkJson',
    'button1Url',
    'button1PageRef',
    'ctaPath',
  ]);
  const rawCtaTarget = String(ctaLink?.to || ctaLink?.href || '').trim() || (hasCtaLink ? '' : '/contact-us');
  const openInNewWindow = Boolean(ctaLink?.openInNewWindow);
  const isExternal = /^(https?:|mailto:|tel:)/i.test(rawCtaTarget);
  const ctaTarget = rawCtaTarget
    ? (isExternal ? rawCtaTarget : resolveTo(rawCtaTarget, '/contact-us'))
    : '';

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
            lineGap={lineGap}
            letterSpacing={block.titleLetterSpacingEm}
            onLineTextChange={heroHud.onLineTextChange}
            commitOnBlurOnly={heroHud?.commitOnBlurOnly === true}
            readOnly={isForeignOwnedBlockOwnership(ownership)}
            onLineInteract={heroHud.onLineInteract}
            setLineInputRef={heroHud.setLineInputRef}
            resolveLineClassName={(line, index) => line.className || `line${index + 1}`}
            resolveLineTagName={(line) => (line.key === 'line1' ? 'p' : 'h1')}
          />
        ) : (
          <>
            {line1Text ? (
              <p
                className={line1ClassName}
                style={buildHeroLineStyle({
                  lineHeight,
                  fontSize: HOME_HERO_PRIMARY_LINE_SIZE_CSS,
                  letterSpacing: heroTitleLetterSpacing,
                  lineGap,
                  lineIndex: 0,
                })}
              >
                {line1Highlights.length ? renderHighlightedText(line1Text, line1Highlights) : line1Text}
              </p>
            ) : null}
            {line2Text ? (
              <h1 className={line2ClassName} style={buildHeroLineStyle({
                lineHeight,
                fontSize: heroTitleSize,
                letterSpacing: heroTitleLetterSpacing,
                lineGap,
                lineIndex: 1,
              })}>
                {line2Highlights.length ? renderHighlightedText(line2Text, line2Highlights) : line2Text}
              </h1>
            ) : null}
            {line3Text ? (
              <h1 className={line3ClassName} style={buildHeroLineStyle({
                lineHeight,
                fontSize: heroTitleSize,
                letterSpacing: heroTitleLetterSpacing,
                lineGap,
                lineIndex: 2,
              })}>
                {line3Highlights.length ? renderHighlightedText(line3Text, line3Highlights) : line3Text}
              </h1>
            ) : null}
          </>
        )}
        {ctaLabel && ctaTarget ? (
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
      <HomeImpactStoryFeature
        headline={`${runtime.titlePrefix} ${runtime.highlight}.`}
        highlightedWord={runtime.highlight}
        body={runtime.body}
        metrics={runtime.stats}
      />
    </section>
  );
}

export function HomeDoTheMathBadge({ linkTarget = '/calculators' }) {
  const badgeRef = useRef(null);
  const pressTimerRef = useRef(0);
  const hasTriggeredPressInViewRef = useRef(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [pressCycle, setPressCycle] = useState(0);
  const [hoveredButtonId, setHoveredButtonId] = useState('');
  const buttonLinks = [
    { id: 'plus', label: 'Open calculators' },
    { id: 'minus', label: 'Open calculators' },
    { id: 'times', label: 'Open calculators' },
    { id: 'equals', label: 'Open calculators' },
  ];
  const isExternalTarget = isExternalLinkHref(linkTarget);

  useEffect(() => {
    const node = badgeRef.current;
    if (!node) {
      return undefined;
    }
    if (typeof window === 'undefined') {
      setIsRevealed(true);
      return undefined;
    }
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      return undefined;
    }
    if (typeof window.IntersectionObserver !== 'function') {
      setIsRevealed(true);
      return undefined;
    }

    const clearPressTimer = () => {
      if (pressTimerRef.current) {
        window.clearTimeout(pressTimerRef.current);
        pressTimerRef.current = 0;
      }
    };
    let positionFrameId = 0;
    const triggerPressCycle = () => {
      clearPressTimer();
      setIsPressing(false);
      window.requestAnimationFrame(() => {
        setPressCycle((current) => current + 1);
        setIsPressing(true);
      });
      pressTimerRef.current = window.setTimeout(() => {
        setIsPressing(false);
        pressTimerRef.current = 0;
      }, HOME_DO_THE_MATH_PRESS_SEQUENCE_MS);
    };
    const evaluateBadgePosition = () => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
      if (!viewportHeight || rect.height <= 0) {
        return;
      }

      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, viewportHeight);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibleRatio = visibleHeight / Math.max(rect.height, 1);

      if (visibleRatio >= 0.08 && rect.top <= viewportHeight * 0.97) {
        setIsRevealed(true);
      }

      const isWithinPressWindow = visibleRatio >= 0.18
        && rect.top <= viewportHeight * 0.82
        && rect.bottom >= viewportHeight * 0.2;

      if (!isWithinPressWindow) {
        hasTriggeredPressInViewRef.current = false;
        return;
      }

      if (!hasTriggeredPressInViewRef.current) {
        hasTriggeredPressInViewRef.current = true;
        triggerPressCycle();
      }
    };
    const queueBadgePositionEvaluation = () => {
      if (positionFrameId) {
        return;
      }
      positionFrameId = window.requestAnimationFrame(() => {
        positionFrameId = 0;
        evaluateBadgePosition();
      });
    };

    const revealObserver = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          revealObserver.disconnect();
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -3% 0px',
    });

    const pressObserver = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          hasTriggeredPressInViewRef.current = false;
          return;
        }
        if (entry.intersectionRatio >= 0.18 && !hasTriggeredPressInViewRef.current) {
          hasTriggeredPressInViewRef.current = true;
          triggerPressCycle();
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -12% 0px',
    });

    revealObserver.observe(node);
    pressObserver.observe(node);
    evaluateBadgePosition();
    window.addEventListener('scroll', queueBadgePositionEvaluation, { passive: true });
    window.addEventListener('resize', queueBadgePositionEvaluation, { passive: true });

    return () => {
      revealObserver.disconnect();
      pressObserver.disconnect();
      window.removeEventListener('scroll', queueBadgePositionEvaluation);
      window.removeEventListener('resize', queueBadgePositionEvaluation);
      if (positionFrameId) {
        window.cancelAnimationFrame(positionFrameId);
      }
      clearPressTimer();
    };
  }, []);

  return (
    <div
      ref={badgeRef}
      className={`home-math-badge${isRevealed ? ' is-revealed' : ''}${isPressing ? ' is-pressing' : ''}`}
      data-home-math-press-cycle={String(pressCycle)}
      data-home-math-badge="true"
      data-home-math-hovered-button={hoveredButtonId || undefined}
    >
      <svg viewBox="0 0 297.1 295.3" role="presentation" focusable="false">
        <g
          className={`home-math-badge-button home-math-badge-button--plus${hoveredButtonId === 'plus' ? ' is-hover-pressed' : ''}`}
          style={{
            '--home-math-badge-delay': '0ms',
            '--home-math-fill-rest': 'transparent',
            '--home-math-stroke-rest': 'var(--ag-color-atlantean)',
            '--home-math-symbol-rest': 'var(--ag-color-atlantean)',
            '--home-math-fill-active': 'var(--ag-color-atlantean)',
            '--home-math-stroke-active': 'var(--ag-color-atlantean-dark)',
            '--home-math-symbol-active': '#ffffff',
          }}
        >
          <circle className="home-math-badge-circle home-math-badge-circle--outline" cx="71.9" cy="71.9" r="68.7" />
          <line className="home-math-badge-symbol" x1="36.5" y1="71.9" x2="107.2" y2="71.9" />
          <line className="home-math-badge-symbol" x1="71.9" y1="107.2" x2="71.9" y2="36.5" />
        </g>
        <g
          className={`home-math-badge-button home-math-badge-button--minus${hoveredButtonId === 'minus' ? ' is-hover-pressed' : ''}`}
          style={{
            '--home-math-badge-delay': '180ms',
            '--home-math-fill-rest': 'transparent',
            '--home-math-stroke-rest': 'var(--ag-color-atlantean)',
            '--home-math-symbol-rest': 'var(--ag-color-atlantean)',
            '--home-math-fill-active': 'var(--ag-color-atlantean)',
            '--home-math-stroke-active': 'var(--ag-color-atlantean-dark)',
            '--home-math-symbol-active': '#ffffff',
          }}
        >
          <circle className="home-math-badge-circle home-math-badge-circle--outline" cx="225.3" cy="71.9" r="68.7" />
          <line className="home-math-badge-symbol" x1="189.9" y1="71.9" x2="260.6" y2="71.9" />
        </g>
        <g
          className={`home-math-badge-button home-math-badge-button--times${hoveredButtonId === 'times' ? ' is-hover-pressed' : ''}`}
          style={{
            '--home-math-badge-delay': '360ms',
            '--home-math-fill-rest': 'transparent',
            '--home-math-stroke-rest': 'var(--ag-color-atlantean)',
            '--home-math-symbol-rest': 'var(--ag-color-atlantean)',
            '--home-math-fill-active': 'var(--ag-color-atlantean)',
            '--home-math-stroke-active': 'var(--ag-color-atlantean-dark)',
            '--home-math-symbol-active': '#ffffff',
          }}
        >
          <circle className="home-math-badge-circle home-math-badge-circle--outline" cx="71.9" cy="223.5" r="68.7" />
          <line className="home-math-badge-symbol" x1="46.8" y1="248.5" x2="96.9" y2="198.5" />
          <line className="home-math-badge-symbol" x1="96.9" y1="248.5" x2="46.8" y2="198.5" />
        </g>
        <g
          className={`home-math-badge-button home-math-badge-button--equals${hoveredButtonId === 'equals' ? ' is-hover-pressed' : ''}`}
          style={{
            '--home-math-badge-delay': '540ms',
            '--home-math-fill-rest': 'var(--ag-color-mango)',
            '--home-math-stroke-rest': 'var(--ag-color-mango)',
            '--home-math-symbol-rest': '#ffffff',
            '--home-math-fill-active': '#de9208',
            '--home-math-stroke-active': '#de9208',
            '--home-math-symbol-active': '#ffffff',
          }}
        >
          <circle className="home-math-badge-circle home-math-badge-circle--filled" cx="225.3" cy="223.5" r="68.7" />
          <line className="home-math-badge-symbol home-math-badge-symbol--light" x1="195.9" y1="238.7" x2="254.7" y2="238.7" />
          <line className="home-math-badge-symbol home-math-badge-symbol--light" x1="195.9" y1="208.3" x2="254.7" y2="208.3" />
        </g>
      </svg>
      <div className="home-math-badge-hotspots" aria-label="Open calculators">
        {buttonLinks.map((button) => (
          isExternalTarget ? (
            <a
              key={button.id}
              href={linkTarget}
              className={`home-math-badge-hotspot home-math-badge-hotspot--${button.id}`}
              aria-label={button.label}
              onMouseEnter={() => setHoveredButtonId(button.id)}
              onMouseLeave={() => setHoveredButtonId('')}
              onFocus={() => setHoveredButtonId(button.id)}
              onBlur={() => setHoveredButtonId('')}
            >
              <span className="sr-only">{button.label}</span>
            </a>
          ) : (
            <Link
              key={button.id}
              to={linkTarget}
              className={`home-math-badge-hotspot home-math-badge-hotspot--${button.id}`}
              aria-label={button.label}
              onMouseEnter={() => setHoveredButtonId(button.id)}
              onMouseLeave={() => setHoveredButtonId('')}
              onFocus={() => setHoveredButtonId(button.id)}
              onBlur={() => setHoveredButtonId('')}
            >
              <span className="sr-only">{button.label}</span>
            </Link>
          )
        ))}
      </div>
    </div>
  );
}

export function BillboardBlock({
  block,
  resolveTo,
  ownership,
  hudAnchor,
  extraSectionClassName = '',
}) {
  const runtime = buildDynamicBillboardFromBlock(block);
  if (!runtime) {
    return null;
  }

  const actions = Array.isArray(runtime.actions)
    ? runtime.actions.map((action) => buildBillboardAction(action, resolveTo)).filter(Boolean)
    : [];
  const sectionStyle = actions.length
    ? { '--dynamic-billboard-padding-bottom': 'clamp(4.1rem, 8vw, 6.8rem)' }
    : undefined;
  const railStyle = runtime.contentMaxWidthPx
    ? { '--dynamic-billboard-max-width': `${runtime.contentMaxWidthPx}px` }
    : undefined;
  const presetClassName = buildPresetFamilyRuntimeClassName('billboard', runtime.presetId || 'default');
  const sectionClassName = [
    'service-native-section',
    'home-native-billboard',
    presetClassName,
    `is-bg-${normalizePanelBgTone(runtime.bgTone || 'grey')}`,
    `is-text-${normalizePanelTextTone(runtime.textTone, 'white')}`,
    runtime.sectionClassName || '',
    extraSectionClassName,
    ownership?.className || '',
  ].filter(Boolean).join(' ');
  const blockId = String(block?.id || '').trim();
  const blockPresetId = String(block?.presetId || '').trim();
  const isDoTheMathBillboard = (
    blockId === HOME_DO_THE_MATH_BLOCK_ID
    || blockPresetId === 'do-the-math'
    || String(runtime.sectionClassName || '').split(/\s+/).includes('retirement-do-the-math-billboard')
  );
  const effectiveJustify = runtime.justify || 'center';
  const effectiveBodyJustify = runtime.bodyJustify || effectiveJustify;
  const bodyJustifyClassName = `is-body-justify-${effectiveBodyJustify}`;
  const bodyHeaderGapClassName = runtime.headerGapRem !== null && runtime.headerGapRem !== undefined
    ? 'is-dynamic-billboard-header-gap'
    : '';
  const copyClassName = [
    'native-info-section-copy',
    `is-justify-${effectiveJustify}`,
    runtime.copyClassName || '',
  ].filter(Boolean).join(' ');
  const mathBadgeLinkTarget = actions[0]?.to || actions[0]?.href || '/calculators';

  return (
    <section
      className={sectionClassName}
      data-block-id={block?.id || undefined}
      style={sectionStyle}
    >
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail" style={railStyle}>
        <div className={copyClassName} style={runtime.copyStyle || undefined} data-fade-root-margin={runtime.copyFadeRootMargin || undefined}>
          {isDoTheMathBillboard ? <HomeDoTheMathBadge linkTarget={mathBadgeLinkTarget} /> : null}
          {runtime.title ? (
            <h2 className={runtime.titleClassName || undefined} style={runtime.titleStyle}>
              {runtime.titleHighlights?.length
                ? renderHighlightedText(runtime.title, runtime.titleHighlights)
                : runtime.title}
            </h2>
          ) : null}
          {runtime.subtitle ? (
            <p
              className={['home-native-billboard-subtitle', runtime.subtitleClassName || ''].filter(Boolean).join(' ')}
              style={runtime.subtitleStyle || undefined}
            >
              {runtime.subtitle}
            </p>
          ) : null}
          {runtime.bodyHtml ? (
            <SafeRichText
              as="div"
              className={['native-info-rich-html', runtime.bodyColorClassName || '', runtime.bodyHtmlStyle ? 'is-dynamic-billboard-lead-copy-sized' : '', bodyJustifyClassName, bodyHeaderGapClassName].filter(Boolean).join(' ')}
              html={runtime.bodyHtml}
              style={runtime.bodyHtmlStyle || undefined}
            />
          ) : null}
          {!runtime.bodyHtml && runtime.body ? (
            <div
              className={['native-info-rich-html', runtime.bodyColorClassName || '', runtime.bodyHtmlStyle ? 'is-dynamic-billboard-lead-copy-sized' : '', bodyJustifyClassName, bodyHeaderGapClassName].filter(Boolean).join(' ')}
              style={runtime.bodyHtmlStyle || undefined}
            >
              <p>{renderTextWithStrong(runtime.body)}</p>
            </div>
          ) : null}
          {actions.length ? (
            <div
              className={`service-native-action-row${effectiveJustify === 'center' ? ' is-centered' : ''}${effectiveJustify === 'right' ? ' is-right' : ''}${effectiveJustify === 'left' ? ' is-left' : ''}`}
              style={buildBillboardActionRowStyle(effectiveJustify)}
            >
              {actions.map((action) => (
                <BillboardAction
                  key={`${action.href || action.to || action.label}-${action.label}`}
                  item={action}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
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

function buildBillboardAction(action, resolveTo) {
  const label = String(action?.label || '').trim();
  const rawTarget = String(action?.to || action?.href || '').trim();
  if (!label) {
    return null;
  }

  const isExternal = isExternalLinkHref(rawTarget);
  const baseClassName = `service-native-btn ${toActionButtonClassName(action?.style, action?.tone)}`.trim();
  const className = shouldUseUniversalOutlineButtonLink({
    href: rawTarget,
    external: isExternal,
    buttonStyle: action?.style,
  })
    ? normalizeUniversalOutlineButtonClassName(baseClassName, action?.tone || 'atlantean')
    : baseClassName;

  if (!rawTarget) {
    return {
      label,
      className: `${baseClassName} is-static`,
      openInNewWindow: false,
    };
  }

  if (isExternal) {
    return {
      label,
      href: rawTarget,
      className,
      openInNewWindow: Boolean(action?.openInNewWindow),
    };
  }

  return {
    label,
    to: resolveTo(rawTarget, rawTarget || '/'),
    className,
    openInNewWindow: Boolean(action?.openInNewWindow),
  };
}

function BillboardAction({ item }) {
  if (!item) {
    return null;
  }

  if (!item.href && !item.to) {
    return (
      <button
        type="button"
        className={item.className}
        aria-disabled="true"
        onClick={(event) => event.preventDefault()}
      >
        {item.label}
      </button>
    );
  }

  if (item.href) {
    return (
      <a
        href={item.href}
        className={item.className}
        target={item.openInNewWindow ? '_blank' : undefined}
        rel={item.openInNewWindow ? 'noreferrer noopener' : undefined}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link
      to={item.to || '/'}
      className={item.className}
      target={item.openInNewWindow ? '_blank' : undefined}
      rel={item.openInNewWindow ? 'noreferrer noopener' : undefined}
    >
      {item.label}
    </Link>
  );
}

function buildBillboardActionRowStyle(justify) {
  const token = String(justify || '').trim().toLowerCase();
  if (token === 'right') {
    return { justifyContent: 'flex-end' };
  }
  if (token === 'left') {
    return { justifyContent: 'flex-start' };
  }
  return { justifyContent: 'center' };
}

function buildColumnsAction(label, url, style, tone, pageRef, resolveTo, useFamilyPresetCtaStyle = false) {
  const nextLabel = String(label || '').trim();
  const nextUrl = String(url || '').trim();
  if (!nextLabel || !nextUrl) {
    return null;
  }

  const isExternal = /^(https?:|mailto:|tel:)/i.test(nextUrl);
  const baseClassName = useFamilyPresetCtaStyle
    ? 'home-native-cta'
    : `service-native-btn ${toActionButtonClassName(style, tone)}`.trim();
  const className = !useFamilyPresetCtaStyle && shouldUseUniversalOutlineButtonLink({
    href: nextUrl,
    external: isExternal,
    buttonStyle: style,
  })
    ? normalizeUniversalOutlineButtonClassName(baseClassName, tone || 'atlantean')
    : baseClassName;

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

  const hasCanonicalSettings = isObject(block?.settings);
  const explicitTitle = readCanonicalBlockString(block, 'title', ['heading']);
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
        title: explicitTitle || (hasCanonicalSettings ? '' : legacyTitle),
        bodyHtml: hasCanonicalSettings
          ? String(block.bodyHtml || '').trim()
          : (String(block.bodyHtml || '').trim()
            || (String(block.note || '').trim() ? `<p>${String(block.note || '').trim()}</p>` : '')),
        submitLabel: hasCanonicalSettings
          ? String(block.submitLabel || '').trim()
          : (String(block.submitLabel || '').trim() || String(block.buttonLabel || '').trim()),
      },
      {
        fallbackFields: hasCanonicalSettings ? [] : buildLegacyHomeCtaFields(block),
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
  const sectionClassName = String(runtime.sectionClassName || '').trim();
  const isLegacyGivingCta = sectionClassName.split(/\s+/).includes('legacy-giving-cta');
  const renderBodyInSectionCopy = isLegacyGivingCta && Boolean(bodyHtml);
  const bgTone = normalizePanelBgTone(runtime.bgTone || 'white');
  const submitLabel = normalizeFollowUpSubmitLabel(runtime.submitLabel);
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
      className={`service-native-section native-dynamic-cta is-bg-${bgTone}${sectionClassName ? ` ${sectionClassName}` : ''}${presentationClassName ? ` ${presentationClassName}` : ''}${ownership?.className || ''}`}
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
            {renderBodyInSectionCopy ? (
              <SafeRichText
                as="div"
                className={['native-info-rich-html dynamic-cta-form-callout', runtime.bodyColorClassName || ''].filter(Boolean).join(' ')}
                html={bodyHtml}
              />
            ) : null}
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
              {!renderBodyInSectionCopy && bodyHtml ? (
                <SafeRichText
                  as="div"
                  className={['native-info-rich-html dynamic-cta-form-callout', runtime.bodyColorClassName || ''].filter(Boolean).join(' ')}
                  html={bodyHtml}
                />
              ) : null}
              {runtime.fineprint ? <p className="dynamic-cta-form-fineprint">{runtime.fineprint}</p> : null}
              <button type="submit" className={submitButtonClassName}>{submitLabel}</button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function NewsletterBlock({ block, ownership, hudAnchor }) {
  const source = getBlockSettingsSource(block);
  const bgTone = normalizePanelBgTone(source.bgTone);
  const textTone = normalizePanelTextTone(
    source.textTone,
    bgTone === 'white' || bgTone === 'sand' ? 'dark' : 'white',
  );
  const title = readCanonicalBlockString(block, 'title', ['heading']);
  const titleClassName = normalizeToneClass(source.titleClassName || '');
  const bodyColorClassName = normalizeToneClass(source.bodyColorClassName || '');
  const titleHighlights = parseHighlightsJson(
    source.titleHighlightsJson,
    title,
  );
  const bodyHtml = String(source.bodyHtml || '').trim();
  const body = String(source.body || '').trim();

  return (
    <section className={`home-native-newsletter is-bg-${bgTone} is-text-${textTone}${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail">
        <h2 className={titleClassName || undefined}>
          {titleHighlights.length ? renderHighlightedText(title, titleHighlights) : title}
        </h2>
        {bodyHtml ? (
          <SafeRichText
            as="div"
            className={['home-native-newsletter-copy', bodyColorClassName].filter(Boolean).join(' ')}
            html={bodyHtml}
          />
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
          intro={runtime.featureIntro || undefined}
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
    <section className={`service-native-section service-native-article-teaser is-article-feature native-dynamic-site-feature${runtime.sectionClassName ? ` ${runtime.sectionClassName}` : ''}${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail-wide">
        <div className="service-native-dark-feature">
          <div className="service-native-dark-feature-inner">
            <div
              className="service-native-dark-feature-media"
              style={runtime.imageUrl ? { backgroundImage: `url(${runtime.imageUrl})` } : undefined}
              role={runtime.imageAlt ? 'img' : undefined}
              aria-label={runtime.imageAlt || undefined}
            />
            <div className="service-native-dark-feature-copy">
              {runtime.title ? (
                <h3 className={runtime.titleClassName || undefined} aria-label={runtime.titleHighlights?.length ? runtime.title : undefined}>
                  {runtime.titleHighlights?.length
                    ? renderHighlightedText(runtime.title, runtime.titleHighlights)
                    : runtime.title}
                </h3>
              ) : null}
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
    <section className={`service-native-section service-native-feature-panel native-dynamic-feature-panel${runtime.sectionClassName ? ` ${runtime.sectionClassName}` : ''}${ownership?.className || ''}`} data-block-id={block?.id || undefined}>
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="ag-panel-rail-wide">
        <div className="service-native-dark-feature">
          <div className="service-native-dark-feature-inner">
            <div
              className="service-native-dark-feature-media"
              style={runtime.imageUrl ? { backgroundImage: `url(${runtime.imageUrl})` } : undefined}
              role={runtime.imageAlt ? 'img' : undefined}
              aria-label={runtime.imageAlt || undefined}
            />
            <div className="service-native-dark-feature-copy">
              {runtime.logoKey === 'mission-assure' ? (
                <MissionAssureLogo className="native-info-feature-logo" />
              ) : null}
              {runtime.title ? (
                <h3 className={runtime.titleClassName || undefined} aria-label={runtime.titleHighlights?.length ? runtime.title : undefined}>
                  {runtime.titleHighlights?.length
                    ? renderHighlightedText(runtime.title, runtime.titleHighlights)
                    : runtime.title}
                </h3>
              ) : null}
              {bodyHtml ? (
                <SafeRichText as="div" className="native-info-rich-html article-feature-body" html={bodyHtml} />
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
  const sectionRef = useRef(null);
  const valueCardsPanelTones = ['blue', 'mango', 'sand'];
  const isDynamicColumnsBlock = String(block?.mode || '').trim().toLowerCase() === 'dynamic';
  const dynamicBlock = isDynamicColumnsBlock && isObject(block?.settings)
    ? {
      id: block.id,
      kind: block.kind,
      type: block.type,
      mode: block.mode,
      presetId: block.presetId,
      templateId: block.templateId,
      settings: block.settings,
      ...block.settings,
    }
    : block;
  const dynamicPresetClassToken = isDynamicColumnsBlock ? resolvePresetFamilyClassToken(dynamicBlock) : '';
  const shouldAnimateColumnsItems = dynamicPresetClassToken === 'value-cards';
  const dynamicColumnsRevealKey = isDynamicColumnsBlock
    ? [
      dynamicBlock?.columns,
      ...[1, 2, 3, 4].flatMap((slot) => [
        dynamicBlock?.[`col${slot}Enabled`],
        dynamicBlock?.[`col${slot}Type`],
        dynamicBlock?.[`col${slot}Title`],
        dynamicBlock?.[`col${slot}Body`],
        dynamicBlock?.[`col${slot}BodyHtml`],
        dynamicBlock?.[`col${slot}ImageUrl`],
        dynamicBlock?.[`col${slot}ButtonLabel`],
        dynamicBlock?.[`col${slot}ButtonUrl`],
      ]),
    ].map((value) => String(value ?? '')).join('|')
    : '';

  useEffect(() => {
    if (!shouldAnimateColumnsItems) {
      return undefined;
    }
    return setupInvestmentsGrowthRevealMotion(sectionRef.current, { includeBackgroundMotion: false });
  }, [shouldAnimateColumnsItems, dynamicBlock?.id, dynamicColumnsRevealKey]);

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
    const sectionClassName = String(dynamicBlock.sectionClassName || '').trim();
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
    const presetClassToken = dynamicPresetClassToken;
    const presetRuntimeClassName = buildPresetFamilyRuntimeClassName('columns', presetClassToken);
    const useFamilyPresetCtaStyle = (
      columnsStyle === 'retirement'
      && (presetClassToken === 'housing-allowance' || presetClassToken === 'do-the-math')
    );
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
        const columnBodyHtml = String(dynamicBlock[`col${slot}BodyHtml`] || '').trim();
        const columnImage = String(dynamicBlock[`col${slot}ImageUrl`] || '').trim();
        const columnImageAlt = String(dynamicBlock[`col${slot}ImageAlt`] || '').trim();
        const columnIconKey = String(dynamicBlock[`col${slot}IconKey`] || '').trim();
        const columnIconTone = sanitizeClassName(dynamicBlock[`col${slot}IconTone`] || '');
        const columnLink = coerceLinkValueFromFields(dynamicBlock, {
          linkJsonKeys: [`col${slot}ButtonLinkJson`],
          hrefKeys: [`col${slot}ButtonUrl`],
          toKeys: [`col${slot}ButtonPageRef`],
          openInNewWindowKeys: [`col${slot}ButtonOpenInNewWindow`],
        });
        const columnAction = buildColumnsAction(
          readCanonicalBlockString(dynamicBlock, `col${slot}ButtonLabel`),
          linkValueToEditableHref(columnLink),
          dynamicBlock[`col${slot}ButtonStyle`],
          dynamicBlock[`col${slot}ButtonTone`],
          undefined,
          resolveTo,
          useFamilyPresetCtaStyle,
        );

        if (isLegacyHighlight && !columnTitle) {
          return null;
        }

        if (!isLegacyHighlight && !columnTitle && !columnBody && !columnBodyHtml && !columnImage && !columnAction) {
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
          bodyHtml: columnBodyHtml,
          image: columnImage,
          imageAlt: columnImageAlt,
          iconKey: columnIconKey,
          iconTone: columnIconTone,
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
        ref={sectionRef}
        id={sectionId || undefined}
        className={[
          'service-native-section',
          'native-dynamic-columns',
          `is-bg-${bgTone}`,
          `is-width-${contentWidth}`,
          `is-columns-style-${columnsStyle}`,
          presetRuntimeClassName,
          sectionClassName,
          String(extraSectionClassName || '').trim(),
          String(ownership?.className || '').trim(),
        ].filter(Boolean).join(' ')}
        data-block-id={dynamicBlock?.id || undefined}
        style={Object.keys(sectionStyle).length ? sectionStyle : undefined}
      >
        <BlockOwnershipOverlay ownership={ownership} />
        <SharedBlockHudAnchor hudAnchor={hudAnchor} />
        {shouldAnimateColumnsItems ? (
          <div className="investments-native-growth-surface native-columns-growth-surface" aria-hidden="true">
            <div className="investments-native-growth-surface-layer is-blue" />
            <div className="investments-native-growth-surface-layer is-mango" />
            <div className="investments-native-growth-surface-layer is-sand" />
            <div className="investments-native-growth-surface-layer is-white" />
          </div>
        ) : null}
        <div className={contentWidth === 'browser' ? 'ag-panel-rail-wide' : 'ag-panel-rail'}>
          {hasIntroCopy ? (
            <div className={`native-info-section-copy is-justify-${justify}`}>
              {title ? (
                <h2
                  className={[
                    titleClassName || '',
                    shouldAnimateColumnsItems ? 'investments-native-build-title investments-growth-scroll-reveal investments-growth-scroll-reveal-title' : '',
                  ].filter(Boolean).join(' ') || undefined}
                  data-columns-selection-key="title"
                  data-investments-growth-reveal={shouldAnimateColumnsItems ? 'title' : undefined}
                  data-investments-growth-start-vh={shouldAnimateColumnsItems ? '0.98' : undefined}
                  data-investments-growth-end-vh={shouldAnimateColumnsItems ? '0.48' : undefined}
                  data-investments-growth-anchor-ratio={shouldAnimateColumnsItems ? '0.22' : undefined}
                  data-investments-growth-anchor-max-px={shouldAnimateColumnsItems ? '120' : undefined}
                  data-investments-growth-min-opacity={shouldAnimateColumnsItems ? '0.24' : undefined}
                  data-investments-growth-base-scale={shouldAnimateColumnsItems ? '0.945' : undefined}
                  data-investments-growth-shift-y={shouldAnimateColumnsItems ? '34' : undefined}
                >
                  {titleHighlights.length ? renderHighlightedText(title, titleHighlights) : renderTextWithStrong(title)}
                </h2>
              ) : null}
              {leadLine ? (
                <p className={`native-columns-lead-line${leadLineClassName ? ` ${leadLineClassName}` : ''}`}>
                  {leadLineHighlights.length ? renderHighlightedText(leadLine, leadLineHighlights) : renderTextWithStrong(leadLine)}
                </p>
              ) : null}
              {bodyHtml ? (
                <SafeRichText as="div" className="native-info-rich-html" html={bodyHtml} />
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
            <div
              className={`native-columns-grid is-${columns}${shouldAnimateColumnsItems ? ' investments-native-growth-grid' : ''}`}
              style={gridStyle}
            >
              {columnsItems.map((column, columnIndex) => (
                <article
                  key={`${dynamicBlock?.id || 'columns'}-${column.slot || columnIndex + 1}`}
                  className={[
                    'native-columns-item',
                    `is-${column.type || 'text'}`,
                    shouldAnimateColumnsItems ? 'investments-native-growth-card investments-growth-scroll-reveal' : '',
                  ].filter(Boolean).join(' ')}
                  data-investments-growth-reveal={shouldAnimateColumnsItems ? 'card' : undefined}
                  data-investments-growth-background-panel={shouldAnimateColumnsItems ? valueCardsPanelTones[columnIndex % valueCardsPanelTones.length] : undefined}
                  data-investments-growth-start-vh={shouldAnimateColumnsItems ? '1.08' : undefined}
                  data-investments-growth-end-vh={shouldAnimateColumnsItems ? '0.54' : undefined}
                  data-investments-growth-anchor-ratio={shouldAnimateColumnsItems ? '0.28' : undefined}
                  data-investments-growth-anchor-max-px={shouldAnimateColumnsItems ? '154' : undefined}
                  data-investments-growth-min-opacity={shouldAnimateColumnsItems ? '0.18' : undefined}
                  data-investments-growth-base-scale={shouldAnimateColumnsItems ? '0.92' : undefined}
                  data-investments-growth-shift-y={shouldAnimateColumnsItems ? '52' : undefined}
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
                  {column.iconKey ? (
                    <PlannedGivingStepIcon iconKey={column.iconKey} tone={column.iconTone} />
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
                    {!isLegacyHighlight && column.bodyHtml ? (
                      <SafeRichText
                        as="div"
                        className={`native-info-rich-html${column.type === 'photo' ? ' native-columns-photo-caption' : ''}`}
                        html={column.bodyHtml}
                      />
                    ) : null}
                    {!isLegacyHighlight && !column.bodyHtml && column.body ? (
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

  const resolveColumnButtonUrl = (slot) => linkValueToEditableHref(coerceLinkValueFromFields(block, {
    linkJsonKeys: [`col${slot}ButtonLinkJson`],
    hrefKeys: [`col${slot}ButtonUrl`],
    toKeys: [`col${slot}ButtonPageRef`],
    openInNewWindowKeys: [`col${slot}ButtonOpenInNewWindow`],
  }));

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
          buttonUrl: resolveColumnButtonUrl(1),
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
          buttonUrl: resolveColumnButtonUrl(2),
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
      id={runtime.anchorId || undefined}
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
  billboard: BillboardBlock,
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
  const runtimeAuthorityDescriptors = useMemo(() => (
    composeManagedBlockOrder(blocks).map((block) => buildRuntimeAuthorityDescriptor({
      pathname: ownershipPathname,
      block,
      source: hudAnchorsByBlockId ? 'draft' : 'published',
      hudEnabled: Boolean(hudAnchorsByBlockId),
      runtimeBuildId: RUNTIME_BUILD_ID,
    }))
  ), [blocks, ownershipPathname, hudAnchorsByBlockId]);

  useEffect(() => {
    publishRuntimeAuthorityDescriptor(runtimeAuthorityDescriptors, {
      pathname: ownershipPathname,
      hudEnabled: Boolean(hudAnchorsByBlockId),
      runtimeBuildId: RUNTIME_BUILD_ID,
      mergeExisting: true,
    });
  }, [runtimeAuthorityDescriptors, ownershipPathname, hudAnchorsByBlockId]);
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
      icon: panel.icon,
      isActive: !hudDockCollapsed && activeHudPanelId === panel.panelId,
      onClick: () => onHudAnchorClick(panel.panelId, panel.anchorSelector),
      style: { '--ag-admin-front-hud-opacity': String(hudOpacityRatio) },
      structureControls: (
        <FrontHudStructureControls
          pathname={ownershipPathname}
          blockId={blockId}
          placement="anchor"
        />
      ),
    };
  };

  return (
    <>
      {composeManagedBlockOrder(blocks).map((block, index) => {
        const renderBlock = toRendererBlock(normalizeBlockForRender(block));
        const blockKind = String(renderBlock?.kind || renderBlock?.type || '').trim();
        const Renderer = blockRenderers[blockKind];
        if (!Renderer) {
          return null;
        }
        const hudAnchor = resolveHudAnchor(renderBlock);
        const ownership = ownershipEnabled
          ? getBlockOwnershipVisual(
            getBlockCollaboration(ownershipPathname, renderBlock?.id),
            devIdentity?.userId,
          )
          : EMPTY_OWNERSHIP;
        const blockOwnership = ownershipEnabled && isAdminHiddenBlock(renderBlock)
          ? {
            ...ownership,
            className: `${ownership.className || ''} is-admin-hidden-block`.trim(),
          }
          : ownership;
        return (
          <Renderer
            key={getManagedBlockRenderKey(renderBlock, index)}
            block={renderBlock}
            resolveTo={resolveTo}
            heroHud={blockKind === 'hero' ? heroHud : null}
            hudAnchor={hudAnchor}
            ownership={blockOwnership}
          />
        );
      })}
    </>
  );
}
