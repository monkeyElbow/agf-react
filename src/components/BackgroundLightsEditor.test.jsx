import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BackgroundLightsEditor from './BackgroundLightsEditor';

describe('BackgroundLightsEditor', () => {
  it('creates a saved first light and exposes independent placement controls', () => {
    const onChange = vi.fn();
    render(<BackgroundLightsEditor value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'On' }));
    const firstSave = JSON.parse(onChange.mock.calls.at(-1)[0]);
    expect(firstSave).toMatchObject({
      enabled: true,
      clip: true,
      lights: [expect.objectContaining({ tone: 'blue', x: -28, y: -22 })],
    });

    onChange.mockClear();
    render(<BackgroundLightsEditor value={JSON.stringify(firstSave)} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Horizontal offset'), { target: { value: '44' } });
    const movedSave = JSON.parse(onChange.mock.calls.at(-1)[0]);
    expect(movedSave.lights[0].x).toBe(44);
  });
});
