import { describe, expect, it } from "vitest";
import {
  clampMouseOffset,
  computeEdgeHighlight,
  computeElasticTranslate,
  distanceToRectEdge,
  normalizedMousePos,
  type Rect,
} from "./interaction";

const rect = (x: number, y: number, w: number, h: number): Rect => ({
  x,
  y,
  width: w,
  height: h,
});

// A 100x100 rect centered at (100, 100).
const centerRect = rect(50, 50, 100, 100);

describe("distanceToRectEdge", () => {
  it("returns 0 on the edge", () => {
    expect(distanceToRectEdge({ x: 150, y: 100 }, centerRect)).toBe(0);
  });

  it("returns positive distance when outside", () => {
    expect(distanceToRectEdge({ x: 200, y: 100 }, centerRect)).toBe(50);
  });

  it("returns diagonal distance when outside a corner", () => {
    // mouse 30 px right of right-edge (150) and 40 px below bottom-edge (150)
    const d = distanceToRectEdge({ x: 180, y: 190 }, centerRect);
    expect(d).toBeCloseTo(50, 6); // sqrt(30^2 + 40^2)
  });

  it("returns negative distance when inside", () => {
    // At center => closest edge is 50 px away, signed as -50.
    expect(distanceToRectEdge({ x: 100, y: 100 }, centerRect)).toBe(-50);
  });
});

