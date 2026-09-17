import { useState } from 'react';

export async function copyTextToClipboard(text) {
  const value = String(text || '');
  if (!value) {
    return false;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Continue to the textarea fallback for local/LAN pages where the
      // Clipboard API is present but not permitted by the browser.
    }
  }

  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false;
  }

  const fallbackInput = document.createElement('textarea');
  fallbackInput.value = value;
  fallbackInput.setAttribute('readonly', '');
  fallbackInput.style.position = 'fixed';
  fallbackInput.style.opacity = '0';
  document.body.appendChild(fallbackInput);
  fallbackInput.select();
  try {
    return document.execCommand('copy');
  } finally {
    fallbackInput.remove();
  }
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 5.5h6M9.5 3.5h5a1.5 1.5 0 0 1 1.5 1.5v1H8v-1a1.5 1.5 0 0 1 1.5-1.5Z" />
      <rect x="5" y="6" width="14" height="15" rx="2" />
    </svg>
  );
}

export default function CopyToClipboardButton({ text, label = 'Copy', className = '' }) {
  const [status, setStatus] = useState('');
  const hasText = Boolean(String(text || '').trim());

  if (!hasText) {
    return null;
  }

  const onCopy = async () => {
    const copied = await copyTextToClipboard(text);
    setStatus(copied ? 'Copied.' : 'Copy not available.');
  };

  return (
    <div className={`service-native-copy-card-control${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="service-native-copy-card-button"
        onClick={onCopy}
        aria-label={`${label}: copy text`}
      >
        <ClipboardIcon />
        <span>{label}</span>
      </button>
      <span className="service-native-copy-card-status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
