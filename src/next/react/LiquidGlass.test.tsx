import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import LiquidGlass from './LiquidGlass';

describe('LiquidGlass', () => {
  it('renders children', () => {
    const { getByText } = render(<LiquidGlass>hello world</LiquidGlass>);
    expect(getByText('hello world')).toBeTruthy();
  });

  it('applies onClick cursor style', () => {
    const { container } = render(
      <LiquidGlass onClick={() => {}}>click me</LiquidGlass>,
    );
    const host = container.firstChild as HTMLElement;
    expect(host.style.cursor).toBe('pointer');
  });

  it('respects cornerRadius and padding props', () => {
    const { container } = render(
      <LiquidGlass cornerRadius={12} padding="8px 16px">
        styled
      </LiquidGlass>,
    );
    const host = container.firstChild as HTMLElement;
    expect(host.style.borderRadius).toBe('12px');
    expect(host.style.padding).toBe('8px 16px');
  });
});
