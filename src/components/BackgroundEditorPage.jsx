import BackgroundLightsEditor from './BackgroundLightsEditor';
import { SURFACE_BG_TONE_OPTIONS, normalizeSurfaceBgTone } from '../lib/colorSystem';

/**
 * Canonical background surface editor. Every block gets this fixed page so
 * the surface color and optional light layers are edited together and
 * persisted through the block's normal settings patch. Block-specific
 * controls belong in the caller's other editor pages; the optional palette
 * data only describes valid surface tones for that block.
 */
export default function BackgroundEditorPage({
  backgroundTone,
  backgroundToneOptions = SURFACE_BG_TONE_OPTIONS,
  // Kept for backwards-compatible callers. The universal page owns this label.
  backgroundToneLabel: _backgroundToneLabel = 'Background color',
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
      backgroundToneLabel="Background color"
      onBackgroundToneChange={onBackgroundToneChange}
      className={className}
    />
  );
}
