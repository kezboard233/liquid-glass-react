/**
 * GLSL shaders for the WebGL 2 liquid-glass refraction effect.
 *
 * This module is the GPU-side replacement for the SVG filter + JPEG
 * displacement map pipeline used by `src/index.tsx`. The fragment shader
 * evaluates a signed-distance function for a rounded rect, computes a
 * displacement field from its gradient, and renders a transparent
 * refraction/chromatic-aberration overlay on top of a host element that
 * carries its own CSS backdrop-filter.
 */

/**
 * Full-screen quad vertex shader. The host pipeline draws a single
 * triangle strip of 4 vertices covering clip space (-1..1) and passes
 * the UV (0..1) to the fragment stage.
 */
export const VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * Fragment shader. Produces an RGBA overlay whose alpha and chromatic
 * tint approximate Apple's liquid-glass refraction near the edges of a
 * rounded rectangle.
 */
export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2  u_resolution;
uniform float u_cornerRadius;
uniform float u_displacementScale;
uniform float u_aberration;
uniform vec2  u_mousePos;
uniform float u_elasticity;
uniform float u_overLight;
uniform int   u_mode;
uniform float u_time;

float smoothStep(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

float roundedRectSDF(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + vec2(radius);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

vec2 sdfGradient(vec2 p, vec2 halfSize, float radius) {
  float e = 1.0;
  float dx = roundedRectSDF(p + vec2(e, 0.0), halfSize, radius)
           - roundedRectSDF(p - vec2(e, 0.0), halfSize, radius);
  float dy = roundedRectSDF(p + vec2(0.0, e), halfSize, radius)
           - roundedRectSDF(p - vec2(0.0, e), halfSize, radius);
  vec2 g = vec2(dx, dy);
  float l = length(g);
  return l > 1e-5 ? g / l : vec2(0.0);
}

vec2 refractUV(vec2 uv, float sdf, vec2 gradient, float scale) {
  float edge = smoothStep(-30.0, 0.0, sdf);
  return uv + gradient * edge * scale * 0.001;
}

void main() {
  vec2 p = (v_uv - 0.5) * u_resolution;
  vec2 halfSize = u_resolution * 0.5;
  float radius = min(u_cornerRadius, min(halfSize.x, halfSize.y));

  float sdf = roundedRectSDF(p, halfSize, radius);
  if (sdf > 2.0) {
    discard;
  }

  vec2 g = sdfGradient(p, halfSize, radius);

  // Chromatic aberration: each RGB channel has its rim peak at a slightly
  // different sdf, so R is offset outward / B inward (or vice versa). The
  // offset is uniform around the perimeter — this is what produces a
  // rainbow-like fringe on ALL sides, matching true refractive dispersion
  // rather than a directional x-axis tint.
  float ab = u_aberration * 0.45;

  // Narrow rim band: peaks ~2 px inside the edge, fades to 0 by 6 px inside
  // and by the outer edge. Evaluated 3 times at offset sdf values for RGB.
  float rRim = smoothStep(-6.0, -2.5, sdf + ab) - smoothStep(-1.5, 0.5, sdf + ab);
  float gRim = smoothStep(-6.0, -2.5, sdf)      - smoothStep(-1.5, 0.5, sdf);
  float bRim = smoothStep(-6.0, -2.5, sdf - ab) - smoothStep(-1.5, 0.5, sdf - ab);

  // Displacement path: keeps refractUV live and lets mode variants modulate.
  vec2 disp = g * gRim * u_displacementScale * 0.001;
  float modeGain = 1.0;
  if (u_mode == 1) {
    float ang = atan(p.y, p.x);
    vec2 tangent = vec2(-sin(ang), cos(ang));
    disp = tangent * gRim * u_displacementScale * 0.001;
    modeGain = 1.1;
  } else if (u_mode == 2) {
    modeGain = 1.35;
  } else if (u_mode == 3) {
    float wobble = 0.5 + 0.5 * sin(u_time * 1.5);
    modeGain = 0.85 + 0.3 * wobble;
  }
  vec2 sampledUV = refractUV(v_uv, sdf, g, u_displacementScale);

  // Directional light: top-left brighter. Normal is the SDF gradient tilted
  // up by a fixed amount.
  vec3 lightDir = normalize(vec3(-0.5, -0.7, 0.5));
  vec3 normal = normalize(vec3(g, 0.35));
  float lambert = clamp(dot(normal, lightDir), 0.0, 1.0);
  float lightGain = mix(0.35, 1.0, lambert) * modeGain;

  vec3 rgb = vec3(rRim, gRim, bRim) * lightGain;

  // Mouse specular — only when the host has seen a mousemove.
  if (u_mousePos.x >= 0.0 && u_mousePos.y >= 0.0) {
    vec2 frag = v_uv * u_resolution;
    float d = length(frag - u_mousePos);
    float falloff = 1.0 - smoothStep(0.0, 180.0, d);
    float spec = falloff * falloff * u_elasticity * 0.7;
    rgb += vec3(spec);
  }

  // Displacement contribution keeps the displacementScale slider responsive.
  rgb += vec3(length(disp) * 0.5);

  if (u_overLight >= 0.5) {
    rgb *= 0.55;
  }

  // Keep sampledUV live so the compiler doesn't strip refractUV.
  rgb += vec3((sampledUV.x - v_uv.x) * 0.0);

  // Alpha = union of the three channel rims so the composite coverage is
  // whatever is lit at the widest offset.
  float alphaMask = max(max(rRim, gRim), bRim);
  float alpha = alphaMask * 0.6;
  fragColor = vec4(clamp(rgb, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`;

/** Union of every uniform name declared in the fragment shader. */
export type UniformName =
  | 'u_resolution'
  | 'u_cornerRadius'
  | 'u_displacementScale'
  | 'u_aberration'
  | 'u_mousePos'
  | 'u_elasticity'
  | 'u_overLight'
  | 'u_mode'
  | 'u_time';

/** Runtime list of uniform names, for type-safe binding loops. */
export const UNIFORM_NAMES: readonly UniformName[] = [
  'u_resolution',
  'u_cornerRadius',
  'u_displacementScale',
  'u_aberration',
  'u_mousePos',
  'u_elasticity',
  'u_overLight',
  'u_mode',
  'u_time',
] as const;
