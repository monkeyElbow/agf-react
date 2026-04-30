import ColorPalette from './ColorPalette';

function toBool(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const token = value.trim().toLowerCase();
    if (token === 'true') {
      return true;
    }
    if (token === 'false') {
      return false;
    }
  }
  if (value == null) {
    return fallback;
  }
  return Boolean(value);
}

function TogglePills({
  label,
  value,
  onChange,
  onLabel = 'On',
  offLabel = 'Off',
}) {
  return (
    <div className="admin-top-strip-hud-toggle-row">
      <span>{label}</span>
      <div className="admin-front-hud-segment" role="group" aria-label={label}>
        <button
          type="button"
          className={`admin-front-hud-segment-btn${value ? ' is-active' : ''}`}
          onClick={() => onChange(true)}
        >
          {onLabel}
        </button>
        <button
          type="button"
          className={`admin-front-hud-segment-btn${!value ? ' is-active' : ''}`}
          onClick={() => onChange(false)}
        >
          {offLabel}
        </button>
      </div>
    </div>
  );
}

export default function TopStripHudEditorPanel({
  settings = {},
  onSettingChange,
  bgOptions = [],
  textOptions = [],
  loginToneOptions = [],
  ratesToneOptions = [],
}) {
  const showLogin = toBool(settings.showLogin, true);
  const showPhone = toBool(settings.showPhone, true);
  const showRates = toBool(settings.showRates, true);
  const loginOpenInNewWindow = toBool(settings.loginOpenInNewWindow, true);
  const ratesOpenInNewWindow = toBool(settings.ratesOpenInNewWindow, false);
  const loginButtonStyle = String(settings.loginButtonStyle || 'solid').trim().toLowerCase() || 'solid';
  const loginButtonToneOptions = loginButtonStyle === 'outline' && Array.isArray(ratesToneOptions) && ratesToneOptions.length
    ? ratesToneOptions
    : loginToneOptions;

  return (
    <div className="admin-top-strip-hud-editor">
      <section className="admin-top-strip-hud-card">
        <div className="admin-top-strip-hud-card-head">
          <h4>Strip</h4>
          <p>Global appearance</p>
        </div>
        <div className="admin-front-hud-row">
          <span>Background Color</span>
          <ColorPalette
            variant="hud"
            className="is-compact is-icon-only"
            ariaLabel="Top strip background color"
            options={bgOptions}
            value={String(settings.bgTone || 'grey')}
            onChange={(nextValue) => onSettingChange?.('bgTone', nextValue)}
          />
        </div>
        <div className="admin-front-hud-row">
          <span>Base Text Color</span>
          <ColorPalette
            variant="hud"
            className="is-compact is-icon-only"
            ariaLabel="Top strip base text color"
            options={textOptions}
            value={String(settings.textTone || 'white')}
            onChange={(nextValue) => onSettingChange?.('textTone', nextValue)}
          />
          <p className="admin-front-hud-note">Applies to phone number and non-button strip text.</p>
        </div>
        <div className="admin-top-strip-hud-mini-grid">
          <label className="admin-front-hud-field">
            <span>Font Size</span>
            <input
              type="number"
              min="0.7"
              max="1.3"
              step="0.05"
              value={String(settings.sectionFontSizeRem ?? 0.95)}
              onChange={(event) => onSettingChange?.('sectionFontSizeRem', Number(event.target.value))}
            />
          </label>
          <label className="admin-front-hud-field">
            <span>Item Gap</span>
            <input
              type="number"
              min="0.6"
              max="2"
              step="0.05"
              value={String(settings.itemGapRem ?? 1)}
              onChange={(event) => onSettingChange?.('itemGapRem', Number(event.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="admin-top-strip-hud-card">
        <div className="admin-top-strip-hud-card-head">
          <h4>Secure Login</h4>
          <p>Left-side button</p>
        </div>
        <TogglePills
          label="Show Login"
          value={showLogin}
          onChange={(nextValue) => onSettingChange?.('showLogin', nextValue)}
        />
        <TogglePills
          label="Open in New Tab"
          value={loginOpenInNewWindow}
          onChange={(nextValue) => onSettingChange?.('loginOpenInNewWindow', nextValue)}
        />
        <label className="admin-front-hud-field">
          <span>Login Label</span>
          <input
            type="text"
            value={String(settings.loginLabel || '')}
            onChange={(event) => onSettingChange?.('loginLabel', event.target.value)}
          />
        </label>
        <label className="admin-front-hud-field">
          <span>Login URL</span>
          <input
            type="text"
            value={String(settings.loginHref || '')}
            onChange={(event) => onSettingChange?.('loginHref', event.target.value)}
          />
        </label>
        <div className="admin-front-hud-row">
          <span>Login Button Style</span>
          <div className="admin-front-hud-segment">
            {['solid', 'outline'].map((style) => (
              <button
                key={`home-strip-login-style-${style}`}
                type="button"
                className={`admin-front-hud-segment-btn${String(settings.loginButtonStyle || 'solid') === style ? ' is-active' : ''}`}
                onClick={() => onSettingChange?.('loginButtonStyle', style)}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-front-hud-row">
          <span>Login Button Color</span>
          <ColorPalette
            variant="hud"
            className="is-compact is-icon-only"
            ariaLabel="Top strip login button color"
            options={loginButtonToneOptions}
            value={String(settings.loginButtonTone || 'atlantean')}
            onChange={(nextValue) => onSettingChange?.('loginButtonTone', nextValue)}
          />
        </div>
      </section>

      <section className="admin-top-strip-hud-card">
        <div className="admin-top-strip-hud-card-head">
          <h4>Phone + Rates</h4>
          <p>Right-side controls</p>
        </div>
        <TogglePills
          label="Show Phone"
          value={showPhone}
          onChange={(nextValue) => onSettingChange?.('showPhone', nextValue)}
        />
        <label className="admin-front-hud-field">
          <span>Phone Number</span>
          <input
            type="text"
            value={String(settings.phone || '')}
            onChange={(event) => onSettingChange?.('phone', event.target.value)}
          />
        </label>
        <TogglePills
          label="Show Rates Link"
          value={showRates}
          onChange={(nextValue) => onSettingChange?.('showRates', nextValue)}
        />
        <TogglePills
          label="Rates Opens in New Tab"
          value={ratesOpenInNewWindow}
          onChange={(nextValue) => onSettingChange?.('ratesOpenInNewWindow', nextValue)}
        />
        <label className="admin-front-hud-field">
          <span>Rates Label</span>
          <input
            type="text"
            value={String(settings.ratesLabel || '')}
            onChange={(event) => onSettingChange?.('ratesLabel', event.target.value)}
          />
        </label>
        <label className="admin-front-hud-field">
          <span>Rates URL / Path</span>
          <input
            type="text"
            value={String(settings.ratesPath || '')}
            onChange={(event) => onSettingChange?.('ratesPath', event.target.value)}
          />
        </label>
        <div className="admin-front-hud-row">
          <span>Rates Link Style</span>
          <div className="admin-front-hud-segment">
            {['link', 'solid', 'outline'].map((style) => (
              <button
                key={`home-strip-rates-style-${style}`}
                type="button"
                className={`admin-front-hud-segment-btn${String(settings.ratesButtonStyle || 'link') === style ? ' is-active' : ''}`}
                onClick={() => onSettingChange?.('ratesButtonStyle', style)}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-front-hud-row">
          <span>Rates Link Color</span>
          <ColorPalette
            variant="hud"
            className="is-compact is-icon-only"
            ariaLabel="Top strip rates link color"
            options={ratesToneOptions}
            value={String(settings.ratesButtonTone || 'mango')}
            onChange={(nextValue) => onSettingChange?.('ratesButtonTone', nextValue)}
          />
        </div>
      </section>
    </div>
  );
}