describe("normalizedMousePos", () => {
  it("returns (0,0) at the center", () => {
    expect(normalizedMousePos({ x: 100, y: 100 }, centerRect)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("returns (1,1) at bottom-right corner", () => {
    expect(normalizedMousePos({ x: 150, y: 150 }, centerRect)).toEqual({
      x: 1,
      y: 1,
    });
  });

  it("returns (-1,-1) at top-left corner", () => {
    expect(normalizedMousePos({ x: 50, y: 50 }, centerRect)).toEqual({
      x: -1,
      y: -1,
    });
  });

  it("returns 0 on zero-sized axes", () => {
    expect(normalizedMousePos({ x: 999, y: 999 }, rect(0, 0, 0, 0))).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe("clampMouseOffset", () => {
  const bounds = rect(0, 0, 400, 400);

  it("passes through offsets that keep rect inside", () => {
    expect(clampMouseOffset({ x: 10, y: 20 }, centerRect, bounds)).toEqual({
      x: 10,
      y: 20,
    });
  });

  it("clamps offset that would push rect past right edge", () => {
    // rect.x = 50, rect.right = 150. Max dx so rect stays in bounds = 250.
    expect(
      clampMouseOffset({ x: 9999, y: 0 }, centerRect, bounds),
    ).toEqual({ x: 250, y: 0 });
  });

  it("clamps offset that would push rect past top-left corner", () => {
    expect(
      clampMouseOffset({ x: -9999, y: -9999 }, centerRect, bounds),
    ).toEqual({ x: -50, y: -50 });
  });

  it("collapses to 0 on axes where rect is larger than bounds", () => {
    const tooBig = rect(-100, -100, 800, 800);
    expect(clampMouseOffset({ x: 10, y: 10 }, tooBig, bounds)).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe("computeElasticTranslate", () => {
  it("returns zero when mouse is at center with nonzero elasticity", () => {
    expect(computeElasticTranslate({ x: 100, y: 100 }, centerRect, 0.5)).toEqual({
      tx: 0,
      ty: 0,
    });
  });

  it("returns nonzero pull when mouse is 50px outside right edge", () => {
    // edgeDistance = 50, activationZone = 200 -> fade = 0.75
    // tx = (200 - 100) * 1 * 0.1 * 0.75 = 7.5
    const result = computeElasticTranslate({ x: 200, y: 100 }, centerRect, 1);
    expect(result.tx).toBeCloseTo(7.5, 6);
    expect(result.ty).toBe(0);
  });

  it("returns zero when mouse is 500px outside rect", () => {
    expect(computeElasticTranslate({ x: 700, y: 100 }, centerRect, 1)).toEqual({
      tx: 0,
      ty: 0,
    });
  });

  it("returns diagonal pull when mouse is outside a corner", () => {
    // Mouse at (180, 190): 30 past right edge, 40 past bottom edge.
    // edgeDistance = 50 -> fade = 0.75.
    // delta from center (100,100) = (80, 90).
    // tx = 80 * 1 * 0.1 * 0.75 = 6
    // ty = 90 * 1 * 0.1 * 0.75 = 6.75
    const result = computeElasticTranslate({ x: 180, y: 190 }, centerRect, 1);
    expect(result.tx).toBeCloseTo(6, 6);
    expect(result.ty).toBeCloseTo(6.75, 6);
  });

  it("returns (0,0) when elasticity is 0", () => {
    expect(computeElasticTranslate({ x: 200, y: 200 }, centerRect, 0)).toEqual({
      tx: 0,
      ty: 0,
    });
  });

  it("scales linearly with elasticity", () => {
    const low = computeElasticTranslate({ x: 200, y: 100 }, centerRect, 0.5);
    const high = computeElasticTranslate({ x: 200, y: 100 }, centerRect, 1);
    expect(high.tx).toBeCloseTo(low.tx * 2, 6);
    expect(high.ty).toBeCloseTo(low.ty * 2, 6);
  });

  it("reaches full fade when mouse is inside the rect", () => {
    // Inside -> edgeDistance clamped to 0, fade = 1.
    // Mouse (130, 100), center (100, 100) -> tx = 30 * 1 * 0.1 * 1 = 3
    const result = computeElasticTranslate({ x: 130, y: 100 }, centerRect, 1);
    expect(result.tx).toBeCloseTo(3, 6);
    expect(result.ty).toBe(0);
  });

  it("respects a custom activationZone", () => {
    // edgeDistance = 50, activationZone = 100 -> fade = 0.5
    // tx = (200 - 100) * 1 * 0.1 * 0.5 = 5
    const result = computeElasticTranslate(
      { x: 200, y: 100 },
      centerRect,
      1,
      100,
    );
    expect(result.tx).toBeCloseTo(5, 6);
  });

  it("returns (0,0) when the mouse is exactly at the activationZone boundary", () => {
    // edgeDistance == activationZone -> fade = 0 (strict > check preserves no effect)
    const result = computeElasticTranslate(
      { x: 350, y: 100 },
      centerRect,
      1,
    );
    expect(result.tx).toBe(0);
    expect(result.ty).toBe(0);
  });
});

describe("computeEdgeHighlight", () => {
  it("anchors to the closest edge when mouse is outside", () => {
    // Mouse (200, 100) -> closest point on rect = (150, 100).
    // Normalized: cx = (150-50)/100 = 1, cy = (100-50)/100 = 0.5
    // outsideDistance = 50, intensity = 1 - 50/200 = 0.75
    const res = computeEdgeHighlight({ x: 200, y: 100 }, centerRect, false);
    expect(res.cx).toBeCloseTo(1, 6);
    expect(res.cy).toBeCloseTo(0.5, 6);
    expect(res.intensity).toBeCloseTo(0.75, 6);
  });

  it("returns full intensity when mouse is inside rect", () => {
    const res = computeEdgeHighlight({ x: 100, y: 100 }, centerRect, false);
    expect(res.intensity).toBe(1);
    expect(res.cx).toBeCloseTo(0.5, 6);
    expect(res.cy).toBeCloseTo(0.5, 6);
  });

  it("returns zero intensity when far outside activation zone", () => {
    const res = computeEdgeHighlight({ x: 500, y: 100 }, centerRect, false);
    expect(res.intensity).toBe(0);
  });

  it("overLight boosts and clamps intensity", () => {
    // Normal intensity 0.75 * 1.5 = 1.125 -> clamped to 1.
    const boosted = computeEdgeHighlight({ x: 200, y: 100 }, centerRect, true);
    expect(boosted.intensity).toBe(1);
    // Zero stays zero.
    const outside = computeEdgeHighlight({ x: 500, y: 100 }, centerRect, true);
    expect(outside.intensity).toBe(0);
  });
});
