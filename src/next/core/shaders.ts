/**
 * Minimal shader stub pending Unit 2.
 *
 * This module exists only so the renderer (Unit 3) can compile and run in
 * isolation. The fragment shader paints a near-transparent black rectangle
 * and intentionally references every uniform in UNIFORM_NAMES so they link
 * without being optimized out — allowing tests to verify uniform location
 * lookups end-to-end. Unit 2's real shader will replace this file on merge.
 */

export const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_displacementScale;
uniform float u_aberrationIntensity;
uniform float u_elasticity;
uniform float u_cornerRadius;
uniform float u_overLight;
uniform int   u_mode;

void main() {
  // Touch every uniform so none are optimized out of the linked program.
  float keep =
      u_resolution.x * 0.0
    + u_time * 0.0
    + u_mouse.x * 0.0
    + u_displacementScale * 0.0
    + u_aberrationIntensity * 0.0
    + u_elasticity * 0.0
    + u_cornerRadius * 0.0
    + u_overLight * 0.0
    + float(u_mode) * 0.0;

  outColor = vec4(0.0, 0.0, 0.0, 0.1 + keep);
}`;

/**
 * Names of every uniform the renderer should cache locations for.
 * Must stay in sync with whatever Unit 2 ships; the stub above declares
 * each one so linker validation on a fresh worktree succeeds.
 */
export const UNIFORM_NAMES = [
  "u_resolution",
  "u_time",
  "u_mouse",
  "u_displacementScale",
  "u_aberrationIntensity",
  "u_elasticity",
  "u_cornerRadius",
  "u_overLight",
  "u_mode",
] as const;

export type UniformName = (typeof UNIFORM_NAMES)[number];
