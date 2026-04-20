import { useState, type CSSProperties } from "react"
import LiquidGlass from "liquid-glass-react/next"

type Mode = "standard" | "polar" | "prominent" | "shader"

interface Props {
  displacementScale: number
  blurAmount: number
  saturation: number
  aberrationIntensity: number
  elasticity: number
  cornerRadius: number
  overLight: boolean
  mode: Mode
}

const DEFAULTS: Props = {
  displacementScale: 70,
  blurAmount: 0.0625,
  saturation: 140,
  aberrationIntensity: 2,
  elasticity: 0.15,
  cornerRadius: 32,
  overLight: false,
  mode: "standard",
}

const scatteredEmoji = [
  { c: "❄️", top: "10%", left: "14%", size: 64 },
  { c: "🏔️", top: "20%", left: "72%", size: 88 },
  { c: "⛷️", top: "52%", left: "8%", size: 76 },
  { c: "🌨️", top: "70%", left: "64%", size: 84 },
  { c: "☀️", top: "12%", left: "50%", size: 72 },
  { c: "⛄", top: "82%", left: "24%", size: 78 },
  { c: "✨", top: "36%", left: "36%", size: 56 },
  { c: "🦌", top: "60%", left: "86%", size: 68 },
  { c: "🧊", top: "30%", left: "22%", size: 64 },
  { c: "🏂", top: "78%", left: "52%", size: 80 },
]

export default function App() {
  const [props, setProps] = useState<Props>(DEFAULTS)

  const update = <K extends keyof Props>(key: K, value: Props[K]) =>
    setProps((p) => ({ ...p, [key]: value }))

  const backgroundStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: -1,
    backgroundImage:
      "linear-gradient(180deg, rgba(12, 30, 60, 0.35) 0%, rgba(20, 40, 80, 0.15) 45%, rgba(0, 0, 0, 0.35) 100%), url(https://images.unsplash.com/photo-1519681393784-d120267933ba?w=2400&q=80&auto=format&fit=crop)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#fff" }}>
      <div style={backgroundStyle}>
        {scatteredEmoji.map((e, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: e.top,
              left: e.left,
              fontSize: e.size,
              userSelect: "none",
              filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.25))",
            }}
          >
            {e.c}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 520px) 300px",
          gap: 28,
          padding: "48px 24px 120px",
          maxWidth: 860,
          margin: "0 auto",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* Showcase — narrow vertical column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 40,
          }}
        >
          <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h1 style={{ fontSize: 40, margin: 0, lineHeight: 1.1, textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
              Liquid Glass — v2 Preview
            </h1>
            <p style={{ fontSize: 16, opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
              A Vanilla TS + WebGL 2 engine with a thin React adapter. Drag the
              sliders on the right to tweak the glass in real time.
            </p>
          </header>

          <LiquidGlass {...props} padding="20px 24px" cornerRadius={Math.max(24, props.cornerRadius)}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  flexShrink: 0,
                }}
              >
                🧑‍🚀
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Ada Lovelace</div>
                <div style={{ fontSize: 14, opacity: 0.85 }}>
                  Analytical Engine Pilot · since 1843
                </div>
              </div>
            </div>
          </LiquidGlass>

          <LiquidGlass {...props} padding="20px 24px" cornerRadius={Math.max(20, props.cornerRadius)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>
                Today · Zermatt
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 52, fontWeight: 300, lineHeight: 1 }}>−8°</span>
                <span style={{ fontSize: 16, opacity: 0.8 }}>light snow</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>wind 14 km/h · humidity 78%</div>
            </div>
          </LiquidGlass>

          <LiquidGlass
            {...props}
            padding="12px 28px"
            cornerRadius={999}
            onClick={() => alert("Logged out (not really)")}
          >
            <span style={{ fontSize: 16, fontWeight: 600 }}>Log Out</span>
          </LiquidGlass>

          <LiquidGlass {...props} padding="16px 20px" cornerRadius={Math.max(18, props.cornerRadius)}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>🎵</span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Chromatic Haze</span>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>Aurora · 3:42</span>
                </div>
              </div>
              <span style={{ fontSize: 12, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
                1:18 / 3:42
              </span>
            </div>
          </LiquidGlass>
        </div>

        {/* Control Panel */}
        <ControlPanel props={props} update={update} reset={() => setProps(DEFAULTS)} />
      </div>

      <div style={{ height: "40vh" }} />
    </div>
  )
}

function ControlPanel({
  props,
  update,
  reset,
}: {
  props: Props
  update: <K extends keyof Props>(key: K, value: Props[K]) => void
  reset: () => void
}) {
  return (
    <aside
      style={{
        position: "sticky",
        top: 32,
        alignSelf: "start",
        padding: 20,
        borderRadius: 20,
        background: "rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Controls</h2>
        <button
          onClick={reset}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Reset
        </button>
      </div>

      <Slider label="displacementScale" value={props.displacementScale} min={0} max={200} step={1} onChange={(v) => update("displacementScale", v)} />
      <Slider label="blurAmount" value={props.blurAmount} min={0} max={1} step={0.01} onChange={(v) => update("blurAmount", v)} />
      <Slider label="saturation" value={props.saturation} min={0} max={300} step={1} onChange={(v) => update("saturation", v)} />
      <Slider label="aberrationIntensity" value={props.aberrationIntensity} min={0} max={20} step={0.1} onChange={(v) => update("aberrationIntensity", v)} />
      <Slider label="elasticity" value={props.elasticity} min={0} max={1} step={0.01} onChange={(v) => update("elasticity", v)} />
      <Slider label="cornerRadius" value={props.cornerRadius} min={0} max={999} step={1} onChange={(v) => update("cornerRadius", v)} />

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={props.overLight}
          onChange={(e) => update("overLight", e.target.checked)}
        />
        overLight
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span>mode</span>
        <select
          value={props.mode}
          onChange={(e) => update("mode", e.target.value as Mode)}
          style={{
            padding: "6px 8px",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6,
          }}
        >
          <option value="standard">standard</option>
          <option value="polar">polar</option>
          <option value="prominent">prominent</option>
          <option value="shader">shader</option>
        </select>
      </label>
    </aside>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
          {value.toFixed(step < 1 ? 2 : 0)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%" }}
      />
    </label>
  )
}
