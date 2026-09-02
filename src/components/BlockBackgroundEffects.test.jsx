import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BlockBackgroundEffects from './BlockBackgroundEffects';

describe('BlockBackgroundEffects', () => {
  it('renders every enabled light as a non-interactive background layer', () => {
    const { container } = render(
      <BlockBackgroundEffects
        effects={{
          enabled: true,
          clip: false,
          lights: [
            { id: 'blue', tone: 'blue', strength: 44, x: -30, y: 20, size: 80, motion: true },
            { id: 'mango', tone: 'mango', strength: 22, x: 45, y: -10, size: 52, motion: true, motionMode: 'directional' },
          ],
        }}
      />,
    );

    const root = container.querySelector('.block-background-effects');
    expect(root?.className).toContain('is-uncropped');
    expect(root?.getAttribute('aria-hidden')).toBe('true');
    expect(root?.querySelectorAll('.block-background-light')).toHaveLength(2);
    expect(root?.querySelector('.block-background-light')?.className).toContain('is-animated');
    expect(root?.querySelectorAll('.is-scroll-directional')).toHaveLength(1);
  });

  it('does not render a layer while the saved effect is off', () => {
    const { container } = render(<BlockBackgroundEffects effects="" />);
    expect(container.innerHTML).toBe('');
  });

  it('filters disabled light slots while preserving enabled layers', () => {
    const { container } = render(
      <BlockBackgroundEffects
        effects={{
          enabled: true,
          lights: [
            { id: 'blue', tone: 'blue', enabled: true },
            { id: 'mango', tone: 'mango', enabled: false },
            { id: 'melon', tone: 'melon', enabled: true },
          ],
        }}
      />,
    );

    expect(container.querySelectorAll('.block-background-light')).toHaveLength(2);
    expect(container.querySelector('.block-background-light')?.getAttribute('style')).toContain('--block-background-light-rgb: 0, 173, 187');
    expect(container.querySelectorAll('.block-background-light')[1]?.getAttribute('style')).toContain('--block-background-light-rgb: 244, 143, 122');
  });
});
