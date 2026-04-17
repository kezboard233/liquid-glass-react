// Stub - will be overwritten by sibling PR (Unit 2) on merge.
export const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_STANDARD = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
void main() {
  outColor = vec4(v_uv, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_POLAR = FRAGMENT_SHADER_STANDARD;
export const FRAGMENT_SHADER_PROMINENT = FRAGMENT_SHADER_STANDARD;
export const FRAGMENT_SHADER_SHADER = FRAGMENT_SHADER_STANDARD;
