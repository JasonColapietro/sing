import { afterEach, describe, expect, it, vi } from "vitest";

/** Control the browser's request/transaction events independently: a successful
 * request can still belong to a transaction that subsequently aborts. */
async function openStore() {
  vi.resetModules();
  const request = { result: undefined, error: null, onsuccess: null, onerror: null } as unknown as IDBRequest;
  const transaction = {
    error: null,
    oncomplete: null,
    onabort: null,
    onerror: null,
    objectStore: () => ({ put: () => request, delete: () => request, getAll: () => request }),
  } as unknown as IDBTransaction;
  const openRequest = {
    result: { transaction: () => transaction },
    onsuccess: null,
  } as unknown as IDBOpenDBRequest;
  vi.stubGlobal("indexedDB", { open: () => openRequest });
  const { openTakesStore } = await import("./db");
  const opening = openTakesStore();
  openRequest.onsuccess?.call(openRequest, new Event("success"));
  return { store: await opening, request, transaction };
}

afterEach(() => vi.unstubAllGlobals());

describe("recording storage durability", () => {
  it.each(["put", "remove"] as const)("does not report %s saved before the transaction commits", async (operation) => {
    const { store, request, transaction } = await openStore();
    let saved = false;
    const take = { id: "take-1", name: "Take 1", createdAt: 1, durationSec: 3, mimeType: "audio/webm", blob: new Blob(["audio"]), starred: false };
    const pending = (operation === "put" ? store.put(take) : store.remove(take.id)).then(() => { saved = true; });
    request.onsuccess?.call(request, new Event("success"));
    await Promise.resolve();
    await Promise.resolve();
    expect(saved).toBe(false);
    transaction.oncomplete?.call(transaction, new Event("complete"));
    await pending;
    expect(saved).toBe(true);
  });

  it("rejects a transaction abort even after a successful write request", async () => {
    const { store, request, transaction } = await openStore();
    const pending = store.remove("take-1");
    const assertion = expect(pending).rejects.toThrow("IndexedDB transaction aborted");
    request.onsuccess?.call(request, new Event("success"));
    transaction.onabort?.call(transaction, new Event("abort"));
    await assertion;
  });

  it("returns loaded takes only after a completed read", async () => {
    const { store, request, transaction } = await openStore();
    Object.defineProperty(request, "result", { value: [{ id: "existing" }] });
    const pending = store.getAll();
    request.onsuccess?.call(request, new Event("success"));
    transaction.oncomplete?.call(transaction, new Event("complete"));
    await expect(pending).resolves.toEqual([{ id: "existing" }]);
  });
});
