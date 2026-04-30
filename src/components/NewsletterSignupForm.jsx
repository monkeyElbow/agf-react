import { useEffect, useId, useRef, useState } from 'react';

const SUBMIT_DELAY_MS = 240;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value || '').trim());
}

export default function NewsletterSignupForm({
  className = '',
  ariaLabel = 'Newsletter signup form',
}) {
  const inputId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const submitTimerRef = useRef(null);

  useEffect(() => () => {
    if (submitTimerRef.current) {
      window.clearTimeout(submitTimerRef.current);
    }
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedEmail = String(email || '').trim();
    if (!isValidEmail(trimmedEmail)) {
      setStatus('error');
      setFeedback('Enter a valid email address to continue.');
      return;
    }

    setStatus('loading');
    setFeedback('');

    if (submitTimerRef.current) {
      window.clearTimeout(submitTimerRef.current);
    }

    submitTimerRef.current = window.setTimeout(() => {
      setStatus('success');
      setFeedback('Thanks. This native form is in place, but the Constant Contact handoff is still deferred in this local prototype.');
      setEmail('');
      submitTimerRef.current = null;
    }, SUBMIT_DELAY_MS);
  }

  return (
    <div className={`newsletter-signup-form${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
      <form className="newsletter-signup-form-shell" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor={inputId}>
          Email address
        </label>
        <div className="newsletter-signup-form-row">
          <input
            id={inputId}
            className="newsletter-signup-form-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={status === 'error'}
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            className="service-native-btn newsletter-signup-form-submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Joining…' : 'Join the list'}
          </button>
        </div>
      </form>

      <p className="newsletter-signup-form-note">
        Occasional updates only. Unsubscribe anytime. Local prototype: Constant Contact handoff is not connected yet.
      </p>

      {feedback ? (
        <p
          className={`newsletter-signup-form-feedback is-${status === 'error' ? 'error' : 'success'}`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
