import heroBlockIcon from '../assets/admin-block-icons/hero.svg';
import introBlockIcon from '../assets/admin-block-icons/intro.svg';
import billboardBlockIcon from '../assets/admin-block-icons/billboard.svg';
import gridBlockIcon from '../assets/admin-block-icons/grid.svg';
import ctaFormBlockIcon from '../assets/admin-block-icons/cta-form.svg';
import columnsBlockIcon from '../assets/admin-block-icons/columns.svg';
import pageContentBlockIcon from '../assets/admin-block-icons/page-content.svg';
import ratesBlockIcon from '../assets/admin-block-icons/rates.svg';
import newsletterBlockIcon from '../assets/admin-block-icons/newsletter.svg';
import topStripBlockIcon from '../assets/admin-block-icons/top-strip.svg';
import requestFormBlockIcon from '../assets/admin-block-icons/request-form.svg';
import testimonialsBlockIcon from '../assets/admin-block-icons/testimonials.svg';
import { isPageContentKind, isPageContentTemplateId } from './pageContentIdentity';

export function toBlockKindMonogram(kind) {
  const token = String(kind || '').trim().toUpperCase();
  if (!token) {
    return 'BL';
  }
  const parts = token.split(/[^A-Z0-9]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`;
  }
  return parts.length === 1 ? parts[0].slice(0, 2) : token.slice(0, 2);
}

const BLOCK_TEMPLATE_ICON_BY_ID = {
  hero: heroBlockIcon,
  intro: introBlockIcon,
  billboard: billboardBlockIcon,
  grid: gridBlockIcon,
  columns: columnsBlockIcon,
  cta_form: ctaFormBlockIcon,
  certificates_table: ratesBlockIcon,
  ira_table: ratesBlockIcon,
  newsletter: newsletterBlockIcon,
  top_strip: topStripBlockIcon,
  request_form: requestFormBlockIcon,
  testimonials: testimonialsBlockIcon,
};

const BLOCK_TEMPLATE_ICON_BY_KIND = {
  hero: heroBlockIcon,
  intro: introBlockIcon,
  billboard: billboardBlockIcon,
  card_grid: gridBlockIcon,
  card_chart: pageContentBlockIcon,
  columns: columnsBlockIcon,
  cta_form: ctaFormBlockIcon,
  newsletter: newsletterBlockIcon,
  top_strip: topStripBlockIcon,
  request_form: requestFormBlockIcon,
  testimonials: testimonialsBlockIcon,
};

export function getBlockTemplateIcon(template) {
  const templateId = String(template?.templateId || '').trim();
  const kind = String(template?.kind || '').trim();
  if (isPageContentTemplateId(templateId) || isPageContentKind(kind)) {
    return pageContentBlockIcon;
  }
  return BLOCK_TEMPLATE_ICON_BY_ID[templateId] || BLOCK_TEMPLATE_ICON_BY_KIND[kind] || '';
}
