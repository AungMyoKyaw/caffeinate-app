import { tick } from "svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn(async () => ({
  active: false,
  keepDisplayAwake: false,
  startedAtUnixMs: null,
  timeoutSeconds: null,
  remainingSeconds: null,
  command: ""
}));

describe("application bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockClear();
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));
  });

  it("mounts the Svelte application into #app", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    await import("./main");
    await Promise.resolve();
    await tick();

    expect(document.querySelector(".app-shell")).not.toBeNull();
    expect(invoke).toHaveBeenCalledWith("get_caffeinate_status");
  });

  it("fails fast when the HTML mount target is missing", async () => {
    document.body.innerHTML = "";
    await expect(import("./main")).rejects.toThrow("Caffeinate mount target is missing");
  });
});
