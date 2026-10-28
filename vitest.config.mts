import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// `@/*` mirrors tsconfig.json's `paths`, so tests import modules the way the app does.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
