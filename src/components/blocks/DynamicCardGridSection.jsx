import { Link } from 'react-router-dom';
import BlockBackgroundEffects from '../BlockBackgroundEffects';
import BlockSurfaceLayers from '../BlockSurfaceLayers';
import CopyToClipboardButton from '../CopyToClipboardButton';
import SafeRichText from '../SafeRichText';
import { buildCanonicalBlockRuntime } from '../../blocks/registry';
import {
  actionButtonClassName,
  isExternalLinkHref,
} from '../../lib/dynamicPageBlocks';
import { buildPresetFamilyRuntimeClassName } from '../../lib/presetFamilyContract';
import { renderHighlightedText } from './PageBlocksRenderer';

function renderCardLink(item, key) {
  const label = String(item?.label || '').trim();
  const href = String(item?.href || '').trim();
  const to = String(item?.to || '').trim();
  if (!label || (!href && !to)) {
    return null;
  }
  const className = actionButtonClassName(item?.style, item?.tone);
  if (href || isExternalLinkHref(to)) {
    return (
      <a
        key={key}
        href={href || to}
        className={className}
        target={item?.openInNewWindow ? '_blank' : undefined}
        rel={item?.openInNewWindow ? 'noreferrer noopener' : undefined}
      >
        {label}
      </a>
    );
  }
  return (
    <Link
      key={key}
      to={to}
      className={className}
      target={item?.openInNewWindow ? '_blank' : undefined}
      rel={item?.openInNewWindow ? 'noreferrer noopener' : undefined}
    >
      {label}
    </Link>
  );
}

function renderCardTitle(card) {
  const title = card?.title || '';
  if (!title) {
    return null;
  }
  const content = Array.isArray(card.titleHighlights) && card.titleHighlights.length
    ? renderHighlightedText(title, card.titleHighlights)
    : title;
  const link = card.titleLink || {};
  if (link.href || link.to) {
    return link.href || isExternalLinkHref(link.to) ? (
      <a href={link.href || link.to} target={link.openInNewWindow ? '_blank' : undefined} rel={link.openInNewWindow ? 'noreferrer noopener' : undefined}>
        {content}
      </a>
    ) : (
      <Link to={link.to} target={link.openInNewWindow ? '_blank' : undefined} rel={link.openInNewWindow ? 'noreferrer noopener' : undefined}>
        {content}
      </Link>
    );
  }
  return content;
}

