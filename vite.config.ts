import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    outDir: "dist/next",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/next/index.ts"),
      name: "LiquidGlassNext",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.esm.js" : "index.cjs"),
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  plugins: [
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.next.json"),
      entryRoot: resolve(__dirname, "src/next"),
      outDir: resolve(__dirname, "dist/next"),
      include: ["src/next/**/*"],
      compilerOptions: {
        declarationDir: resolve(__dirname, "dist/next"),
      },
    }),
  ],
});
