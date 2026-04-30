import { useEffect } from 'react';

const SCRIPT_ID = 'ctct-signup-script';
const SCRIPT_SRC = 'https://static.ctctcdn.com/js/signup-form-widget/current/signup-form-widget.min.js';
const CTCT_MARKET_ID = '856e433a3f8a6352829b022764f661bc';

function ensureSignupScript() {
  if (typeof document === 'undefined') {
    return;
  }
  if (typeof window !== 'undefined' && !window._ctct_m) {
    window._ctct_m = CTCT_MARKET_ID;
  }
  if (document.getElementById(SCRIPT_ID)) {
    return;
  }
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
}

export default function ConstantContactInlineForm({ formId, accountId = '', sourceId = '' }) {
  const nextFormId = String(formId || '').trim();
  const nextAccountId = String(accountId || '').trim();
  const nextSourceId = String(sourceId || '').trim();

  useEffect(() => {
    if (typeof window === 'undefined' || !nextFormId) {
      return undefined;
    }

    ensureSignupScript();

    let attempts = 0;
    const maxAttempts = 10;
    const tryReload = () => {
      attempts += 1;
      if (window._ctct_m && window.CTCTSignUpForm?.reload) {
        window.CTCTSignUpForm.reload();
        return true;
      }
      return false;
    };

    if (tryReload()) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      if (tryReload() || attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 500);

    return () => {
      window.clearInterval(timer);
    };
  }, [nextFormId]);

  if (!nextFormId) {
    return null;
  }

  return (
    <div
      className="ctct-inline-form"
      data-form-id={nextFormId}
      data-account-id={nextAccountId || undefined}
      data-source-id={nextSourceId || undefined}
    />
  );
}
