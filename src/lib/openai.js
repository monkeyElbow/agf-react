export function isOpenAIConfigured() {
  // The key is server-side now. The endpoint may be unavailable or unconfigured,
  // in which case the caller uses the approved local fallback response.
  return true;
}

export async function requestSiteChatbotReply({ prompt, conversation = [] }) {
  const response = await fetch('/api/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ prompt: String(prompt || '').slice(0, 2000), conversation: conversation.slice(-6) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.details || data?.error || 'Chatbot request failed.');
    error.code = data?.error || 'chatbot-request-failed';
    error.status = response.status;
    throw error;
  }
  const outputText = String(data?.text || '').trim();
  if (!outputText) {
    throw new Error('OpenAI returned an empty response.');
  }

  return outputText;
}
