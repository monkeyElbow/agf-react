import { useRef, useState } from 'react';
import ColorPalette from './ColorPalette';
import {
  BACKGROUND_LIGHT_TONE_OPTIONS,
  MAX_BACKGROUND_LIGHTS,
  createDefaultBackgroundLight,
  normalizeBackgroundEffects,
  serializeBackgroundEffects,
} from '../lib/backgroundEffects';

const POSITION_MIN = -50;
const POSITION_MAX = 150;

function clampPosition(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.min(POSITION_MAX, Math.max(POSITION_MIN, numeric));
}

function positionToMapPercent(value) {
  return ((clampPosition(value) - POSITION_MIN) / (POSITION_MAX - POSITION_MIN)) * 100;
}

function BackgroundLightSlider({ label, value, min, max, suffix = '', onChange, disabled = false }) {
  return (
    <label className="admin-background-light-slider">
      <span>{label} <strong>{value}{suffix}</strong></span>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </label>
  );
}

function BackgroundLightPositionControl({ lights, onChange }) {
  const trackRef = useRef(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const activeLights = lights
    .map((light, index) => ({ light, index }))
    .filter(({ light }) => light.enabled !== false);
  const selectedActiveIndex = activeLights.some(({ index }) => index === selectedIndex)
    ? selectedIndex
    : (activeLights[0]?.index ?? null);

  const updateFromPointer = (event, index = selectedActiveIndex) => {
    const track = trackRef.current;
    if (!track || index == null) {
      return;
    }
    const rect = track.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    onChange(
      index,
      clampPosition(POSITION_MIN + ((event.clientX - rect.left) / rect.width) * (POSITION_MAX - POSITION_MIN)),
      clampPosition(POSITION_MIN + ((event.clientY - rect.top) / rect.height) * (POSITION_MAX - POSITION_MIN)),
    );
  };

  const handlePointerDown = (event, index = selectedActiveIndex) => {
    if (index == null) {
      return;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setSelectedIndex(index);
    setDraggingIndex(index);
    updateFromPointer(event, index);
  };

  const handlePointerUp = (event) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDraggingIndex(null);
  };

  const handleKeyDown = (event, index, light) => {
    const step = event.shiftKey ? 5 : 1;
    let nextX = light.x;
    let nextY = light.y;
    if (event.key === 'ArrowLeft') nextX -= step;
    if (event.key === 'ArrowRight') nextX += step;
    if (event.key === 'ArrowUp') nextY -= step;
    if (event.key === 'ArrowDown') nextY += step;
    if (nextX !== light.x || nextY !== light.y) {
      event.preventDefault();
      setSelectedIndex(index);
      onChange(index, clampPosition(nextX), clampPosition(nextY));
    }
  };

  return (
    <div className="admin-background-light-position-control">
      {!activeLights.length ? (
        <div className="admin-background-light-position-label">
          <strong>Turn on a light to place it</strong>
        </div>
      ) : null}
      <div
        ref={trackRef}
        className={`admin-background-light-position-map${draggingIndex != null ? ' is-dragging' : ''}`}
        onPointerDown={(event) => handlePointerDown(event)}
        onPointerMove={draggingIndex != null ? (event) => updateFromPointer(event, draggingIndex) : undefined}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="presentation"
      >
        <span className="admin-background-light-position-bounds" aria-hidden="true" />
        <span className="admin-background-light-position-guide is-horizontal" />
        <span className="admin-background-light-position-guide is-vertical" />
        {activeLights.map(({ light, index }) => {
          const tone = BACKGROUND_LIGHT_TONE_OPTIONS.find((option) => option.value === light.tone);
          return (
            <button
              key={light.id}
              type="button"
              className={`admin-background-light-position-knob${selectedActiveIndex === index ? ' is-selected' : ''}`}
              style={{
                left: `${positionToMapPercent(light.x)}%`,
                top: `${positionToMapPercent(light.y)}%`,
                '--admin-background-light-knob-color': tone?.swatch || '#00adbb',
              }}
              aria-label={`Light ${index + 1} position`}
              aria-valuetext={`${Math.round(light.x)}% from left, ${Math.round(light.y)}% from top`}
              onPointerDown={(event) => {
                event.stopPropagation();
                handlePointerDown(event, index);
              }}
              onPointerMove={draggingIndex === index ? (event) => updateFromPointer(event, index) : undefined}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={(event) => handleKeyDown(event, index, light)}
            >
              <span className="admin-background-light-position-knob-label">{index + 1}</span>
            </button>
          );
        })}
      </div>
      <small>Block edges are the inner square. Place light centers beyond them for a softer edge glow.</small>
    </div>
  );
}

const MOTION_MODE_OPTIONS = [
  { value: 'ambient', label: 'Ambient float' },
  { value: 'directional', label: 'Scroll directional' },
  { value: 'drift', label: 'Scroll drift' },
];

function buildEditorLights(effects) {
  return Array.from({ length: MAX_BACKGROUND_LIGHTS }, (_item, index) => (
    effects.lights[index] || { ...createDefaultBackgroundLight(index), enabled: false }
  ));
}

export default function BackgroundLightsEditor({
  value,
  onChange,
  paletteVariant = 'hud',
  backgroundTone = 'white',
  backgroundToneOptions = [],
  backgroundToneLabel = 'Background color',
  onBackgroundToneChange,
  className = '',
}) {
  const effects = normalizeBackgroundEffects(value);
  const editorLights = buildEditorLights(effects);
  const toneOptions = Array.isArray(backgroundToneOptions) && backgroundToneOptions.length
    ? backgroundToneOptions
    : [];
  const commit = (nextEffects) => onChange?.(serializeBackgroundEffects(nextEffects));
  const updateLight = (index, patch) => {
    const lights = editorLights.map((light) => ({ ...light }));
    lights[index] = { ...lights[index], ...patch };
    commit({ ...effects, enabled: true, lights });
  };
  const toggleEnabled = (enabled) => {
    const lights = editorLights.map((light) => ({ ...light }));
    if (enabled && !effects.lights.length) {
      lights[0] = { ...createDefaultBackgroundLight(0), enabled: true };
    }
    commit({ ...effects, enabled, lights });
  };

  return (
    <section className={`admin-background-editor-page${className ? ` ${className}` : ''}`} aria-label="Background">
      <div className="admin-background-editor-page__layout">
        <div className="admin-background-editor-page__left">
          <div className="admin-background-editor-page__surface">
            <strong>Background color</strong>
            {toneOptions.length ? (
              <ColorPalette
                variant={paletteVariant}
                className="is-compact is-icon-only admin-background-editor-page__swatches"
                ariaLabel={backgroundToneLabel}
                options={toneOptions}
                value={backgroundTone}
                showLabels={false}
                preventMouseDown
                onChange={(nextValue) => onBackgroundToneChange?.(nextValue)}
                getOptionClassName={(option, state) => `admin-bg-swatch-option${state.active ? ' is-active' : ''}`}
              />
            ) : null}
          </div>

          {effects.enabled ? (
            <BackgroundLightPositionControl lights={editorLights} onChange={(index, x, y) => updateLight(index, { x, y })} />
          ) : null}
        </div>

        <div className="admin-background-editor-page__right">
          <div className="admin-background-editor-page__controls">
            <div className="admin-background-editor-page__setting">
              <strong>Background lights</strong>
              <div className="admin-boolean-pill" role="group" aria-label="Enable background lights">
                <button type="button" className={`admin-boolean-pill-option${!effects.enabled ? ' is-active' : ''}`} onClick={() => toggleEnabled(false)}>Off</button>
                <button type="button" className={`admin-boolean-pill-option${effects.enabled ? ' is-active' : ''}`} onClick={() => toggleEnabled(true)}>On</button>
              </div>
            </div>

            {effects.enabled ? (
              <div className="admin-background-editor-page__setting">
                <strong>Crop lights to block</strong>
                <div className="admin-boolean-pill" role="group" aria-label="Crop lights to block">
                  <button type="button" className={`admin-boolean-pill-option${!effects.clip ? ' is-active' : ''}`} onClick={() => commit({ ...effects, clip: false })}>Off</button>
                  <button type="button" className={`admin-boolean-pill-option${effects.clip ? ' is-active' : ''}`} onClick={() => commit({ ...effects, clip: true })}>On</button>
                </div>
              </div>
            ) : null}
          </div>

          {editorLights.map((light, index) => {
            const enabled = light.enabled !== false;
            return (
              <fieldset key={light.id} className={`admin-background-light-card${enabled ? '' : ' is-disabled'}`}>
                <legend>Light {index + 1}</legend>
                <div className="admin-background-light-card-topline">
                  <ColorPalette
                    variant={paletteVariant}
                    className="is-compact is-icon-only admin-background-light-color-palette"
                    ariaLabel={`Light ${index + 1} color`}
                    options={BACKGROUND_LIGHT_TONE_OPTIONS}
                    value={light.tone}
                    showLabels={false}
                    onChange={(tone) => updateLight(index, { tone })}
                  />
                  <div className="admin-background-light-card-toggle" role="group" aria-label={`Enable Light ${index + 1}`}>
                    <button type="button" className={`admin-boolean-pill-option${!enabled ? ' is-active' : ''}`} onClick={() => updateLight(index, { enabled: false })}>Off</button>
                    <button type="button" className={`admin-boolean-pill-option${enabled ? ' is-active' : ''}`} onClick={() => updateLight(index, { enabled: true })}>On</button>
                  </div>
                  <div className="admin-background-light-motion-toggle">
                    <button
                      type="button"
                      className={`admin-boolean-pill-option${light.motion ? ' is-active' : ''}`}
                      disabled={!enabled}
                      onClick={() => updateLight(index, { motion: !light.motion })}
                    >
                      Motion
                    </button>
                    <select
                      value={light.motionMode}
                      disabled={!enabled || !light.motion}
                      onChange={(event) => updateLight(index, { motionMode: event.target.value })}
                      aria-label={`Light ${index + 1} motion style`}
                    >
                      {MOTION_MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`admin-background-light-slider-grid admin-background-light-control-grid${light.motion ? ` is-motion-${light.motionMode}` : ''}`}>
                  {light.motion && light.motionMode === 'directional' ? (
                    <>
                      <BackgroundLightSlider label="Scroll X travel" value={light.motionX} min={-100} max={100} suffix="%" disabled={!enabled} onChange={(motionX) => updateLight(index, { motionX })} />
                      <BackgroundLightSlider label="Scroll Y travel" value={light.motionY} min={-100} max={100} suffix="%" disabled={!enabled} onChange={(motionY) => updateLight(index, { motionY })} />
                      <BackgroundLightSlider label="Scroll response" value={light.motionSpeed} min={25} max={200} suffix="%" disabled={!enabled} onChange={(motionSpeed) => updateLight(index, { motionSpeed })} />
                    </>
                  ) : null}
                  {light.motion && light.motionMode === 'drift' ? (
                    <>
                      <BackgroundLightSlider label="Drift distance" value={light.motionDistance} min={0} max={100} suffix="%" disabled={!enabled} onChange={(motionDistance) => updateLight(index, { motionDistance })} />
                      <BackgroundLightSlider label="Drift speed" value={light.motionSpeed} min={25} max={200} suffix="%" disabled={!enabled} onChange={(motionSpeed) => updateLight(index, { motionSpeed })} />
                    </>
                  ) : null}
                  <BackgroundLightSlider label="Size" value={light.size} min={20} max={220} suffix="%" disabled={!enabled} onChange={(size) => updateLight(index, { size })} />
                  <BackgroundLightSlider label="Strength" value={light.strength} min={0} max={100} suffix="%" disabled={!enabled} onChange={(strength) => updateLight(index, { strength })} />
                </div>
              </fieldset>
            );
          })}
        </div>
      </div>
    </section>
  );
}
