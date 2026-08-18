import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// The `@/*` path alias mirrors tsconfig.json's `paths`, so tests can import
// modules the same way the app does. Without it, vitest cannot resolve the
// `@/…` specifiers that every component and lib module uses internally.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
