import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { ignoreEarShortcut } from "./keyboard";

// Run the actual window keydown callbacks from each game. No simulated game
// implementation: the bound actions expose whether the real handler advances,
// records a sung answer, or lets a focused control activate normally.
function handler(file: string, phase = "result") {
  const source = ts.createSourceFile(file, readFileSync(new URL(file, import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === "onKey") expression = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!expression) throw new Error(`No keyboard handler in ${file}`);
  const actions = { next: vi.fn(), finishSinging: vi.fn(), play: vi.fn(), playTone: vi.fn(), playMelody: vi.fn(), answer: vi.fn() };
  const env = {
    ...actions, ignoreEarShortcut,
    session: { done: false }, listening: true, melody: [60, 62, 64], target: 60,
    phase, replayAllowed: true, SHORTCUT_KEYS: ["1", "2", "3"], options: [0, 4, 7],
  };
  const onKey = vm.runInNewContext(ts.transpileModule(`(${expression.getText(source)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, env) as (event: KeyboardEvent) => void;
  return { ...actions, onKey };
}
function key(value: string, control = false, prevented = false) {
  return {
    key: value, defaultPrevented: prevented,
    target: { isContentEditable: false, closest: () => control ? {} : null },
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent;
}

for (const file of ["./interval-game.tsx", "./melody-echo-game.tsx", "./pitch-match-game.tsx"]) {
  describe(file, () => {
    it("leaves Enter on Hear again or Quit to the focused button", () => {
      const game = handler(file);
      const event = key("Enter", true);
      game.onKey(event);
      expect(game.next).not.toHaveBeenCalled();
      expect(game.finishSinging).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
    it("ignores Enter already handled by a control", () => {
      const game = handler(file);
      game.onKey(key("Enter", false, true));
      expect(game.next).not.toHaveBeenCalled();
    });
    it("keeps body-level Enter advancing the round", () => {
      const game = handler(file);
      game.onKey(key("Enter"));
      expect(game.next).toHaveBeenCalledOnce();
    });
    it("preserves replay shortcuts while a button is focused", () => {
      const game = handler(file);
      game.onKey(key("r", true));
      expect(game.play.mock.calls.length + game.playTone.mock.calls.length + game.playMelody.mock.calls.length).toBe(1);
    });
  });
}

it("does not finish Melody echo singing when Enter activates Hear again or Quit", () => {
  const game = handler("./melody-echo-game.tsx", "sing");
  game.onKey(key("Enter", true));
  expect(game.finishSinging).not.toHaveBeenCalled();
  game.onKey(key("Enter"));
  expect(game.finishSinging).toHaveBeenCalledOnce();
});

it("preserves number answers from a focused button, while honoring defaultPrevented", () => {
  const game = handler("./interval-game.tsx");
  game.onKey(key("2", true));
  expect(game.answer).toHaveBeenCalledExactlyOnceWith(4);
  game.onKey(key("3", true, true));
  expect(game.answer).toHaveBeenCalledOnce();
});
