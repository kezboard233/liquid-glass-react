import * as React from 'react';
import { LiquidGlassRenderer } from '../core/renderer';
import type { LiquidGlassOptions } from '../core/types';

export function useLiquidGlass<T extends HTMLElement = HTMLDivElement>(
  options: Partial<LiquidGlassOptions> = {},
): {
  ref: React.RefObject<T | null>;
  update: (opts: Partial<LiquidGlassOptions>) => void;
} {
  const ref = React.useRef<T | null>(null);
  const rendererRef = React.useRef<LiquidGlassRenderer | null>(null);
  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  React.useEffect(() => {
    if (!ref.current) return;
    rendererRef.current = new LiquidGlassRenderer(ref.current, optionsRef.current);
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  const update = React.useCallback((opts: Partial<LiquidGlassOptions>) => {
    rendererRef.current?.update(opts);
  }, []);

  return { ref, update };
}
