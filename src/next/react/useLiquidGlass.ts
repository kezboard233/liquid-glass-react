import * as React from 'react';
import { LiquidGlassRenderer } from '../core/renderer';
import type { LiquidGlassOptions } from '../core/types';

export function useLiquidGlass<T extends HTMLElement = HTMLDivElement>(
  options: Partial<LiquidGlassOptions> = {},
): {
  ref: (node: T | null) => void;
  update: (opts: Partial<LiquidGlassOptions>) => void;
} {
  const rendererRef = React.useRef<LiquidGlassRenderer | null>(null);
  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  const ref = React.useCallback((node: T | null) => {
    if (rendererRef.current) {
      rendererRef.current.destroy();
      rendererRef.current = null;
    }
    if (node) {
      rendererRef.current = new LiquidGlassRenderer(node, optionsRef.current);
    }
  }, []);

  const update = React.useCallback((opts: Partial<LiquidGlassOptions>) => {
    rendererRef.current?.update(opts);
  }, []);

  return { ref, update };
}
