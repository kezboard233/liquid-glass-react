/**
 * Temporary mock of the `next` <LiquidGlass> React adapter. Unit 5 will land
 * the real implementation at `src/next/react/LiquidGlass.tsx`; until then this
 * mock mirrors the v1 props contract so the integration tests can be written
 * and run against the eventual public surface.
 */
import * as React from "react";

export interface LiquidGlassProps {
  children?: React.ReactNode;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  className?: string;
  padding?: string;
  style?: React.CSSProperties;
  overLight?: boolean;
  onClick?: () => void;
  mode?: "standard" | "polar" | "prominent" | "shader";
}

export default function LiquidGlass({
  children,
  cornerRadius = 999,
  className = "",
  padding,
  style,
  onClick,
  // Props below are accepted so the test's "update() called when props change"
  // scenario has something to diff against; they are not rendered into DOM.
  displacementScale,
  blurAmount,
  saturation,
  aberrationIntensity,
  elasticity,
  overLight,
  mode,
}: LiquidGlassProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const updateCountRef = React.useRef(0);

  React.useEffect(() => {
    // Exercise the WebGL-acquisition path so the "falls back silently when
    // WebGL is unavailable" test is meaningful; the real renderer lives in Unit 4.
    try {
      canvasRef.current?.getContext("webgl2");
    } catch {
      /* swallowed — matches the documented fallback contract */
    }
  }, []);

  React.useEffect(() => {
    updateCountRef.current += 1;
  }, [displacementScale, blurAmount, saturation, aberrationIntensity, elasticity, overLight, mode]);

  const hostStyle: React.CSSProperties = {
    borderRadius: `${cornerRadius}px`,
    padding,
    position: "relative",
    ...style,
  };

  return (
    <div
      className={className}
      style={hostStyle}
      onClick={onClick}
      data-testid="liquid-glass-host"
      data-update-count={updateCountRef.current}
    >
      <canvas
        ref={canvasRef}
        data-testid="liquid-glass-canvas"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
      {children}
    </div>
  );
}
