import * as React from 'react';
import { LiquidGlassRenderer } from '../core/renderer';
import type { LiquidGlassMode, LiquidGlassOptions } from '../core/types';

export interface LiquidGlassProps {
  children?: React.ReactNode;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  globalMousePos?: { x: number; y: number };
  mouseOffset?: { x: number; y: number };
  mouseContainer?: React.RefObject<HTMLElement | null>;
  className?: string;
  padding?: string;
  style?: React.CSSProperties;
  overLight?: boolean;
  mode?: LiquidGlassMode;
  onClick?: () => void;
}

const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  displacementScale = 70,
  blurAmount = 0.0625,
  saturation = 140,
  aberrationIntensity = 2,
  elasticity = 0.15,
  cornerRadius = 999,
  globalMousePos,
  mouseOffset,
  mouseContainer,
  className,
  padding = '24px 32px',
  style,
  overLight = false,
  mode = 'standard',
  onClick,
}) => {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const rendererRef = React.useRef<LiquidGlassRenderer | null>(null);

  const options: Partial<LiquidGlassOptions> = {
    displacementScale,
    blurAmount,
    saturation,
    aberrationIntensity,
    elasticity,
    cornerRadius,
    padding,
    overLight,
    mode,
    mouseOffset,
    globalMousePos,
  };

  React.useEffect(() => {
    if (!hostRef.current) return;
    rendererRef.current = new LiquidGlassRenderer(hostRef.current, options);
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    rendererRef.current?.update(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    displacementScale,
    blurAmount,
    saturation,
    aberrationIntensity,
    elasticity,
    cornerRadius,
    padding,
    overLight,
    mode,
    globalMousePos?.x,
    globalMousePos?.y,
    mouseOffset?.x,
    mouseOffset?.y,
  ]);

  React.useEffect(() => {
    // globalMousePos is forwarded via the options effect; only listen when not supplied.
    if (globalMousePos) return;
    const host = hostRef.current;
    if (!host) return;

    const target: HTMLElement = mouseContainer?.current ?? host;
    const offsetX = mouseOffset?.x ?? 0;
    const offsetY = mouseOffset?.y ?? 0;
    const handleMove = (e: MouseEvent) => {
      const rect = target.getBoundingClientRect();
      rendererRef.current?.update({
        mousePos: { x: e.clientX - rect.left + offsetX, y: e.clientY - rect.top + offsetY },
      });
    };
    target.addEventListener('mousemove', handleMove);
    return () => target.removeEventListener('mousemove', handleMove);
  }, [globalMousePos, mouseOffset?.x, mouseOffset?.y, mouseContainer]);

  return (
    <div
      ref={hostRef}
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-block',
        borderRadius: cornerRadius,
        padding,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </div>
  );
};

export default LiquidGlass;
