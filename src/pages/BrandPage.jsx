import { useEffect, useState } from 'react';
import agfLogo from '../assets/agf-logo.svg';
import agfLogoFooter from '../assets/agf-logo-footer.svg';

const LOGO_FILES = [
  {
    id: 'primary',
    name: 'Primary Wordmark',
    filename: 'agf-logo.svg',
    src: agfLogo,
    surfaceClassName: 'is-light',
    note: 'SVG',
  },
  {
    id: 'reverse',
    name: 'Reverse Wordmark',
    filename: 'agf-logo-footer.svg',
    src: agfLogoFooter,
    surfaceClassName: 'is-dark',
    note: 'SVG',
  },
];

const BRAND_COLORS = [
  { id: 'atlantean', name: 'Atlantean', hex: '#00ADBB', textOnSwatch: '#FFFFFF' },
  { id: 'atlantean-dark', name: 'Atlantean Dark', hex: '#008AAB', textOnSwatch: '#FFFFFF' },
  { id: 'mango', name: 'Mango', hex: '#FAA31A', textOnSwatch: '#414042' },
  { id: 'mango-dark', name: 'Mango Dark', hex: '#E8991F', textOnSwatch: '#414042' },
  { id: 'sandstone', name: 'Sandstone', hex: '#C4BEB6', textOnSwatch: '#414042' },
  { id: 'sandstone-dark', name: 'Sandstone Dark', hex: '#B1AAA2', textOnSwatch: '#414042' },
  { id: 'sand', name: 'Sand', hex: '#F2EEEB', textOnSwatch: '#414042' },
  { id: 'sand-dark', name: 'Sand Dark', hex: '#DAD7D0', textOnSwatch: '#414042' },
  { id: 'melon', name: 'Melon', hex: '#F26660', textOnSwatch: '#FFFFFF' },
  { id: 'melon-dark', name: 'Melon Dark', hex: '#D8423C', textOnSwatch: '#FFFFFF' },
  { id: 'super-grey', name: 'Super Grey', hex: '#414042', textOnSwatch: '#FFFFFF' },
  { id: 'super-grey-dark', name: 'Super Grey Mid', hex: '#636265', textOnSwatch: '#FFFFFF' },
];

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M7 3.5A2.5 2.5 0 0 0 4.5 6v7A2.5 2.5 0 0 0 7 15.5h7a2.5 2.5 0 0 0 2.5-2.5V6A2.5 2.5 0 0 0 14 3.5H7Zm0 1.5h7c.55 0 1 .45 1 1v7c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1Z" fill="currentColor" />
      <path d="M3.5 7.5a.75.75 0 0 1 .75.75v6c0 .97.78 1.75 1.75 1.75h6a.75.75 0 0 1 0 1.5H6A3.25 3.25 0 0 1 2.75 14.25v-6a.75.75 0 0 1 .75-.75Z" fill="currentColor" />
    </svg>
  );
}

async function copyText(value) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  if (typeof document === 'undefined') {
    return false;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'absolute';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(input);
  return copied;
}

export default function BrandPage() {
  const [copiedColorId, setCopiedColorId] = useState('');

  useEffect(() => {
    if (!copiedColorId) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setCopiedColorId(''), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copiedColorId]);

  return (
    <main className="page-wrap brand-page">
      <section className="brand-page-hero">
        <div className="ag-panel-rail">
          <div className="brand-page-hero-shell">
            <p className="brand-page-kicker">Brand kit</p>
            <h1>Logo files and palette standards.</h1>
            <p className="brand-page-lead">
              Download the current SVG wordmarks and copy exact brand hex values from a single source.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-page-section">
        <div className="ag-panel-rail">
          <div className="brand-page-section-head">
            <p className="brand-page-eyebrow">Logo files</p>
            <h2>Current SVG wordmarks</h2>
            <p>
              The page is structured to add more lockups later. For now, these are the live SVG assets already used in
              the site.
            </p>
          </div>

          <div className="brand-logo-grid">
            {LOGO_FILES.map((logo) => (
              <article key={logo.id} className="brand-logo-card">
                <div className={`brand-logo-surface ${logo.surfaceClassName}`}>
                  <img src={logo.src} alt={`${logo.name} logo`} className="brand-logo-preview" />
                </div>
                <div className="brand-logo-meta">
                  <div>
                    <p className="brand-logo-label">{logo.name}</p>
                    <p className="brand-logo-note">{logo.filename}</p>
                  </div>
                  <a className="action-btn action-btn-outline" href={logo.src} download={logo.filename}>
                    Download SVG
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-page-section is-palette">
        <div className="ag-panel-rail">
          <div className="brand-page-section-head">
            <p className="brand-page-eyebrow">Palette</p>
            <h2>Brand color standards</h2>
            <p>Each swatch uses the current token value. Copy the hex directly from the control on the right.</p>
          </div>

          <div className="brand-swatch-grid">
            {BRAND_COLORS.map((color) => {
              const isCopied = copiedColorId === color.id;
              return (
                <article key={color.id} className="brand-swatch-card">
                  <div
                    className="brand-swatch-color"
                    style={{ backgroundColor: color.hex, color: color.textOnSwatch }}
                  >
                    <span>{color.name}</span>
                  </div>
                  <div className="brand-swatch-meta">
                    <div className="brand-swatch-copy">
                      <p className="brand-swatch-name">{color.name}</p>
                      <p className="brand-swatch-hex">{color.hex}</p>
                    </div>
                    <button
                      type="button"
                      className={`brand-copy-btn${isCopied ? ' is-copied' : ''}`}
                      aria-label={`Copy ${color.name} hex`}
                      onClick={async () => {
                        const didCopy = await copyText(color.hex);
                        setCopiedColorId(didCopy ? color.id : '');
                      }}
                    >
                      <CopyIcon />
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
