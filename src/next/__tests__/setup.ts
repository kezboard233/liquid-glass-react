/**
 * Vitest setup for the `next` (v2) architecture tests.
 *
 * happy-dom has no WebGL, so `getContext('webgl2')` returns `null`. We patch
 * it to return a Proxy-based mock whose every property is a no-op `vi.fn()`,
 * with a handful of specific return values for the calls that the renderer
 * branches on (shader/program creation, compile status, info-logs).
 */
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// Methods whose return value the renderer inspects. Anything not listed here
// is served by the Proxy fallback as a no-op vi.fn().
const WEBGL2_OVERRIDES: Record<string, () => unknown> = {
  createShader: () => ({}),
  createProgram: () => ({}),
  createBuffer: () => ({}),
  createTexture: () => ({}),
  createFramebuffer: () => ({}),
  createVertexArray: () => ({}),
  getUniformLocation: () => ({}),
  getShaderParameter: () => true,
  getProgramParameter: () => true,
  getExtension: () => null,
  getParameter: () => 0,
  getShaderInfoLog: () => "",
  getProgramInfoLog: () => "",
};

function createWebGL2Mock(): unknown {
  const base: Record<string, unknown> = {
    canvas: null,
    drawingBufferWidth: 300,
    drawingBufferHeight: 150,
  };
  for (const [name, impl] of Object.entries(WEBGL2_OVERRIDES)) {
    base[name] = vi.fn(impl);
  }
  return new Proxy(base, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      const fn = vi.fn();
      target[prop] = fn;
      return fn;
    },
  });
}

const originalGetContext = HTMLCanvasElement.prototype.getContext;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLCanvasElement.prototype as any).getContext = function patchedGetContext(
  contextId: string,
  ...rest: unknown[]
) {
  if (contextId === "webgl2" || contextId === "webgl" || contextId === "experimental-webgl") {
    return createWebGL2Mock();
  }
  return (originalGetContext as (...a: unknown[]) => unknown).call(
    this,
    contextId,
    ...rest,
  );
};
