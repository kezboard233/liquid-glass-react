/**
 * LiquidGlassRenderer — SVG filter chain renderer.
 *
 * Attaches two children to the host element:
 *   1. A transparent <span> "warp layer" filled to host bounds. This span
 *      gets both `backdrop-filter: blur(...) saturate(...)` AND
 *      `filter: url(#...)`. The backdrop-filter pulls the background pixels
 *      onto the span; the SVG filter then runs as post-processing, so its
 *      SourceGraphic is the blurred backdrop — which means feDisplacementMap
 *      genuinely warps the backdrop pixels (real refraction).
 *   2. A hidden inline <svg><defs><filter>…</filter></defs></svg> carrying
 *      the filter primitives. Defs-only SVGs don't contribute to layout.
 */

import { applyBackdrop } from "./backdrop";
import { generateShaderDisplacementMap } from "./displacement-map";
import { buildFilter, replaceFilterPrimitives, type FilterOptions } from "./svg-filter";
import type { LiquidGlassMode, LiquidGlassOptions, MousePosition } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

interface ResolvedOptions {
  displacementScale: number;
  blurAmount: number;
  saturation: number;
  aberrationIntensity: number;
  elasticity: number;
  cornerRadius: number;
  mode: LiquidGlassMode;
  overLight: boolean;
  mousePos: MousePosition | null;
  padding: string;
}

const DEFAULTS: ResolvedOptions = {
  displacementScale: 70,
  blurAmount: 0.0625,
  saturation: 140,
  aberrationIntensity: 2,
  elasticity: 0.15,
  cornerRadius: 999,
  mode: "standard",
  overLight: false,
  mousePos: null,
  padding: "24px 32px",
};

function resolve(partial?: Partial<LiquidGlassOptions>): ResolvedOptions {
  return {
    ...DEFAULTS,
    ...(partial ?? {}),
    mousePos: partial?.mousePos ?? null,
  } as ResolvedOptions;
}

let ID_COUNTER = 0;

function isFirefox(): boolean {
  if (typeof navigator === "undefined") return false;
  return /firefox/i.test(navigator.userAgent);
}

export class LiquidGlassRenderer {
  private readonly host: HTMLElement;
  private options: ResolvedOptions;

  private readonly warpLayer: HTMLSpanElement;
  private readonly svg: SVGSVGElement;
  private readonly filter: SVGFilterElement;
  private readonly filterId: string;

  private shaderMapUrl: string | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private disposed = false;

  private readonly priorPosition: string;
  private readonly priorPadding: string;

  constructor(host: HTMLElement, options?: Partial<LiquidGlassOptions>) {
    this.host = host;
    this.options = resolve(options);
    this.filterId = "liquid-glass-filter-" + ++ID_COUNTER;

    const computed = typeof getComputedStyle === "function" ? getComputedStyle(host) : null;
    this.priorPosition = host.style.position;
    this.priorPadding = host.style.padding;
    if (computed && computed.position === "static") {
      host.style.position = "relative";
    }
    host.style.padding = this.options.padding;

    // Filter-definition SVG: defs-only, zero size, out of layout.
    this.svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    this.svg.setAttribute("aria-hidden", "true");
    this.svg.style.cssText =
      "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";
    const defs = document.createElementNS(SVG_NS, "defs");
    this.filter = buildFilter(this.buildFilterOptions());
    defs.appendChild(this.filter);
    this.svg.appendChild(defs);

    // Warp layer: absolute fill, inherits border-radius, carries both filters.
    this.warpLayer = document.createElement("span");
    this.warpLayer.setAttribute("aria-hidden", "true");
    this.warpLayer.style.cssText =
      "position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:0;";

    host.appendChild(this.svg);
    host.appendChild(this.warpLayer);

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.refreshShaderMap());
      this.resizeObserver.observe(host);
    }

    this.refreshShaderMap();
    this.applyStyles();
  }

  update(options: Partial<LiquidGlassOptions>): void {
    if (this.disposed) return;
    const prevMode = this.options.mode;
    this.options = resolve({ ...this.options, ...options });
    if (this.options.padding !== undefined) {
      this.host.style.padding = this.options.padding;
    }
    if (this.options.mode !== prevMode) {
      this.refreshShaderMap();
    }
    replaceFilterPrimitives(this.filter, this.buildFilterOptions());
    this.applyStyles();
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.svg.parentNode === this.host) this.host.removeChild(this.svg);
    if (this.warpLayer.parentNode === this.host) this.host.removeChild(this.warpLayer);

    this.host.style.position = this.priorPosition;
    this.host.style.padding = this.priorPadding;
  }

  private buildFilterOptions(): FilterOptions {
    return {
      id: this.filterId,
      mode: this.options.mode,
      displacementScale: this.options.displacementScale,
      aberrationIntensity: this.options.aberrationIntensity,
      shaderMapUrl: this.shaderMapUrl,
    };
  }

  private refreshShaderMap(): void {
    if (this.options.mode !== "shader") {
      this.shaderMapUrl = null;
      return;
    }
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (w <= 0 || h <= 0) return;
    const url = generateShaderDisplacementMap(w, h);
    if (url !== this.shaderMapUrl) {
      this.shaderMapUrl = url;
      replaceFilterPrimitives(this.filter, this.buildFilterOptions());
    }
  }

  private applyStyles(): void {
    const o = this.options;
    applyBackdrop(this.warpLayer, {
      blurAmount: o.blurAmount,
      saturation: o.saturation,
      overLight: o.overLight,
    });
    // Firefox has only partial support for feDisplacementMap chained with
    // backdrop-filter; fall back to the blur-only look there.
    if (!isFirefox()) {
      this.warpLayer.style.filter = "url(#" + this.filterId + ")";
    }
  }
}
