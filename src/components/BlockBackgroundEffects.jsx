import { normalizeBackgroundEffects } from '../lib/backgroundEffects';

const LIGHT_RGB_BY_TONE = Object.freeze({
  blue: '0, 173, 187',
  mango: '250, 163, 26',
  melon: '244, 143, 122',
  sand: '196, 190, 182',
  white: '255, 255, 255',
});

export default function BlockBackgroundEffects({ effects }) {
  const config = normalizeBackgroundEffects(effects);
  if (!config.enabled) {
    return null;
  }

  return (
    <div
      className={`block-background-effects${config.clip ? ' is-clipped' : ' is-uncropped'}`}
      aria-hidden="true"
    >
      {config.lights.map((light, index) => (
        <span
          key={light.id || `background-light-${index + 1}`}
          className={`block-background-light${light.motion ? ' is-animated' : ''}`}
          style={{
            '--block-background-light-rgb': LIGHT_RGB_BY_TONE[light.tone] || LIGHT_RGB_BY_TONE.blue,
            '--block-background-light-strength': String(light.strength / 100),
            '--block-background-light-x': `${light.x}%`,
            '--block-background-light-y': `${light.y}%`,
            '--block-background-light-size': `${light.size}%`,
            '--block-background-light-delay': `${index * -2.4}s`,
          }}
        />
      ))}
    </div>
  );
}
