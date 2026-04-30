import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isOpenAIConfigured, requestSiteChatbotReply } from '../lib/openai';
import { buildSiteChatbotFallbackReply } from '../lib/chatbotGrounding';
import { parseAssistantMessage } from '../lib/parseAssistantMessage';
import { OPEN_SITE_CHATBOT_EVENT } from '../lib/siteChatbotEvents';

const DESKTOP_QUERY = '(min-width: 768px)';
const FALLBACK_RESPONSE_DELAY_MS = 360;

const SUGGESTED_PROMPTS = [
  'What retirement options do you offer?',
  'Show current rates',
  'How can I contact a consultant?',
  'What loan solutions are available?',
];

const INITIAL_MESSAGES = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    text: 'Welcome to Ask AGFinancial. I can help you explore approved site content, rates guidance, service categories, and next-step contact options.',
    timestamp: new Date('2026-04-20T09:00:00'),
  },
];

function getTimestampLabel(value) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (element.hidden) {
      return false;
    }
    if (element.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    return element.tabIndex >= 0;
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function AssistantMessageContent({ text }) {
  const parsed = parseAssistantMessage(text);

  if (parsed.type === 'navigation' || parsed.type === 'navigation-fallback') {
    const showFallbackIntro = parsed.type === 'navigation-fallback' && parsed.intro;

    return (
      <div className="site-chatbot-structured">
        {showFallbackIntro ? (
          <p className="site-chatbot-message-text site-chatbot-message-text--intro">{parsed.intro}</p>
        ) : null}

        {parsed.bestMatch?.title && parsed.bestMatch?.url ? (
          <div className="site-chatbot-result-card site-chatbot-result-card--primary">
            <p className="site-chatbot-result-label">
              {parsed.type === 'navigation' ? 'Best match' : 'Best next page'}
            </p>
            <Link className="site-chatbot-result-link" to={parsed.bestMatch.url}>
              {parsed.bestMatch.title}
            </Link>
            {parsed.bestMatch.why ? (
              <p className="site-chatbot-result-why">{parsed.bestMatch.why}</p>
            ) : null}
          </div>
        ) : null}

        {parsed.secondMatch?.title && parsed.secondMatch?.url ? (
          <div className="site-chatbot-result-card site-chatbot-result-card--secondary">
            <p className="site-chatbot-result-label">Second match</p>
            <Link className="site-chatbot-result-link" to={parsed.secondMatch.url}>
              {parsed.secondMatch.title}
            </Link>
            {parsed.secondMatch.why ? (
              <p className="site-chatbot-result-why">{parsed.secondMatch.why}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (parsed.type === 'content') {
    return (
      <div className="site-chatbot-structured">
        {parsed.answer ? (
          <div className="site-chatbot-message-copy">
            <p className="site-chatbot-result-label">Answer</p>
            <p className="site-chatbot-message-text">{parsed.answer}</p>
          </div>
        ) : null}

        {parsed.sourcePage?.title && parsed.sourcePage?.url ? (
          <div className="site-chatbot-result-card site-chatbot-result-card--secondary">
            <p className="site-chatbot-result-label">Source page</p>
            <Link className="site-chatbot-result-link" to={parsed.sourcePage.url}>
              {parsed.sourcePage.title}
            </Link>
          </div>
        ) : null}

        {!parsed.answer && !parsed.sourcePage ? (
          <div className="site-chatbot-message-copy">
            {parsed.paragraphs.map((paragraph) => (
              <p key={paragraph} className="site-chatbot-message-text">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="site-chatbot-message-copy">
      {parsed.paragraphs.map((paragraph) => (
        <p key={paragraph} className="site-chatbot-message-text">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default function SiteChatbotWindow({
  title = 'Ask AGFinancial',
  subtitle = 'Answers from AGFinancial website content',
  contactPath = '/contact-us',
}) {
  const panelId = useId();
  const titleId = useId();
  const subtitleId = useId();
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(DESKTOP_QUERY).matches
      : false,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const launcherRef = useRef(null);
  const panelRef = useRef(null);
  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const previousFocusedElementRef = useRef(null);
  const isMountedRef = useRef(true);

  const hasUserMessages = useMemo(
    () => messages.some((message) => message.role === 'user'),
    [messages],
  );

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia(DESKTOP_QUERY);
    const syncDesktopState = () => setIsDesktop(media.matches);
    syncDesktopState();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncDesktopState);
      return () => media.removeEventListener('change', syncDesktopState);
    }

    media.addListener(syncDesktopState);
    return () => media.removeListener(syncDesktopState);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [draft]);

  useEffect(() => {
    const messageSurface = messagesRef.current;
    if (!messageSurface) {
      return;
    }

    messageSurface.scrollTop = messageSurface.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusTimer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 20);

    return () => {
      window.clearTimeout(focusTimer);
      previousFocusedElementRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isDesktop) {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      // Trap focus inside the floating panel so it behaves like a lightweight site dialog.
      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements(panelRef.current);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handlePointerDown = (event) => {
      if (!isDesktop) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(target) || launcherRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isDesktop, isOpen]);

  function openChat() {
    setIsOpen(true);
  }

  function closeChat() {
    setIsOpen(false);
  }

  function appendMessage(message) {
    setMessages((current) => [...current, message]);
  }

  async function submitPrompt(promptText) {
    const trimmed = String(promptText || '').trim();
    if (!trimmed || status === 'loading') {
      return;
    }

    setErrorMessage('');
    setStatus('loading');
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    const conversation = [...messages, userMessage];
    appendMessage(userMessage);
    setDraft('');

    if (!isOpenAIConfigured()) {
      await wait(FALLBACK_RESPONSE_DELAY_MS);
      if (!isMountedRef.current) {
        return;
      }

      appendMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: buildSiteChatbotFallbackReply(trimmed),
        timestamp: new Date(),
      });
      setStatus('idle');
      return;
    }

    try {
      const assistantReply = await requestSiteChatbotReply({
        prompt: trimmed,
        conversation,
      });
      if (!isMountedRef.current) {
        return;
      }

      appendMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: assistantReply,
        timestamp: new Date(),
      });
      setStatus('idle');
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setStatus('error');
      setErrorMessage('We could not reach the local OpenAI test connection. Please try again in a moment or use the contact action for direct assistance.');
      console.error('Site chatbot OpenAI request failed.', error);
    }
  }

  function toggleChat() {
    if (isOpen) {
      closeChat();
      return;
    }
    openChat();
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitPrompt(draft);
  }

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const handleOpenSiteChatbot = () => {
      openChat();
    };

    document.addEventListener(OPEN_SITE_CHATBOT_EVENT, handleOpenSiteChatbot);
    return () => {
      document.removeEventListener(OPEN_SITE_CHATBOT_EVENT, handleOpenSiteChatbot);
    };
  }, []);

  return (
    <div className={`site-chatbot${isOpen ? ' is-open' : ''}${isDesktop ? ' is-desktop' : ' is-mobile'}`}>
      {isOpen ? (
        <div className="site-chatbot-panel-shell">
          <section
            id={panelId}
            ref={panelRef}
            className="site-chatbot-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitleId}
          >
            <header className="site-chatbot-header">
              <div className="site-chatbot-header-copy">
                <div className="site-chatbot-header-row">
                  <p className="site-chatbot-kicker">Chat</p>
                </div>
                <h2 id={titleId}>{title}</h2>
                <p id={subtitleId}>{subtitle}</p>
              </div>

              <button
                type="button"
                className="site-chatbot-close"
                onClick={closeChat}
                aria-label="Close Ask AGFinancial"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <div className="site-chatbot-body">
              <div ref={messagesRef} className="site-chatbot-messages" aria-live="polite">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`site-chatbot-message site-chatbot-message--${message.role}`}
                  >
                    <div className="site-chatbot-message-surface">
                      <p className="site-chatbot-message-label">
                        {message.role === 'assistant' ? 'AGFinancial Assistant' : 'You'}
                      </p>
                      {message.role === 'assistant' ? (
                        <AssistantMessageContent text={message.text} />
                      ) : (
                        <div className="site-chatbot-message-copy">
                          <p className="site-chatbot-message-text">{message.text}</p>
                        </div>
                      )}
                      <p className="site-chatbot-message-time">{getTimestampLabel(message.timestamp)}</p>
                    </div>
                  </article>
                ))}

                {!hasUserMessages ? (
                  <div className="site-chatbot-suggestions" aria-label="Suggested prompts">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="site-chatbot-suggestion"
                        onClick={() => submitPrompt(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                    <Link className="site-chatbot-suggestion site-chatbot-suggestion--contact" to={contactPath}>
                      Contact AGFinancial
                    </Link>
                  </div>
                ) : null}

                {status === 'loading' ? (
                  <div className="site-chatbot-status" role="status" aria-live="polite">
                    <span className="site-chatbot-status-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    <span>Reviewing approved AGFinancial content…</span>
                  </div>
                ) : null}

                {status === 'error' ? (
                  <div className="site-chatbot-status site-chatbot-status--error" role="alert">
                    <p>{errorMessage}</p>
                    <button
                      type="button"
                      className="service-native-btn is-ghost site-chatbot-inline-action"
                      onClick={() => submitPrompt(draft || 'How can I contact a consultant?')}
                    >
                      Try again
                    </button>
                  </div>
                ) : null}
              </div>

              <footer className="site-chatbot-footer">
                <form className="site-chatbot-composer" onSubmit={handleSubmit}>
                  <label className="sr-only" htmlFor={`site-chatbot-input-${titleId}`}>
                    Ask AGFinancial a question
                  </label>
                  <textarea
                    id={`site-chatbot-input-${titleId}`}
                    ref={textareaRef}
                    className="site-chatbot-input"
                    value={draft}
                    rows={1}
                    placeholder="Ask about services, rates, or next steps"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        submitPrompt(draft);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="service-native-btn site-chatbot-send"
                    disabled={!draft.trim() || status === 'loading'}
                  >
                    Send
                  </button>
                </form>

                <div className="site-chatbot-footer-row">
                  <p className="site-chatbot-disclaimer">
                    For general information only. For personalized guidance, contact AGFinancial.
                  </p>
                  <Link className="service-native-btn is-ghost site-chatbot-contact-link" to={contactPath}>
                    Contact AGFinancial
                  </Link>
                </div>
              </footer>
            </div>
          </section>
        </div>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        className="site-chatbot-launcher"
        onClick={toggleChat}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label={isOpen ? 'Hide Ask AGFinancial' : 'Open Ask AGFinancial'}
      >
        <span className="site-chatbot-launcher-icon" aria-hidden="true">
          ?
        </span>
        <span className="site-chatbot-launcher-copy">
          <span className="site-chatbot-launcher-label">{title}</span>
        </span>
      </button>
    </div>
  );
}
