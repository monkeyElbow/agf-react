import ColorPalette from './ColorPalette';
import {
  BACKGROUND_LIGHT_TONE_OPTIONS,
  MAX_BACKGROUND_LIGHTS,
  createDefaultBackgroundLight,
  normalizeBackgroundEffects,
  serializeBackgroundEffects,
} from '../lib/backgroundEffects';

function BackgroundLightSlider({ label, value, min, max, suffix = '', onChange }) {
  return (
    <label className="admin-background-light-slider">
      <span>{label} <strong>{value}{suffix}</strong></span>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </label>
  );
}

export default function BackgroundLightsEditor({ value, onChange, paletteVariant = 'hud' }) {
  const effects = normalizeBackgroundEffects(value);
  const commit = (nextEffects) => onChange?.(serializeBackgroundEffects(nextEffects));
  const updateLight = (index, patch) => {
    const lights = effects.lights.map((light, lightIndex) => (
      lightIndex === index ? { ...light, ...patch } : light
    ));
    commit({ ...effects, enabled: true, lights });
  };
  const toggleEnabled = (enabled) => {
    commit({
      ...effects,
      enabled,
      lights: effects.lights.length ? effects.lights : [createDefaultBackgroundLight()],
    });
  };

  return (
    <section className="admin-background-lights-editor" aria-label="Background lights">
      <div className="admin-background-lights-heading">
        <div>
          <strong>Background lights</strong>
          <span>Layered glow behind this block’s content.</span>
        </div>
        <div className="admin-boolean-pill" role="group" aria-label="Enable background lights">
          <button type="button" className={`admin-boolean-pill-option${effects.enabled ? ' is-active' : ''}`} onClick={() => toggleEnabled(true)}>On</button>
          <button type="button" className={`admin-boolean-pill-option${!effects.enabled ? ' is-active' : ''}`} onClick={() => toggleEnabled(false)}>Off</button>
        </div>
      </div>

      {effects.enabled ? (
        <>
          <div className="admin-background-lights-options">
            <div className="admin-background-lights-clip">
              <span>Crop lights to block</span>
              <div className="admin-boolean-pill" role="group" aria-label="Crop lights to block">
                <button type="button" className={`admin-boolean-pill-option${effects.clip ? ' is-active' : ''}`} onClick={() => commit({ ...effects, clip: true })}>On</button>
                <button type="button" className={`admin-boolean-pill-option${!effects.clip ? ' is-active' : ''}`} onClick={() => commit({ ...effects, clip: false })}>Off</button>
              </div>
            </div>
            <button
              type="button"
              className="admin-background-lights-add"
              disabled={effects.lights.length >= MAX_BACKGROUND_LIGHTS}
              onClick={() => commit({ ...effects, lights: [...effects.lights, createDefaultBackgroundLight(effects.lights.length)] })}
            >
              Add light
            </button>
          </div>

          <div className="admin-background-lights-list">
            {effects.lights.map((light, index) => (
              <fieldset key={light.id} className="admin-background-light-card">
                <legend>Light {index + 1}</legend>
                <div className="admin-background-light-card-topline">
                  <ColorPalette
                    variant={paletteVariant}
                    className="is-compact is-icon-only"
                    ariaLabel={`Light ${index + 1} color`}
                    options={BACKGROUND_LIGHT_TONE_OPTIONS}
                    value={light.tone}
                    onChange={(tone) => updateLight(index, { tone })}
                  />
                  <button
                    type="button"
                    className={`admin-boolean-pill-option${light.motion ? ' is-active' : ''}`}
                    onClick={() => updateLight(index, { motion: !light.motion })}
                  >
                    Motion
                  </button>
                  {effects.lights.length > 1 ? (
                    <button
                      type="button"
                      className="admin-background-lights-remove"
                      onClick={() => commit({ ...effects, lights: effects.lights.filter((_item, lightIndex) => lightIndex !== index) })}
                      aria-label={`Remove light ${index + 1}`}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
                <div className="admin-background-light-slider-grid">
                  <BackgroundLightSlider label="Horizontal offset" value={light.x} min={-100} max={100} suffix="%" onChange={(x) => updateLight(index, { x })} />
                  <BackgroundLightSlider label="Vertical offset" value={light.y} min={-100} max={100} suffix="%" onChange={(y) => updateLight(index, { y })} />
                  <BackgroundLightSlider label="Size" value={light.size} min={20} max={220} suffix="%" onChange={(size) => updateLight(index, { size })} />
                  <BackgroundLightSlider label="Strength" value={light.strength} min={0} max={100} suffix="%" onChange={(strength) => updateLight(index, { strength })} />
                </div>
              </fieldset>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
