/**
 * A minimal React hooks runtime for driving a real component's state and
 * effects in a unit test, without a DOM, a browser or a microphone. Each
 * render re-runs the component until its effects stop setting state.
 *
 * vi.mock factories are hoisted above imports, so load it inside vi.hoisted:
 *
 *   const hooks = await vi.hoisted(async () => (await import("@/tests/hooks-harness")).createHooks());
 *   vi.mock("react", async (original) => hooks.mockReact(await original()));
 *
 * Nothing here imports React, so the import cannot load the module it mocks.
 */
type Slot = { value?: unknown; deps?: unknown[]; cleanup?: void | (() => void) };

export function createHooks() {
  let slots: Slot[] = [];
  let cursor = 0;
  let pending: (() => void)[] = [];
  let dirty = false;
  const same = (a?: unknown[], b?: unknown[]) =>
    !!a && !!b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

  const hooks = {
    /** Forget every slot without running cleanups. */
    reset() {
      slots = [];
    },
    /** Run every effect's cleanup, as React does on unmount, then forget the slots. */
    unmount() {
      slots.forEach((slot) => {
        if (typeof slot.cleanup === "function") slot.cleanup();
      });
      slots = [];
    },
    render<T>(component: () => T): T {
      let out: T;
      let remaining = 20;
      do {
        cursor = 0;
        pending = [];
        dirty = false;
        out = component();
        pending.forEach((effect) => effect());
        if (!remaining--) throw new Error("Effects did not settle");
      } while (dirty);
      return out!;
    },
    useState<S>(init: S | (() => S)) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: typeof init === "function" ? (init as () => S)() : init };
      return [
        slots[i].value as S,
        (next: S | ((previous: S) => S)) => {
          const value = typeof next === "function" ? (next as (previous: S) => S)(slots[i].value as S) : next;
          if (!Object.is(value, slots[i].value)) {
            slots[i].value = value;
            dirty = true;
          }
        },
      ] as const;
    },
    useRef<T>(value: T) {
      const i = cursor++;
      slots[i] ??= { value: { current: value } };
      return slots[i].value as { current: T };
    },
    useMemo<T>(create: () => T, deps: unknown[]) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { value: create(), deps };
      return slots[i].value as T;
    },
    useEffect(effect: () => void | (() => void), deps?: unknown[]) {
      const i = cursor++;
      if (slots[i] && same(slots[i].deps, deps)) return;
      pending.push(() => {
        const cleanup = slots[i]?.cleanup;
        if (typeof cleanup === "function") cleanup();
        slots[i] = { deps, cleanup: effect() };
      });
    },
    /** The real React module with its state, ref, memo, callback and effect hooks replaced. */
    mockReact<R extends object>(react: R) {
      return {
        ...react,
        useState: hooks.useState,
        useRef: hooks.useRef,
        useMemo: hooks.useMemo,
        useCallback: <T,>(fn: T, deps: unknown[]) => hooks.useMemo(() => fn, deps),
        useEffect: hooks.useEffect,
        // No provider renders here, so every context reads its default value.
        useContext: <T,>(context: unknown) => (context as { _currentValue: T })._currentValue,
      };
    },
  };
  return hooks;
}
