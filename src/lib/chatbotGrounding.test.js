import { describe, expect, it } from 'vitest';
import { buildSiteChatbotGroundingContext, isLikelyNavigationQuestion, selectSiteChatbotGrounding } from './chatbotGrounding';

describe('chatbotGrounding', () => {
  it('treats 403(b) page-finding questions as navigation-first and surfaces individual enrollment', () => {
    const grounding = selectSiteChatbotGrounding('Where can I find information about a 403b for individual?');

    expect(grounding.navigationQuestion).toBe(true);
    expect(grounding.navigationEntries.map((entry) => entry.title)).toContain('403b Individual Enrollment');
    expect(grounding.navigationEntries.map((entry) => entry.title)).toContain('403(b)');
    expect(grounding.contentEntries.map((entry) => entry.title)).toContain('403(b)');
  });

  it('surfaces contact data for phone and email questions', () => {
    const grounding = selectSiteChatbotGrounding('How do I contact AGFinancial?');

    expect(grounding.navigationEntries[0]?.title).toBe('Contact Us');
    expect(grounding.contentEntries[0]?.title).toBe('Contact Us');
  });

  it('surfaces the rates route and rates content for rate questions', () => {
    const grounding = selectSiteChatbotGrounding('What rates do you offer?');

    expect(grounding.navigationEntries[0]?.title).toBe('Rates');
    expect(grounding.contentEntries[0]?.title).toBe('Rates');
  });

  it('falls back to contact and services when there is no strong topical match', () => {
    const grounding = selectSiteChatbotGrounding('Can you help me find something?');

    expect(grounding.navigationEntries.map((entry) => entry.url)).toEqual(['/services', '/contact-us']);
    expect(grounding.contentEntries.map((entry) => entry.url)).toEqual(['/services', '/contact-us']);
  });

  it('builds a compact context block for the OpenAI request', () => {
    const context = buildSiteChatbotGroundingContext('Show me current APY options');

    expect(context).toContain('Local AGFinancial grounding context:');
    expect(context).toContain('Rates — /rates');
    expect(context).toContain('Approved content excerpts:');
  });

  it('detects navigation-oriented wording', () => {
    expect(isLikelyNavigationQuestion('Where do I go for forms?')).toBe(true);
    expect(isLikelyNavigationQuestion('What rates do you offer?')).toBe(false);
  });
});
