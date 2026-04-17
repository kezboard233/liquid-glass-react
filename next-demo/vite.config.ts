import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "liquid-glass-react/next": fileURLToPath(new URL("../src/next/index.ts", import.meta.url)),
    },
  },
  server: { port: 5173 },
})
