/**
 * LiquidGlassRenderer — WebGL 2 rendering core (Unit 3).
 *
 * Attaches a transparent overlay canvas to a host element and renders the
 * liquid-glass refraction/aberration shader on top of a CSS-backed blur
 * (see ./backdrop.ts for the hybrid strategy).
 */

import { applyBackdrop } from "./backdrop";
import { FRAGMENT_SHADER, UNIFORM_NAMES, VERTEX_SHADER, type UniformName } from "./shaders";
import type { LiquidGlassMode, LiquidGlassOptions } from "./types";

interface ResolvedOptions {
  displacementScale: number;
  blurAmount: number;
  saturation: number;
  aberrationIntensity: number;
  elasticity: number;
  cornerRadius: number;
  overLight: boolean;
  mode: LiquidGlassMode;
  mousePos: { x: number; y: number } | null;
  padding: string;
}

const DEFAULTS: ResolvedOptions = {
  displacementScale: 70,
  blurAmount: 0.0625,
  saturation: 140,
  aberrationIntensity: 2,
  elasticity: 0.15,
  cornerRadius: 999,
  overLight: false,
  mode: "standard",
  mousePos: null,
  padding: "24px 32px",
};

const MODE_INDEX: Record<LiquidGlassMode, number> = {
  standard: 0,
  polar: 1,
  prominent: 2,
  shader: 3,
};

// Full-screen quad in clip space (TRIANGLE_STRIP order).
const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

function resolve(partial?: Partial<LiquidGlassOptions>): ResolvedOptions {
  if (!partial) return { ...DEFAULTS };
  return {
    displacementScale: partial.displacementScale ?? DEFAULTS.displacementScale,
    blurAmount: partial.blurAmount ?? DEFAULTS.blurAmount,
    saturation: partial.saturation ?? DEFAULTS.saturation,
    aberrationIntensity: partial.aberrationIntensity ?? DEFAULTS.aberrationIntensity,
    elasticity: partial.elasticity ?? DEFAULTS.elasticity,
    cornerRadius: partial.cornerRadius ?? DEFAULTS.cornerRadius,
    overLight: partial.overLight ?? DEFAULTS.overLight,
    mode: partial.mode ?? DEFAULTS.mode,
    mousePos: partial.mousePos ?? DEFAULTS.mousePos,
    padding: partial.padding ?? DEFAULTS.padding,
  };
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown";
    gl.deleteShader(shader);
    throw new Error("Shader compile error: " + log);
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "unknown";
    gl.deleteProgram(program);
    throw new Error("Program link error: " + log);
  }
  return program;
}

export class LiquidGlassRenderer {
  private readonly host: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext | null;

  private options: ResolvedOptions;

  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private uniforms: Partial<Record<UniformName, WebGLUniformLocation | null>> = {};

  private rafId: number | null = null;
  private startTime = 0;
  private resizeObserver: ResizeObserver | null = null;
  private disposed = false;
  private contextLost = false;
  private readonly priorPosition: string;
  private readonly priorPadding: string;
  private readonly priorBackdropFilter: string;
  private readonly priorWebkitBackdropFilter: string;

