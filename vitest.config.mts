import { configDefaults, defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// The `@/*` path alias mirrors tsconfig.json's `paths`, so tests can import
// modules the same way the app does. Without it, vitest cannot resolve the
// `@/…` specifiers that every component and lib module uses internally.
export default defineConfig({
  test: {
    /**
     * Agent worktrees are full checkouts living inside this one, so the default
     * include pattern walked them and ran three stale copies of the whole suite
     * alongside the real one. That reported twelve failures — none of them in
     * any file in this checkout, all artefacts of two React instances resolving
     * through two node_modules trees — and the noise made the suite useless as
     * a gate at exactly the moment a gate mattered. The failures also survive
     * `git stash`, which is a memorable way to lose an hour.
     */
    exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
