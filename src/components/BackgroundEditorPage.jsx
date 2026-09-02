import BackgroundLightsEditor from './BackgroundLightsEditor';
import { SURFACE_BG_TONE_OPTIONS, normalizeSurfaceBgTone } from '../lib/colorSystem';

/**
 * Canonical background surface editor. Every block gets this page so the
 * surface color and optional light layers are edited together and persisted
 * through the block's normal settings patch.
 */
export default function BackgroundEditorPage({
  backgroundTone,
  backgroundToneOptions = SURFACE_BG_TONE_OPTIONS,
  backgroundToneLabel = 'Background color',
  onBackgroundToneChange,
  backgroundEffectsJson,
  onBackgroundEffectsChange,
  paletteVariant = 'admin',
  className = '',
}) {
  const options = Array.isArray(backgroundToneOptions) && backgroundToneOptions.length
    ? backgroundToneOptions
    : SURFACE_BG_TONE_OPTIONS;
  const rawTone = String(backgroundTone || '').trim().toLowerCase();
  const optionValues = options.map((option) => String(option?.value || '').trim().toLowerCase());
  const tone = optionValues.includes(rawTone) ? rawTone : normalizeSurfaceBgTone(rawTone, 'white');

  return (
    <BackgroundLightsEditor
      value={backgroundEffectsJson}
      onChange={onBackgroundEffectsChange}
      paletteVariant={paletteVariant}
      backgroundTone={tone}
      backgroundToneOptions={options}
      backgroundToneLabel={backgroundToneLabel}
      onBackgroundToneChange={onBackgroundToneChange}
      className={className}
    />
  );
}
