/**
 * Vitest setup for the `next` (v2) architecture tests.
 */
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
