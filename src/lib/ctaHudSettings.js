import { normalizeButtonTone } from './colorSystem';

const CTA_SUBMIT_STYLE_SET = new Set(['blue', 'dark', 'outline']);

export function normalizeCtaHudSubmitStyle(value) {
  const token = String(value || '').trim().toLowerCase();
  return CTA_SUBMIT_STYLE_SET.has(token) ? token : 'blue';
}

export function normalizeCtaHudSubmitTone(value, submitStyle = 'blue') {
  if (normalizeCtaHudSubmitStyle(submitStyle) === 'outline') {
    return normalizeButtonTone(value, 'atlantean');
  }
  return submitStyle === 'dark' ? 'super-grey' : 'atlantean';
}
