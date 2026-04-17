import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

// Aliased to local stub; remove the alias once Units 1 + 5 have merged.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "liquid-glass-react/next": fileURLToPath(new URL("./src/stub-liquid-glass.tsx", import.meta.url)),
    },
  },
  server: { port: 5173 },
})
