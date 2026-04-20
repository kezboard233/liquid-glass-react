/**
 * SVG filter construction for the liquid-glass refraction chain.
 *
 * The filter chain mirrors the v1 pipeline: load a displacement map via
 * feImage, run SourceGraphic (which carries the backdrop pixels because the
 * host span has backdrop-filter applied first) through three feDisplacementMap
 * primitives at slightly different scales per channel to produce real
 * chromatic aberration, then composite edge aberration on top of a clean
 * center.
 */

import { displacementMap, polarDisplacementMap, prominentDisplacementMap } from "../../utils";
import type { LiquidGlassMode } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

export interface FilterOptions {
  id: string;
  mode: LiquidGlassMode;
  displacementScale: number;
  aberrationIntensity: number;
  shaderMapUrl: string | null;
}

function el(name: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function getMap(mode: LiquidGlassMode, shaderMapUrl: string | null): string {
  if (mode === "shader" && shaderMapUrl) return shaderMapUrl;
  if (mode === "polar") return polarDisplacementMap;
  if (mode === "prominent") return prominentDisplacementMap;
  return displacementMap;
}

/**
 * Build the children of a <filter> element for the current options.
 * Returns an array of SVG nodes ready to be appended to the <filter>.
 */
export function buildFilterPrimitives(opts: FilterOptions): SVGElement[] {
  const { mode, displacementScale, aberrationIntensity, shaderMapUrl } = opts;
  const sign = mode === "shader" ? 1 : -1;
  const nodes: SVGElement[] = [];

  nodes.push(
    el("feImage", {
      x: 0,
      y: 0,
      width: "100%",
      height: "100%",
      result: "DISPLACEMENT_MAP",
      href: getMap(mode, shaderMapUrl),
      preserveAspectRatio: "xMidYMid slice",
    }),
  );

  const edgeIntensity = el("feColorMatrix", {
    in: "DISPLACEMENT_MAP",
    type: "matrix",
    values:
      "0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0 0 0 1 0",
    result: "EDGE_INTENSITY",
  });
  nodes.push(edgeIntensity);

  const edgeMask = el("feComponentTransfer", { in: "EDGE_INTENSITY", result: "EDGE_MASK" });
  edgeMask.appendChild(
    el("feFuncA", { type: "discrete", tableValues: `0 ${aberrationIntensity * 0.05} 1` }),
  );
  nodes.push(edgeMask);

  nodes.push(el("feOffset", { in: "SourceGraphic", dx: 0, dy: 0, result: "CENTER_ORIGINAL" }));

  // Red, Green, Blue channels — each displaced at a slightly different scale
  // so the sample offsets per channel produce true chromatic dispersion.
  nodes.push(
    el("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "DISPLACEMENT_MAP",
      scale: displacementScale * sign,
      xChannelSelector: "R",
      yChannelSelector: "B",
      result: "RED_DISPLACED",
    }),
  );
  nodes.push(
    el("feColorMatrix", {
      in: "RED_DISPLACED",
      type: "matrix",
      values: "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0",
      result: "RED_CHANNEL",
    }),
  );

  nodes.push(
    el("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "DISPLACEMENT_MAP",
      scale: displacementScale * (sign - aberrationIntensity * 0.05),
      xChannelSelector: "R",
      yChannelSelector: "B",
      result: "GREEN_DISPLACED",
    }),
  );
  nodes.push(
    el("feColorMatrix", {
      in: "GREEN_DISPLACED",
      type: "matrix",
      values: "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0",
      result: "GREEN_CHANNEL",
    }),
  );

  nodes.push(
    el("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "DISPLACEMENT_MAP",
      scale: displacementScale * (sign - aberrationIntensity * 0.1),
      xChannelSelector: "R",
      yChannelSelector: "B",
      result: "BLUE_DISPLACED",
    }),
  );
  nodes.push(
    el("feColorMatrix", {
      in: "BLUE_DISPLACED",
      type: "matrix",
      values: "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0",
      result: "BLUE_CHANNEL",
    }),
  );

  nodes.push(
    el("feBlend", { in: "GREEN_CHANNEL", in2: "BLUE_CHANNEL", mode: "screen", result: "GB_COMBINED" }),
  );
  nodes.push(
    el("feBlend", { in: "RED_CHANNEL", in2: "GB_COMBINED", mode: "screen", result: "RGB_COMBINED" }),
  );
  nodes.push(
    el("feGaussianBlur", {
      in: "RGB_COMBINED",
      stdDeviation: Math.max(0.1, 0.5 - aberrationIntensity * 0.1),
      result: "ABERRATED_BLURRED",
    }),
  );

  nodes.push(
    el("feComposite", {
      in: "ABERRATED_BLURRED",
      in2: "EDGE_MASK",
      operator: "in",
      result: "EDGE_ABERRATION",
    }),
  );

  const invertedMask = el("feComponentTransfer", { in: "EDGE_MASK", result: "INVERTED_MASK" });
  invertedMask.appendChild(el("feFuncA", { type: "table", tableValues: "1 0" }));
  nodes.push(invertedMask);

  nodes.push(
    el("feComposite", {
      in: "CENTER_ORIGINAL",
      in2: "INVERTED_MASK",
      operator: "in",
      result: "CENTER_CLEAN",
    }),
  );

  nodes.push(
    el("feComposite", { in: "EDGE_ABERRATION", in2: "CENTER_CLEAN", operator: "over" }),
  );

  return nodes;
}

/**
 * Build a full <filter> element with the standard v1 bounding box. Caller is
 * responsible for appending into an <svg><defs>…</defs></svg> tree.
 */
export function buildFilter(opts: FilterOptions): SVGFilterElement {
  const filter = el("filter", {
    id: opts.id,
    x: "-35%",
    y: "-35%",
    width: "170%",
    height: "170%",
    colorInterpolationFilters: "sRGB",
  }) as SVGFilterElement;
  for (const child of buildFilterPrimitives(opts)) filter.appendChild(child);
  return filter;
}

/** Replace the primitives inside an existing filter element in-place. */
export function replaceFilterPrimitives(filter: SVGFilterElement, opts: FilterOptions): void {
  while (filter.firstChild) filter.removeChild(filter.firstChild);
  for (const child of buildFilterPrimitives(opts)) filter.appendChild(child);
}
