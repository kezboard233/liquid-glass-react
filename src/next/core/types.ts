/**
 * Shared option types for the liquid-glass WebGL 2 renderer (Unit 3).
 *
 * All fields are optional; the renderer applies v1-compatible defaults when
 * they are omitted.
 */

export type LiquidGlassMode = "standard" | "polar" | "prominent" | "shader";

export interface MousePosition {
  x: number;
  y: number;
}

export interface LiquidGlassOptions {
  /** Strength of the refraction displacement. Default: 70. */
  displacementScale?: number;
  /** Backdrop blur multiplier (0..1-ish). Default: 0.0625. */
  blurAmount?: number;
  /** Backdrop saturation in percent. Default: 140. */
  saturation?: number;
  /** Chromatic aberration intensity. Default: 2. */
  aberrationIntensity?: number;
  /** Mouse elasticity coefficient. Default: 0.15. */
  elasticity?: number;
  /** Corner radius in px (999 == pill). Default: 999. */
  cornerRadius?: number;
  /** Render mode for the refraction shader. Default: "standard". */
  mode?: LiquidGlassMode;
  /** Whether the glass is over a light background. Default: false. */
  overLight?: boolean;
  /** Current mouse position within the host (in CSS px, relative to host). */
  mousePos?: MousePosition | null;
  /** Host padding applied via CSS. Default: "24px 32px". */
  padding?: string;
}
