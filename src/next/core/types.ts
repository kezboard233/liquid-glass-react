export type LiquidGlassMode = 'standard' | 'polar' | 'prominent' | 'shader';

export interface LiquidGlassOptions {
  displacementScale: number;
  blurAmount: number;
  saturation: number;
  aberrationIntensity: number;
  elasticity: number;
  cornerRadius: number;
  padding: string;
  overLight: boolean;
  mode: LiquidGlassMode;
  mousePos?: { x: number; y: number };
  mouseOffset?: { x: number; y: number };
  globalMousePos?: { x: number; y: number };
}
