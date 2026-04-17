export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

const DEFAULT_ACTIVATION_ZONE = 200;
// Matches v1: translate pull is (deltaFromCenter) * elasticity * 0.1 * fade.
const ELASTIC_PULL_SCALE = 0.1;
// Rim brightness multiplier when the glass sits over a light background.
const OVER_LIGHT_BOOST = 1.5;

function clamp(value: number, min: number, max: number): number {
  if (min > max) return 0;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Positive when outside, 0 on the edge, negative when inside
 * (magnitude = distance to the closest edge from inside).
 */
export function distanceToRectEdge(mouse: Point, rect: Rect): number {
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  const edgeDistanceX = Math.abs(mouse.x - (rect.x + halfW)) - halfW;
  const edgeDistanceY = Math.abs(mouse.y - (rect.y + halfH)) - halfH;

  if (edgeDistanceX > 0 || edgeDistanceY > 0) {
    const ox = Math.max(0, edgeDistanceX);
    const oy = Math.max(0, edgeDistanceY);
    return Math.sqrt(ox * ox + oy * oy);
  }

  // Inside: signed distance to the closest edge.
  return Math.max(edgeDistanceX, edgeDistanceY);
}

/**
 * Normalize an absolute mouse position to `[-1, 1]` relative to a rect's
 * center. Values beyond the rect's extent pass through (not clamped).
 * A zero-sized axis degenerates to 0 to avoid division by zero.
 */
export function normalizedMousePos(mouse: Point, rect: Rect): Point {
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  return {
    x: halfW > 0 ? (mouse.x - (rect.x + halfW)) / halfW : 0,
    y: halfH > 0 ? (mouse.y - (rect.y + halfH)) / halfH : 0,
  };
}

/**
 * Clamp a translation offset so the translated rect stays fully within
 * the outer bounds. If the rect is larger than the bounds on an axis, the
 * offset is clamped to 0 on that axis (no valid movement).
 */
export function clampMouseOffset(offset: Point, rect: Rect, bounds: Rect): Point {
  const minDx = bounds.x - rect.x;
  const maxDx = bounds.x + bounds.width - (rect.x + rect.width);
  const minDy = bounds.y - rect.y;
  const maxDy = bounds.y + bounds.height - (rect.y + rect.height);
  return {
    x: clamp(offset.x, minDx, maxDx),
    y: clamp(offset.y, minDy, maxDy),
  };
}

/**
 * Elastic pull toward the mouse when it's within `activationZone` px of the
 * rect's edge. Mirrors v1:
 *
 *     fade = 1 - edgeDistance / activationZone   // 0 when outside
 *     tx   = (mouse.x - centerX) * elasticity * 0.1 * fade
 *     ty   = (mouse.y - centerY) * elasticity * 0.1 * fade
 *
 * When the mouse sits inside the rect, edgeDistance clamps to 0 so fade = 1.
 */
export function computeElasticTranslate(
  mouse: Point,
  rect: Rect,
  elasticity: number,
  activationZone: number = DEFAULT_ACTIVATION_ZONE,
): { tx: number; ty: number } {
  if (elasticity === 0 || activationZone <= 0) {
    return { tx: 0, ty: 0 };
  }

  const edgeDistance = Math.max(0, distanceToRectEdge(mouse, rect));
  if (edgeDistance > activationZone) {
    return { tx: 0, ty: 0 };
  }

  const fadeInFactor = 1 - edgeDistance / activationZone;
  const scale = elasticity * ELASTIC_PULL_SCALE * fadeInFactor;
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  return {
    tx: (mouse.x - cx) * scale,
    ty: (mouse.y - cy) * scale,
  };
}

/**
 * Highlight anchor in rect-local [0..1] coordinates plus intensity 0..1.
 * The anchor is the closest point on the rect to the mouse; intensity fades
 * with the activation-zone distance. `overLight` boosts intensity when the
 * glass sits over a bright background, clamped to 1.
 */
export function computeEdgeHighlight(
  mouse: Point,
  rect: Rect,
  overLight: boolean,
): { cx: number; cy: number; intensity: number } {
  const hasWidth = rect.width > 0;
  const hasHeight = rect.height > 0;

  const closestX = hasWidth ? clamp(mouse.x, rect.x, rect.x + rect.width) : rect.x;
  const closestY = hasHeight ? clamp(mouse.y, rect.y, rect.y + rect.height) : rect.y;

  const dx = mouse.x - closestX;
  const dy = mouse.y - closestY;
  const outsideDistance = Math.sqrt(dx * dx + dy * dy);

  const cx = hasWidth ? (closestX - rect.x) / rect.width : 0;
  const cy = hasHeight ? (closestY - rect.y) / rect.height : 0;

  let intensity = 0;
  if (outsideDistance <= DEFAULT_ACTIVATION_ZONE) {
    intensity = 1 - outsideDistance / DEFAULT_ACTIVATION_ZONE;
  }
  if (overLight) {
    intensity = Math.min(1, intensity * OVER_LIGHT_BOOST);
  }

  return { cx, cy, intensity };
}
