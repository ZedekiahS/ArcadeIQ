import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_DATA_MODE", "api");
  window.history.replaceState({}, "", "/");
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("API persistence failures", () => {
  it("rejects a failed save instead of reporting a local save as successful", async () => {
    const { setStoredAuthToken } = await import("../src/services/users");
    setStoredAuthToken("test-token");
    const { saveGame } = await import("../src/services/catalog");
    const { games } = await import("../src/data/games");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: "Storage unavailable" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })));
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    await expect(saveGame(games[0], games, "account-a")).rejects.toThrow();
    expect(setItem).not.toHaveBeenCalled();
  });
});
