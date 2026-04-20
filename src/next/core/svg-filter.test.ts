import { describe, expect, it } from "vitest";
import { buildFilter, buildFilterPrimitives, replaceFilterPrimitives } from "./svg-filter";

const BASE = {
  id: "lg-test",
  mode: "standard" as const,
  displacementScale: 70,
  aberrationIntensity: 2,
  shaderMapUrl: null,
};

describe("svg-filter", () => {
  it("builds a filter with the v1 bounding box and correlating id", () => {
    const filter = buildFilter(BASE);
    expect(filter.getAttribute("id")).toBe("lg-test");
    expect(filter.getAttribute("x")).toBe("-35%");
    expect(filter.getAttribute("y")).toBe("-35%");
    expect(filter.getAttribute("width")).toBe("170%");
    expect(filter.getAttribute("height")).toBe("170%");
  });

  it("emits three feDisplacementMap primitives — one per RGB channel", () => {
    const nodes = buildFilterPrimitives(BASE);
    const disp = nodes.filter((n) => n.tagName === "feDisplacementMap");
    expect(disp).toHaveLength(3);
  });

  it("scales each channel's feDisplacementMap differently for chromatic aberration", () => {
    const nodes = buildFilterPrimitives({ ...BASE, aberrationIntensity: 4 });
    const disp = nodes.filter((n) => n.tagName === "feDisplacementMap");
    const scales = disp.map((n) => Number(n.getAttribute("scale")));
    // All three scales must be distinct so the per-channel samples differ.
    expect(new Set(scales).size).toBe(3);
  });

  it("uses the shader map URL when mode === 'shader' and a URL is provided", () => {
    const nodes = buildFilterPrimitives({
      ...BASE,
      mode: "shader",
      shaderMapUrl: "data:image/png;base64,AAA=",
    });
    const feImage = nodes.find((n) => n.tagName === "feImage");
    expect(feImage?.getAttribute("href")).toBe("data:image/png;base64,AAA=");
  });

  it("flips displacement sign for non-shader modes (matches v1 pipeline)", () => {
    const standard = buildFilterPrimitives(BASE);
    const shader = buildFilterPrimitives({
      ...BASE,
      mode: "shader",
      shaderMapUrl: "data:image/png;base64,AAA=",
    });
    const stdRed = Number(
      standard.find((n) => n.getAttribute("result") === "RED_DISPLACED")?.getAttribute("scale"),
    );
    const shdRed = Number(
      shader.find((n) => n.getAttribute("result") === "RED_DISPLACED")?.getAttribute("scale"),
    );
    expect(Math.sign(stdRed)).toBe(-1);
    expect(Math.sign(shdRed)).toBe(1);
  });

  it("replaceFilterPrimitives swaps children without recreating the filter", () => {
    const filter = buildFilter(BASE);
    const before = filter.children.length;
    replaceFilterPrimitives(filter, { ...BASE, mode: "polar" });
    expect(filter.children.length).toBe(before);
  });
});
