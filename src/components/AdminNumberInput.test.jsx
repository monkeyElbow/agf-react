import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminNumberInput from './AdminNumberInput';

void AdminNumberInput;

describe('AdminNumberInput', () => {
  it('accepts decimal values that start with a dot without clobbering the edit', () => {
    const onChange = vi.fn();

    render(
      <AdminNumberInput
        aria-label="Line spacing"
        value={1.04}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('Line spacing');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '.9' } });

    expect(input.value).toBe('.9');
    expect(onChange).toHaveBeenCalledWith(0.9);
  });

  it('prevents repeated arrow-step key events from continuing to increment the value', () => {
    const onChange = vi.fn();

    render(
      <AdminNumberInput
        aria-label="Headline size"
        value={7}
        step="0.1"
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('Headline size');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    const repeatedArrowEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      repeat: true,
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(repeatedArrowEvent, 'preventDefault');

    input.dispatchEvent(repeatedArrowEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(7.1);
  });

  it('drops focus on wheel so scroll gestures do not keep stepping the field', () => {
    render(
      <AdminNumberInput
        aria-label="Headline tracking"
        value={0}
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Headline tracking');
    input.focus();
    fireEvent.wheel(input);

    expect(document.activeElement).not.toBe(input);
  });

  it('keeps typed decimal edits stable on blur instead of clamping them down unexpectedly', async () => {
    const onChange = vi.fn();

    render(
      <AdminNumberInput
        aria-label="Hero line height"
        min="0.72"
        max="1.2"
        step="0.01"
        value={0.9}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('Hero line height');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '.9' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(input.value).toBe('0.9');
    });
    expect(onChange).toHaveBeenLastCalledWith(0.9);
  });
});
