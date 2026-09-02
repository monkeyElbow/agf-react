import { useMemo, useState } from 'react';
import ColorPalette from './ColorPalette';
import BackgroundEditorPage from './BackgroundEditorPage';
import useBufferedFieldDrafts from '../hooks/useBufferedFieldDrafts';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';

const TOP_STRIP_EDITOR_SECTIONS = Object.freeze([
  { id: 'strip', label: 'Strip', icon: 'Aa' },
  { id: 'login', label: 'Secure Login', icon: '↗' },
  { id: 'rates', label: 'Phone + Rates', icon: '#' },
]);

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
  sourceRevision = 0,
  textOptions = [],
  loginToneOptions = [],
  ratesToneOptions = [],
  blockOptions = null,
  bgOptions = [],
  showBackgroundPage = false,
  backgroundEffectsJson = '',
  onBackgroundEffectsChange,
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
  const [activeSection, setActiveSection] = useState('strip');
  const stringDraftFields = useMemo(() => (
    ['loginLabel', 'loginHref', 'phone', 'ratesLabel', 'ratesPath'].map((id) => ({
      id,
      value: settings[id],
      commit: onSettingChange ? (nextValue) => onSettingChange(id, nextValue) : null,
    }))
  ), [onSettingChange, settings.loginHref, settings.loginLabel, settings.phone, settings.ratesLabel, settings.ratesPath]);
  const {
    draftValues,
    updateDraftValue,
    commitDraftValue,
  } = useBufferedFieldDrafts({ fields: stringDraftFields, sourceRevision });
  const editorSections = appendHudBlockOptionsSection(TOP_STRIP_EDITOR_SECTIONS, blockOptions);

  return (
    <HudEditorModelLayout
      className="admin-top-strip-hud-editor admin-top-strip-hud-editor--reference"
      sections={editorSections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      label="Top strip editor sections"
      panelClassName="admin-top-strip-hud-editor-panels"
    >
      <section className="admin-top-strip-hud-card admin-top-strip-hud-card--strip">
        <div className="admin-top-strip-hud-card-head">
          <h4>Strip</h4>
          <p>Global appearance</p>
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

      {showBackgroundPage ? (
        <section className="admin-top-strip-hud-card admin-top-strip-hud-card--background">
          <BackgroundEditorPage
            backgroundTone={settings.bgTone}
            backgroundToneOptions={bgOptions}
            backgroundToneLabel="Top strip background color"
            onBackgroundToneChange={(nextValue) => onSettingChange?.('bgTone', nextValue)}
            backgroundEffectsJson={backgroundEffectsJson}
            onBackgroundEffectsChange={onBackgroundEffectsChange}
            paletteVariant="hud"
          />
        </section>
      ) : null}

      <section className="admin-top-strip-hud-card admin-top-strip-hud-card--login">
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
            value={draftValues.loginLabel ?? String(settings.loginLabel || '')}
            onChange={(event) => updateDraftValue('loginLabel', event.target.value)}
            onBlur={() => commitDraftValue('loginLabel')}
          />
        </label>
        <label className="admin-front-hud-field">
          <span>Login URL</span>
          <input
            type="text"
            value={draftValues.loginHref ?? String(settings.loginHref || '')}
            onChange={(event) => updateDraftValue('loginHref', event.target.value)}
            onBlur={() => commitDraftValue('loginHref')}
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

      <section className="admin-top-strip-hud-card admin-top-strip-hud-card--rates">
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
            value={draftValues.phone ?? String(settings.phone || '')}
            onChange={(event) => updateDraftValue('phone', event.target.value)}
            onBlur={() => commitDraftValue('phone')}
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
            value={draftValues.ratesLabel ?? String(settings.ratesLabel || '')}
            onChange={(event) => updateDraftValue('ratesLabel', event.target.value)}
            onBlur={() => commitDraftValue('ratesLabel')}
          />
        </label>
        <label className="admin-front-hud-field">
          <span>Rates URL / Path</span>
          <input
            type="text"
            value={draftValues.ratesPath ?? String(settings.ratesPath || '')}
            onChange={(event) => updateDraftValue('ratesPath', event.target.value)}
            onBlur={() => commitDraftValue('ratesPath')}
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

      <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
    </HudEditorModelLayout>
  );
}
