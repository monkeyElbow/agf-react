import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BackgroundLightsEditor from './BackgroundLightsEditor';

describe('BackgroundLightsEditor', () => {
  it('creates a saved first light and exposes the square placement control', () => {
    const onChange = vi.fn();
    render(<BackgroundLightsEditor value="" onChange={onChange} />);

    fireEvent.click(within(screen.getByRole('group', { name: 'Enable background lights' })).getByRole('button', { name: 'On' }));
    const firstSave = JSON.parse(onChange.mock.calls.at(-1)[0]);
    expect(firstSave).toMatchObject({
      enabled: true,
      clip: true,
      lights: [
        expect.objectContaining({ tone: 'blue', enabled: true, x: 22, y: 28, positionModel: 'edge-v1' }),
        expect.objectContaining({ enabled: false }),
        expect.objectContaining({ enabled: false }),
      ],
    });

    onChange.mockClear();
    const { rerender } = render(<BackgroundLightsEditor value={JSON.stringify(firstSave)} onChange={onChange} />);
    fireEvent.keyDown(screen.getByLabelText('Light 1 position'), { key: 'ArrowRight' });
    const movedSave = JSON.parse(onChange.mock.calls.at(-1)[0]);
    expect(movedSave.lights[0].x).toBe(23);
    rerender(<BackgroundLightsEditor value={JSON.stringify(movedSave)} onChange={onChange} />);
    expect(screen.getByLabelText('Light 1 position').getAttribute('aria-valuetext')).toContain('23% from left');
  });

  it('maps square pointer coordinates to responsive edge percentages', () => {
    const onChange = vi.fn();
    const { container } = render(
      <BackgroundLightsEditor
        value={JSON.stringify({
          enabled: true,
          lights: [{ tone: 'blue', x: 50, y: 50 }],
        })}
        onChange={onChange}
      />,
    );
    const map = container.querySelector('.admin-background-light-position-map');
    Object.defineProperty(map, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 10, top: 20, width: 200, height: 200 }),
    });

    fireEvent.pointerDown(map, { clientX: 160, clientY: 70, pointerId: 1 });
    const movedSave = JSON.parse(onChange.mock.calls.at(-1)[0]);
    expect(movedSave.lights[0]).toMatchObject({ x: 100, y: 0, positionModel: 'edge-v1' });
  });

  it('keeps three light cards stable and only puts enabled lights on the shared map', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <BackgroundLightsEditor
        value={JSON.stringify({ enabled: true, lights: [{ tone: 'blue' }] })}
        onChange={onChange}
      />,
    );

    expect(container.querySelectorAll('.admin-background-light-card')).toHaveLength(3);
    expect(container.querySelectorAll('.admin-background-light-position-knob')).toHaveLength(1);
    expect(container.querySelector('.admin-background-light-card:nth-of-type(2)')?.className).toContain('is-disabled');
    expect(container.querySelector('.admin-background-light-card:nth-of-type(3)')?.className).toContain('is-disabled');

    fireEvent.click(within(screen.getByRole('group', { name: 'Enable Light 2' })).getByRole('button', { name: 'On' }));
    const saved = JSON.parse(onChange.mock.calls.at(-1)[0]);
    expect(saved.lights).toHaveLength(3);
    expect(saved.lights[1]).toMatchObject({ enabled: true });

    rerender(<BackgroundLightsEditor value={JSON.stringify(saved)} onChange={onChange} />);
    expect(container.querySelectorAll('.admin-background-light-position-knob')).toHaveLength(2);
  });

  it('colors position knobs from each light tone and allows off-canvas placement', () => {
    const onChange = vi.fn();
    const { container } = render(
      <BackgroundLightsEditor
        value={JSON.stringify({
          enabled: true,
          lights: [
            { positionModel: 'edge-v1', tone: 'mango', x: -25, y: 125 },
            { positionModel: 'edge-v1', tone: 'melon', enabled: true, x: 50, y: 50 },
          ],
        })}
        onChange={onChange}
      />,
    );

    const knobs = container.querySelectorAll('.admin-background-light-position-knob');
    expect(knobs).toHaveLength(2);
    expect(knobs[0].style.getPropertyValue('--admin-background-light-knob-color')).toBe('#faa31a');
    expect(knobs[1].style.getPropertyValue('--admin-background-light-knob-color')).toBe('#f48f7a');
    fireEvent.keyDown(knobs[0], { key: 'ArrowLeft', shiftKey: true });
    const saved = JSON.parse(onChange.mock.calls.at(-1)[0]);
    expect(saved.lights[0]).toMatchObject({ x: -30, y: 125, positionModel: 'edge-v1' });
  });

  it('exposes scroll motion modes and only shows mode-specific controls', () => {
    const onChange = vi.fn();
    const firstSave = {
      enabled: true,
      clip: true,
      lights: [{ tone: 'blue', strength: 42, x: -28, y: -22, size: 82, motion: true }],
    };
    const { rerender } = render(<BackgroundLightsEditor value={JSON.stringify(firstSave)} onChange={onChange} />);

    expect(screen.getByLabelText('Light 1 motion style').value).toBe('ambient');
    fireEvent.change(screen.getByLabelText('Light 1 motion style'), { target: { value: 'directional' } });
    const directionalSave = JSON.parse(onChange.mock.calls.at(-1)[0]);
    expect(directionalSave.lights[0]).toMatchObject({ motion: true, motionMode: 'directional' });

    rerender(<BackgroundLightsEditor value={JSON.stringify(directionalSave)} onChange={onChange} />);
    expect(screen.getByLabelText('Scroll X travel')).not.toBeNull();
    expect(screen.getByLabelText('Scroll Y travel')).not.toBeNull();
    expect(screen.getByLabelText('Scroll response')).not.toBeNull();
  });
});
