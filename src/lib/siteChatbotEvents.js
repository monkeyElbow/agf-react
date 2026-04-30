export const OPEN_SITE_CHATBOT_EVENT = 'agf:open-site-chatbot';

export function dispatchOpenSiteChatbot() {
  if (typeof document === 'undefined') {
    return false;
  }

  document.dispatchEvent(new CustomEvent(OPEN_SITE_CHATBOT_EVENT));
  return true;
}
