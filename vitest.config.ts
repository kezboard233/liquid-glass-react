/**
 * Vitest config for the `next` (v2) architecture test suite.
 *
 * Units 1-5 will converge on a single `src/next/` tree; this config restricts
 * Vitest to `src/next/__tests__/` so v1 source remains untouched. The alias
 * redirects `../react/LiquidGlass` to the local mock until Unit 5 ships the
 * real component (at which point the alias can be removed).
 */
import { defineConfig } from "vitest/config";
import * as path from "node:path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: false,
    include: ["src/next/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["src/next/__tests__/setup.ts"],
  },
  resolve: {
    alias: [
      {
        // Redirect the Unit-5 import path to the local mock. When Unit 5
        // lands at src/next/react/LiquidGlass.tsx, remove this alias.
        find: /^\.\.\/react\/LiquidGlass$/,
        replacement: path.resolve(
          __dirname,
          "src/next/__tests__/__mocks__/LiquidGlass.tsx",
        ),
      },
    ],
  },
});
