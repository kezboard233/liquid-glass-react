/**
 * Canvas-based displacement map generator for "shader" mode. The three
 * non-shader modes use pre-baked JPEGs; this path generates a map at runtime
 * from a procedural SDF so the displacement adapts to element dimensions.
 *
 * Adapted from the original v1 implementation (shader-utils.ts).
 */

export interface Vec2 {
  x: number;
  y: number;
}

function smoothStep(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return clamped * clamped * (3 - 2 * clamped);
}

function hypot(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function roundedRectSDF(x: number, y: number, w: number, h: number, r: number): number {
  const qx = Math.abs(x) - w + r;
  const qy = Math.abs(y) - h + r;
  return Math.min(Math.max(qx, qy), 0) + hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

function liquidGlassFragment(uv: Vec2): Vec2 {
  const ix = uv.x - 0.5;
  const iy = uv.y - 0.5;
  const distanceToEdge = roundedRectSDF(ix, iy, 0.3, 0.2, 0.6);
  const displacement = smoothStep(0.8, 0, distanceToEdge - 0.15);
  const scaled = smoothStep(0, 1, displacement);
  return { x: ix * scaled + 0.5, y: iy * scaled + 0.5 };
}

export function generateShaderDisplacementMap(width: number, height: number): string | null {
  if (width <= 0 || height <= 0 || typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;

  const raw = new Float32Array(w * h * 2);
  let maxScale = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = liquidGlassFragment({ x: x / w, y: y / h });
      const dx = pos.x * w - x;
      const dy = pos.y * h - y;
      const idx = (y * w + x) * 2;
      raw[idx] = dx;
      raw[idx + 1] = dy;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDx > maxScale) maxScale = absDx;
      if (absDy > maxScale) maxScale = absDy;
    }
  }
  if (maxScale < 1) maxScale = 1;

  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const rawIdx = (y * w + x) * 2;
      const edgeDistance = Math.min(x, y, w - x - 1, h - y - 1);
      const edgeFactor = Math.min(1, edgeDistance / 2);
      const dx = (raw[rawIdx] ?? 0) * edgeFactor;
      const dy = (raw[rawIdx + 1] ?? 0) * edgeFactor;
      const r = dx / maxScale + 0.5;
      const g = dy / maxScale + 0.5;
      const pixelIdx = (y * w + x) * 4;
      data[pixelIdx] = Math.max(0, Math.min(255, r * 255));
      data[pixelIdx + 1] = Math.max(0, Math.min(255, g * 255));
      data[pixelIdx + 2] = Math.max(0, Math.min(255, g * 255));
      data[pixelIdx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}
