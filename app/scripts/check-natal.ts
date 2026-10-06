// Check: natal profile storage (Task 2).
// Run: npm run check:natal

type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void };

function withStorage<T>(store: Store | "throw", fn: () => T): T {
  const original = (globalThis as Record<string, unknown>).localStorage;
  if (store === "throw") {
    (globalThis as Record<string, unknown>).localStorage = {
      getItem() { throw new Error("opaque origin"); },
      setItem() { throw new Error("opaque origin"); },
      removeItem() { throw new Error("opaque origin"); },
    };
  } else {
    (globalThis as Record<string, unknown>).localStorage = store;
  }
  try {
    return fn();
  } finally {
    if (original === undefined) delete (globalThis as Record<string, unknown>).localStorage;
    else (globalThis as Record<string, unknown>).localStorage = original;
  }
}

function mapStore(): Store & { dump(): Map<string, string> } {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => m,
  };
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const { loadNatal, saveNatal, clearNatal } = await import("../src/lib/natal");

// 1. save -> load round-trip
withStorage(mapStore(), () => {
  const p = { name: "Ada", birth: "1985-04-12T08:30:00.000Z", lat: 51.5074, lng: -0.1278, placeName: "London" };
  saveNatal(p);
  const back = loadNatal();
  assert(back && back.name === "Ada" && back.birth === p.birth && back.lat === 51.5074 && back.placeName === "London", "round-trip");
});

// 2. clear -> null
withStorage(mapStore(), () => {
  saveNatal({ birth: "1985-04-12T08:30:00.000Z", lat: 1, lng: 2, placeName: "x" });
  clearNatal();
  assert(loadNatal() === null, "clear -> null");
});

// 3. garbage JSON -> null
withStorage(mapStore(), () => {
  const s = mapStore();
  s.setItem("cunning-man:natal", "{not json");
  withStorage(s, () => assert(loadNatal() === null, "garbage -> null"));
  s.setItem("cunning-man:natal", JSON.stringify({ birth: "nope", lat: 999, lng: 0, placeName: "" }));
  withStorage(s, () => assert(loadNatal() === null, "invalid fields -> null"));
});

// 4. throwing storage: load -> null, save/clear do not throw
withStorage("throw", () => {
  assert(loadNatal() === null, "throwing storage load -> null");
  saveNatal({ birth: "1985-04-12T08:30:00.000Z", lat: 1, lng: 2, placeName: "x" });
  clearNatal();
});

// 5. no storage at all -> null
{
  const original = (globalThis as Record<string, unknown>).localStorage;
  delete (globalThis as Record<string, unknown>).localStorage;
  try {
    assert(loadNatal() === null, "absent storage -> null");
  } finally {
    (globalThis as Record<string, unknown>).localStorage = original;
  }
}

// 6. cities sanity (same import surface consumers rely on)
const { CITIES } = await import("../src/data/cities");
assert(CITIES.length === 10, "10 cities");
for (const c of CITIES) {
  assert(Number.isFinite(c.lat) && Math.abs(c.lat) <= 90 && Number.isFinite(c.lng) && Math.abs(c.lng) <= 180, `coords ${c.name}`);
}

console.log("check:natal OK");