  private readonly onContextLost = (e: Event): void => {
    e.preventDefault();
    this.contextLost = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  private readonly onContextRestored = (): void => {
    this.contextLost = false;
    try {
      this.initGlResources();
      this.resize();
      this.startLoop();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[liquid-glass] failed to restore WebGL context:", err);
    }
  };

  constructor(host: HTMLElement, options?: Partial<LiquidGlassOptions>) {
    this.host = host;
    this.options = resolve(options);

    // Ensure the host is a positioned containing block for the absolute canvas.
    const computed = typeof getComputedStyle === "function" ? getComputedStyle(host) : null;
    this.priorPosition = host.style.position;
    this.priorPadding = host.style.padding;
    this.priorBackdropFilter = host.style.backdropFilter;
    this.priorWebkitBackdropFilter = (host.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter ?? "";
    if (computed && computed.position === "static") {
      host.style.position = "relative";
    }

    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border-radius:inherit;";
    host.appendChild(this.canvas);

    this.gl = this.canvas.getContext("webgl2", {
      premultipliedAlpha: true,
      alpha: true,
      antialias: true,
    }) as WebGL2RenderingContext | null;

    if (!this.gl) {
      // eslint-disable-next-line no-console
      console.warn("[liquid-glass] WebGL 2 is not available; renderer is a no-op.");
      return;
    }

    this.canvas.addEventListener("webglcontextlost", this.onContextLost, false);
    this.canvas.addEventListener("webglcontextrestored", this.onContextRestored, false);

    try {
      this.initGlResources();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[liquid-glass] renderer init failed:", err);
      return;
    }

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(host);
    }
    this.resize();

    // Apply CSS padding and initial backdrop.
    host.style.padding = this.options.padding;
    applyBackdrop(host, {
      blurAmount: this.options.blurAmount,
      saturation: this.options.saturation,
      overLight: this.options.overLight,
    });

    this.startTime = performance.now();
    this.startLoop();
  }

  update(options: Partial<LiquidGlassOptions>): void {
    if (this.disposed) return;
    this.options = resolve({ ...this.options, ...options });

    // Keep CSS bits in lockstep with options changes.
    this.host.style.padding = this.options.padding;
    applyBackdrop(this.host, {
      blurAmount: this.options.blurAmount,
      saturation: this.options.saturation,
      overLight: this.options.overLight,
    });
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);

    const gl = this.gl;
    if (gl) {
      if (this.program) gl.deleteProgram(this.program);
      if (this.vbo) gl.deleteBuffer(this.vbo);
      if (this.vao) gl.deleteVertexArray(this.vao);
    }
    this.program = null;
    this.vbo = null;
    this.vao = null;
    this.uniforms = {};

    if (this.canvas.parentNode === this.host) {
      this.host.removeChild(this.canvas);
    }

    this.host.style.position = this.priorPosition;
    this.host.style.padding = this.priorPadding;
    this.host.style.backdropFilter = this.priorBackdropFilter;
    (this.host.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = this.priorWebkitBackdropFilter;
  }

  // --- internal ---------------------------------------------------------

  private initGlResources(): void {
    const gl = this.gl;
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = linkProgram(gl, vs, fs);
    // Shaders can be deleted after linking; the program retains them.
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = program;

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (!vao || !vbo) throw new Error("Failed to allocate VAO/VBO");
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    if (posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    }
    gl.bindVertexArray(null);
    this.vao = vao;
    this.vbo = vbo;

    this.uniforms = {};
    for (const name of UNIFORM_NAMES) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  private resize(): void {
    const gl = this.gl;
    if (!gl) return;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const cssW = Math.max(1, this.host.clientWidth);
    const cssH = Math.max(1, this.host.clientHeight);
    const w = Math.max(1, Math.floor(cssW * dpr));
    const h = Math.max(1, Math.floor(cssH * dpr));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  private startLoop(): void {
    const frame = (): void => {
      if (this.disposed || this.contextLost) return;
      this.draw();
      this.rafId = requestAnimationFrame(frame);
    };
    this.rafId = requestAnimationFrame(frame);
  }

  private draw(): void {
    const gl = this.gl;
    if (!gl || !this.program || !this.vao) return;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const u = this.uniforms;
    const { options } = this;
    const cssW = this.host.clientWidth || 1;

    if (u.u_resolution) gl.uniform2f(u.u_resolution, this.canvas.width, this.canvas.height);
    if (u.u_time) gl.uniform1f(u.u_time, (performance.now() - this.startTime) / 1000);
    if (u.u_mousePos) {
      const dpr = this.canvas.width / cssW;
      const mx = options.mousePos ? options.mousePos.x * dpr : -1;
      const my = options.mousePos ? options.mousePos.y * dpr : -1;
      gl.uniform2f(u.u_mousePos, mx, my);
    }
    if (u.u_displacementScale) gl.uniform1f(u.u_displacementScale, options.displacementScale);
    if (u.u_aberration) gl.uniform1f(u.u_aberration, options.aberrationIntensity);
    if (u.u_elasticity) gl.uniform1f(u.u_elasticity, options.elasticity);
    if (u.u_cornerRadius) gl.uniform1f(u.u_cornerRadius, options.cornerRadius);
    if (u.u_overLight) gl.uniform1f(u.u_overLight, options.overLight ? 1 : 0);
    if (u.u_mode) gl.uniform1i(u.u_mode, MODE_INDEX[options.mode]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }
}
