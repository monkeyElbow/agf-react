import OpenAI from 'openai';
import { buildSiteChatbotGroundingContext } from './chatbotGrounding';

export const OPENAI_CHATBOT_ENV_VAR = 'VITE_OPENAI_API_KEY';
export const OPENAI_CHATBOT_MODEL = 'gpt-5.4-mini';

const SITE_CHATBOT_SYSTEM_INSTRUCTION = [
  'You are the AGFinancial website assistant.',
  '',
  'Your job is to help users find the right AGFinancial page and answer questions using only approved AGFinancial website content when it is provided.',
  '',
  'Rules:',
  '1. When the user asks where to find something on the site, use the provided site navigation data first.',
  '2. Recommend the single best AGFinancial page by page title and URL when there is a clear match.',
  '3. Briefly explain why that page is the best match using the page summary or approved content.',
  '4. If there are 2 strong matches, list both in order of relevance and explain the difference in one sentence each.',
  '5. If no page clearly matches, say that clearly and recommend the Contact page.',
  '6. Do not invent URLs, page titles, services, rates, policies, or product details.',
  '7. For content questions, answer only from approved AGFinancial source content when provided.',
  '8. If the answer is not in the approved content, say you do not have enough approved information to answer and suggest the most relevant page or the Contact page.',
  '9. If a question appears to ask for personalized financial, legal, tax, or retirement advice, do not personalize the answer. Give only general site-based information and suggest contacting AGFinancial.',
  '10. Prefer concise, helpful, website-appropriate answers.',
  '',
  'Navigation behavior:',
  '- For “where can I find,” “where do I go,” “show me,” “looking for,” and similar questions, prioritize navigation.',
  '- Match user questions using titles, summaries, keywords, and synonyms from the provided navigation data.',
  '- Treat variations like “403b”, “403(b)”, “retirement plan”, “online contributions”, “forms”, “rates”, and “contact” as possible keyword matches.',
  '- Do not assume a page exists unless it is present in the provided navigation data.',
  '',
  'Response format for navigation questions:',
  '- Best match: [Page Title] — [URL]',
  '- Why: [1 short sentence]',
  '- Optional second match if truly helpful',
  '- If uncertain, say so briefly',
  '',
  'Response format for content questions:',
  '- Answer: [short answer from approved content]',
  '- Source page: [Page Title] — [URL] if available',
  '- If incomplete, say what is missing and suggest the best next page or contact route',
  '',
  'Style:',
  '- Professional',
  '- Clear',
  '- Warm but restrained',
  '- Appropriate for a public-facing AGFinancial website assistant',
  '',
  'Use navigation data for routing questions.',
  'Use approved content data for informational questions.',
  'If both are available, use navigation first to identify the best page, then use approved content from that page to answer briefly.',
].join('\n');

let openAIClient = null;

function getOpenAIApiKey() {
  return String(import.meta.env?.[OPENAI_CHATBOT_ENV_VAR] || '').trim();
}

function formatConversationPrompt(prompt, conversation) {
  const transcript = conversation
    .filter((message) => message?.role === 'assistant' || message?.role === 'user')
    .slice(-6)
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${String(message.text || '').trim()}`)
    .filter(Boolean)
    .join('\n\n');

  if (!transcript) {
    return prompt;
  }

  return `${transcript}\n\nUser: ${prompt}`;
}

function buildGroundedPrompt(prompt, conversation) {
  const conversationPrompt = formatConversationPrompt(prompt, conversation);
  // Local-test-only grounding: this small in-memory context can later be replaced by a server-side retrieval layer.
  const groundingContext = buildSiteChatbotGroundingContext(prompt);

  return [groundingContext, conversationPrompt].filter(Boolean).join('\n\n');
}

export function isOpenAIConfigured() {
  return Boolean(getOpenAIApiKey());
}

function getOpenAIClient() {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return null;
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey,
      // Local-test-only: this should move to a server route before any production deployment.
      dangerouslyAllowBrowser: true,
    });
  }

  return openAIClient;
}

export async function requestSiteChatbotReply({ prompt, conversation = [] }) {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  const response = await client.responses.create({
    model: OPENAI_CHATBOT_MODEL,
    instructions: SITE_CHATBOT_SYSTEM_INSTRUCTION,
    input: buildGroundedPrompt(prompt, conversation),
  });

  const outputText = String(response.output_text || '').trim();
  if (!outputText) {
    throw new Error('OpenAI returned an empty response.');
  }

  return outputText;
}
