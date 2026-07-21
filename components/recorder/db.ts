/**
 * Tiny IndexedDB wrapper for practice takes, with an in-memory fallback for
 * browsers where IndexedDB is unavailable (e.g. some private modes).
 *
 * db: "suede-sing-takes", store: "takes", keyPath: "id".
 */

export interface TakeRecord {
  id: string;
  name: string;
  /** Epoch ms. */
  createdAt: number;
  durationSec: number;
  mimeType: string;
  blob: Blob;
  starred: boolean;
  /** Optional 1–5 self-rating. */
  rating?: number;
  /** Optional one-line self-review note. */
  note?: string;
}

export interface TakesStore {
  /** False when takes live only in memory and won't survive a reload. */
  persistent: boolean;
  getAll(): Promise<TakeRecord[]>;
  put(take: TakeRecord): Promise<void>;
  remove(id: string): Promise<void>;
}

const DB_NAME = "suede-sing-takes";
const STORE = "takes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, 1);
    } catch (err) {
      reject(err instanceof Error ? err : new Error("indexedDB.open failed"));
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
    req.onblocked = () => reject(new Error("indexedDB open blocked"));
  });
}

function run<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let req: IDBRequest<T>;
    try {
      req = fn(db.transaction(STORE, mode).objectStore(STORE));
    } catch (err) {
      reject(err instanceof Error ? err : new Error("IndexedDB transaction failed"));
      return;
    }
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

function idbStore(db: IDBDatabase): TakesStore {
  return {
    persistent: true,
    getAll: () => run(db, "readonly", (s) => s.getAll() as IDBRequest<TakeRecord[]>),
    put: async (take) => {
      await run(db, "readwrite", (s) => s.put(take));
    },
    remove: async (id) => {
      await run(db, "readwrite", (s) => s.delete(id));
    },
  };
}

/** Module-level so takes survive remounts within the same tab session. */
const memory = new Map<string, TakeRecord>();

function memoryStore(): TakesStore {
  return {
    persistent: false,
    getAll: () => Promise.resolve([...memory.values()]),
    put: (take) => {
      memory.set(take.id, take);
      return Promise.resolve();
    },
    remove: (id) => {
      memory.delete(id);
      return Promise.resolve();
    },
  };
}

let storePromise: Promise<TakesStore> | null = null;

/** Open (or reuse) the takes store. Never rejects — falls back to memory. */
export function openTakesStore(): Promise<TakesStore> {
  if (!storePromise) {
    storePromise = (async () => {
      if (typeof indexedDB === "undefined") return memoryStore();
      try {
        return idbStore(await openDb());
      } catch {
        return memoryStore();
      }
    })();
  }
  return storePromise;
}
