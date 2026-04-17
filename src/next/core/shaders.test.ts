import { describe, it, expect } from 'vitest';
import {
  VERTEX_SHADER,
  FRAGMENT_SHADER,
  UNIFORM_NAMES,
  type UniformName,
} from './shaders';

describe('GLSL shaders', () => {
  it('vertex shader targets WebGL 2 (GLSL ES 3.00)', () => {
    expect(VERTEX_SHADER).toContain('#version 300 es');
  });

  it('fragment shader targets WebGL 2 (GLSL ES 3.00)', () => {
    expect(FRAGMENT_SHADER).toContain('#version 300 es');
  });

  it('declares every UniformName as a uniform in the fragment shader', () => {
    for (const name of UNIFORM_NAMES) {
      const re = new RegExp(`uniform\\s+[\\w\\d]+\\s+${name}\\s*;`);
      expect(FRAGMENT_SHADER).toMatch(re);
    }
  });

  it('exposes the required helper functions', () => {
    expect(FRAGMENT_SHADER).toMatch(/float\s+roundedRectSDF\s*\(/);
    expect(FRAGMENT_SHADER).toMatch(/float\s+smoothStep\s*\(/);
    expect(FRAGMENT_SHADER).toMatch(/vec2\s+refractUV\s*\(/);
    expect(FRAGMENT_SHADER).toMatch(/vec2\s+sdfGradient\s*\(/);
  });

  it('does not reference SVG filter pipeline (regression guard)', () => {
    const forbidden = [
      /SVG\s*filter/i,
      /feDisplacementMap/i,
      /feGaussianBlur/i,
      /feColorMatrix/i,
      /<filter/i,
      /xlink:href/i,
    ];
    for (const pattern of forbidden) {
      expect(VERTEX_SHADER).not.toMatch(pattern);
      expect(FRAGMENT_SHADER).not.toMatch(pattern);
    }
  });

  it('UNIFORM_NAMES matches the UniformName union exactly', () => {
    const expected: ReadonlyArray<UniformName> = [
      'u_resolution',
      'u_cornerRadius',
      'u_displacementScale',
      'u_aberration',
      'u_mousePos',
      'u_elasticity',
      'u_overLight',
      'u_mode',
      'u_time',
    ];
    expect([...UNIFORM_NAMES].sort()).toEqual([...expected].sort());
    expect(UNIFORM_NAMES).toHaveLength(expected.length);
  });

  it('fragment shader contains a main() entry point that writes fragColor', () => {
    expect(FRAGMENT_SHADER).toMatch(/void\s+main\s*\(\s*\)/);
    expect(FRAGMENT_SHADER).toContain('fragColor');
  });
});
