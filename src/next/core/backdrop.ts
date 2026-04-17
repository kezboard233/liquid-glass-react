/**
 * CSS backdrop-filter helper (Unit 3 hybrid backdrop strategy).
 *
 * CSS handles the blur + saturate portion of the effect; the WebGL canvas
 * on top (transparent) handles refraction, chromatic aberration, and
 * highlights. Keeping blur in CSS avoids the cost of an offscreen
 * framebuffer copy of the backdrop for every frame.
 */

export interface BackdropOptions {
  blurAmount: number;
  saturation: number;
  overLight: boolean;
}

export function applyBackdrop(host: HTMLElement, opts: BackdropOptions): void {
  const base = opts.overLight ? 12 : 4;
  const blurPx = base + opts.blurAmount * 32;
  const value = "blur(" + blurPx + "px) saturate(" + opts.saturation + "%)";
  host.style.backdropFilter = value;
  // Safari still requires the vendor-prefixed property.
  (host.style as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter = value;
}
