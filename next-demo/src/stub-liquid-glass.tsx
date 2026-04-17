import React from "react"

export type LiquidGlassMode = "standard" | "polar" | "prominent" | "shader"

export interface LiquidGlassProps {
  children?: React.ReactNode
  displacementScale?: number
  blurAmount?: number
  saturation?: number
  aberrationIntensity?: number
  elasticity?: number
  cornerRadius?: number
  overLight?: boolean
  mode?: LiquidGlassMode
  className?: string
  padding?: string
  style?: React.CSSProperties
  onClick?: () => void
}

/**
 * Placeholder stub for `liquid-glass-react/next`.
 *
 * This component is used only while the real `src/next/` entrypoint
 * (delivered by sibling PRs / Units 1 + 5) is not yet merged.
 * Once those units land, remove the alias in `vite.config.ts` and
 * delete this file.
 */
export default function LiquidGlass({
  children,
  blurAmount = 0.0625,
  saturation = 140,
  cornerRadius = 999,
  overLight = false,
  className = "",
  padding = "24px 32px",
  style = {},
  onClick,
}: LiquidGlassProps) {
  // Map the package's small blurAmount (~0-1) into a sensible px value for CSS
  const blurPx = (overLight ? 12 : 4) + blurAmount * 32

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        display: "inline-block",
        padding,
        borderRadius: `${cornerRadius}px`,
        backdropFilter: `blur(${blurPx}px) saturate(${saturation}%)`,
        WebkitBackdropFilter: `blur(${blurPx}px) saturate(${saturation}%)`,
        background: overLight
          ? "rgba(0, 0, 0, 0.25)"
          : "rgba(255, 255, 255, 0.15)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        boxShadow: overLight
          ? "0px 16px 70px rgba(0, 0, 0, 0.75)"
          : "0px 12px 40px rgba(0, 0, 0, 0.25)",
        color: overLight ? "#fff" : "inherit",
        cursor: onClick ? "pointer" : "default",
        transition: "backdrop-filter 120ms ease, background 120ms ease",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
