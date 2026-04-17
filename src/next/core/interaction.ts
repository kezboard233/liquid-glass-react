// Stub - will be overwritten by sibling PR (Unit 4) on merge.

export interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

export function createPointerTracker(
  _target: HTMLElement,
  _onMove: (state: PointerState) => void,
): () => void {
  return () => {};
}

export function computeElasticOffset(
  pointer: { x: number; y: number },
  center: { x: number; y: number },
  elasticity: number,
): { x: number; y: number } {
  return {
    x: (pointer.x - center.x) * elasticity,
    y: (pointer.y - center.y) * elasticity,
  };
}
