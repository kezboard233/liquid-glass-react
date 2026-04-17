/**
 * Integration tests for the `next` (v2) <LiquidGlass> React adapter.
 *
 * These tests render the component inside happy-dom and verify the host-level
 * React contract (children, styling, events). The underlying WebGL 2 renderer
 * is exercised via the mock installed in `setup.ts`.
 *
 * The import below prefers the real component from Unit 5 and falls back to
 * the local mock when Unit 5 has not yet landed in this worktree. This keeps
 * the test file stable across the additive rollout.
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// @ts-expect-error — Unit 5 will provide the real LiquidGlass at this path.
// Until then the local mock under __mocks__ is resolved via the rewrite below.
import LiquidGlass from "../react/LiquidGlass";

describe("next/<LiquidGlass> integration", () => {
  it("renders children", () => {
    render(
      <LiquidGlass>
        <span data-testid="child">Hello</span>
      </LiquidGlass>,
    );
    expect(screen.getByTestId("child").textContent).toBe("Hello");
  });

  it("applies cornerRadius as border-radius on the host element", () => {
    render(
      <LiquidGlass cornerRadius={42}>
        <span>content</span>
      </LiquidGlass>,
    );
    const host = screen.getByTestId("liquid-glass-host");
    expect(host.style.borderRadius).toBe("42px");
  });

  it("applies padding prop to the host div style", () => {
    render(
      <LiquidGlass padding="8px 16px">
        <span>content</span>
      </LiquidGlass>,
    );
    const host = screen.getByTestId("liquid-glass-host");
    expect(host.style.padding).toBe("8px 16px");
  });

  it("renders without throwing when WebGL is unavailable (happy-dom baseline)", () => {
    // Temporarily force getContext to return null to simulate a browser with
    // no WebGL 2 support. The component must mount regardless.
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLCanvasElement.prototype as any).getContext = () => null;
    try {
      expect(() =>
        render(
          <LiquidGlass>
            <span data-testid="fallback-child">still here</span>
          </LiquidGlass>,
        ),
      ).not.toThrow();
      expect(screen.getByTestId("fallback-child")).toBeTruthy();
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (HTMLCanvasElement.prototype as any).getContext = original;
    }
  });

  it("fires onClick when the host element is clicked", () => {
    const onClick = vi.fn();
    render(
      <LiquidGlass onClick={onClick}>
        <span>click me</span>
      </LiquidGlass>,
    );
    fireEvent.click(screen.getByTestId("liquid-glass-host"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards className to the host element", () => {
    render(
      <LiquidGlass className="custom-glass">
        <span>content</span>
      </LiquidGlass>,
    );
    const host = screen.getByTestId("liquid-glass-host");
    expect(host.className).toContain("custom-glass");
  });

  it("triggers an update effect when visual props change", () => {
    const { rerender } = render(
      <LiquidGlass displacementScale={40}>
        <span>content</span>
      </LiquidGlass>,
    );
    const initial = Number(
      screen.getByTestId("liquid-glass-host").dataset.updateCount,
    );
    rerender(
      <LiquidGlass displacementScale={80}>
        <span>content</span>
      </LiquidGlass>,
    );
    const next = Number(
      screen.getByTestId("liquid-glass-host").dataset.updateCount,
    );
    expect(next).toBeGreaterThan(initial);
  });
});