export default function DynamicCardGridSection({
  block,
  ownership = null,
  hudAnchor = null,
  sectionRef = null,
  sectionStyle = undefined,
  extraSectionClassName = '',
  backgroundEffects = null,
}) {
  const runtime = buildCanonicalBlockRuntime(block);
  if (!runtime) {
    return null;
  }

  const cardStyle = String(runtime.cardStyle || 'card2').trim() || 'card2';
  const cards = Array.isArray(runtime.cards) ? runtime.cards : [];
  const visibleCards = Number.isFinite(Number(runtime.cardCount)) && Number(runtime.cardCount) >= 1
    ? cards.filter((card) => Number(card.slot) <= Number(runtime.cardCount))
    : cards;
  const titleTone = runtime.titleTone || 'super-grey';
  const bodyTone = runtime.bodyTone || 'super-grey';
  const subheadTone = runtime.subheadTone || 'super-grey';
  const sectionClasses = [
    'service-native-section',
    'native-dynamic-grid',
    runtime.sectionClassName || '',
    runtime.cardHoverScale === true ? 'is-card-hover-scale' : '',
    runtime.cardHoverScale === false ? 'is-card-hover-scale-disabled' : '',
    runtime.cardOutline === true ? 'is-card-outline' : '',
    runtime.cardOutline === false ? 'is-card-outline-off' : '',
    runtime.cardOutlineTone ? `is-card-outline-${runtime.cardOutlineTone}` : 'is-card-outline-default',
    runtime.cardShadow === true ? 'is-card-shadow' : '',
    runtime.cardShadow === false ? 'is-card-shadow-off' : '',
    `is-bg-${runtime.bgTone}`,
    `is-width-${runtime.contentWidth}`,
    `is-title-${titleTone}`,
    runtime.titleToneOverride ? 'is-title-tone-override' : '',
    `is-body-${bodyTone}`,
    `is-subhead-${subheadTone}`,
    buildPresetFamilyRuntimeClassName('card_grid', runtime.presetId),
    `is-card-grid-style-${cardStyle}`,
    cardStyle === 'none' ? 'is-card-none' : '',
    extraSectionClassName,
    ownership?.className || '',
  ].filter(Boolean).join(' ');
  const style = {
    ...(sectionStyle || {}),
    ...(Number.isFinite(Number(runtime.paddingTopRem)) ? { paddingTop: `${runtime.paddingTopRem}rem` } : {}),
    ...(Number.isFinite(Number(runtime.paddingBottomRem)) ? { paddingBottom: `${runtime.paddingBottomRem}rem` } : {}),
    '--dynamic-grid-card-padding': `${runtime.cardPaddingRem}rem`,
    '--dynamic-grid-card-gap': `${runtime.cardGapRem}rem`,
    '--dynamic-grid-card-title-size': `${runtime.cardTitleSizeRem}rem`,
    '--dynamic-grid-card-title-justify': runtime.cardTitleJustify,
    '--dynamic-grid-card-title-body-space': `${runtime.cardTitleBodySpaceRem}rem`,
    '--dynamic-grid-card-outline-width': `${runtime.cardOutlineWidth}px`,
    '--dynamic-grid-card-shadow-opacity': String(runtime.cardShadowOpacity),
    '--dynamic-grid-card-body-size': `${runtime.cardBodySizeRem}rem`,
    '--dynamic-grid-card-body-line-height': String(runtime.cardBodyLineHeight),
    '--dynamic-grid-card-body-justify': runtime.cardBodyJustify,
    ...(Number.isFinite(Number(runtime.numberSizeRem))
      ? { '--numbered-step-card-number-size': `${runtime.numberSizeRem}rem` }
      : {}),
    ...(Number.isFinite(Number(runtime.cardTitleLineHeight))
      ? { '--dynamic-grid-card-title-line-height': String(runtime.cardTitleLineHeight) }
      : {}),
    ...(Number.isFinite(Number(runtime.headerSizeRem))
      ? { '--dynamic-grid-header-size': `${runtime.headerSizeRem}rem` }
      : {}),
    '--dynamic-grid-header-letter-spacing': `${runtime.headerLetterSpacingEm}em`,
    ...(Number.isFinite(Number(runtime.headerWidthPercent))
      ? { '--dynamic-grid-header-width': `${runtime.headerWidthPercent}%` }
      : {}),
    ...(Number.isFinite(Number(runtime.headerCardsSpaceRem))
      ? { '--dynamic-grid-header-cards-space': `${runtime.headerCardsSpaceRem}rem` }
      : {}),
    ...(Number.isFinite(Number(runtime.subheadSizeRem))
      ? { '--dynamic-grid-subhead-size': `${runtime.subheadSizeRem}rem` }
      : {}),
    '--dynamic-grid-subhead-justify': runtime.subtitleJustify,
    ...(Number.isFinite(Number(runtime.cardBulletSizeRem))
      ? { '--planned-giving-bullet-size': `${runtime.cardBulletSizeRem}rem` }
      : {}),
    ...(Number.isFinite(Number(runtime.cardBulletLineHeight))
      ? { '--planned-giving-bullet-line-height': String(runtime.cardBulletLineHeight) }
      : {}),
  };

  return (
    <section
      ref={sectionRef}
      className={sectionClasses}
      data-block-id={block?.id || undefined}
      style={style}
    >
      <BlockSurfaceLayers
        ownership={ownership}
        hudAnchor={hudAnchor}
        backgroundEffects={backgroundEffects || <BlockBackgroundEffects effects={block?.settings?.backgroundEffects} />}
      />
      <div className={runtime.contentWidth === 'browser' ? 'ag-panel-rail-wide' : 'ag-panel-rail'}>
        {(runtime.title || runtime.subtitle || runtime.body || runtime.bodyHtml) ? (
          <div className="native-info-section-copy">
            {runtime.title ? (
              <h2 className={runtime.titleClassName || undefined}>
                {runtime.titleHighlights?.length
                  ? renderHighlightedText(runtime.title, runtime.titleHighlights)
                  : runtime.title}
              </h2>
            ) : null}
            {runtime.subtitle ? <h3 className={runtime.subtitleClassName || undefined}>{runtime.subtitle}</h3> : null}
            {runtime.bodyHtml ? <SafeRichText as="div" className="native-info-rich-html" html={runtime.bodyHtml} /> : null}
            {!runtime.bodyHtml && runtime.body ? <p>{runtime.body}</p> : null}
          </div>
        ) : null}
        {visibleCards.length ? (
          <div className={`service-native-grid is-${runtime.columns || 'three'}`}>
            {visibleCards.map((card, index) => (
              <article key={`${block?.id || 'card-grid'}-${card.slot || index + 1}`} className={`service-native-card ${card.cardClass || cardStyle}`}>
                {card.iconKey ? <span className={`service-native-card-icon is-${card.iconTone || 'atlantean'}`}>{card.iconKey}</span> : null}
                {card.title ? (
                  <h3 style={{ textAlign: runtime.cardTitleJustify || undefined }}>
                    <span className="service-native-card-title-content">{renderCardTitle(card)}</span>
                  </h3>
                ) : null}
                <div className="service-native-card-flow">
                  {card.body ? <p>{card.body}</p> : null}
                  {card.bodyHtml ? <SafeRichText as="div" className="native-info-rich-html service-native-card-rich-body" html={card.bodyHtml} /> : null}
                  {card.copyText ? <CopyToClipboardButton text={card.copyText} label={card.copyLabel || 'Copy'} /> : null}
                  {Array.isArray(card.list) && card.list.length ? (
                    <ul className="service-native-card-bullet-list">
                      {card.list.map((item) => <li key={`${card.slot}-${item}`}>{item}</li>)}
                    </ul>
                  ) : null}
                  {Array.isArray(card.links) && card.links.length ? (
                    <ul className="service-native-card-link-list">
                      {card.links.map((item, linkIndex) => <li key={`${card.slot}-link-${linkIndex}`}>{renderCardLink(item, `${card.slot}-link-${linkIndex}`)}</li>)}
                    </ul>
                  ) : null}
                  {Array.isArray(card.actions) && card.actions.length ? (
                    <div className="service-native-action-row">
                      {card.actions.map((item, actionIndex) => renderCardLink(item, `${card.slot}-action-${actionIndex}`))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {Array.isArray(runtime.actions) && runtime.actions.length ? (
          <div className="service-native-action-row">
            {runtime.actions.map((item, index) => renderCardLink(item, `section-action-${index}`))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
