import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  freshData,
  formatClock,
  formatDuration,
  validateDuration,
  wakeCommandPreview
} from "./app-api";

describe("Caffeinate 3.0 client-facing rules", () => {
  it("starts with no auto-start or global shortcuts", () => {
    const a = freshData();
    const b = freshData();
    expect(a.preferences).toMatchObject(DEFAULT_PREFERENCES);
    expect(a.preferences.launchAtLogin).toBe(false);
    expect(a.preferences.wakeMode).toBe("system");
    expect(a.preferences.toggleShortcut).toBe("");
    a.preferences.theme = "dark";
    expect(b.preferences.theme).toBe("system");
  });
  it("accepts precisely 60–86400 seconds or indefinite", () => {
    for (const v of [null, 60, 3600, 86400]) expect(validateDuration(v)).toBe(true);
    for (const v of [0, 59, 86401, -10, Infinity, NaN, 1.5])
      expect(validateDuration(v)).toBe(false);
  });
  it("previews System, Display and Both with fixed binary and owner guard", () => {
    expect(wakeCommandPreview("system", null)).toBe("/usr/bin/caffeinate -i -w <app-pid>");
    expect(wakeCommandPreview("display", 3600)).toBe("/usr/bin/caffeinate -d -t 3600 -w <app-pid>");
    expect(wakeCommandPreview("both", 60)).toBe("/usr/bin/caffeinate -i -d -t 60 -w <app-pid>");
  });
  it("formats bounded and indefinite time", () => {
    expect(formatDuration(null)).toBe("Until stopped");
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(3660)).toBe("1h 1m");
    expect(formatClock(null)).toBe("Until stopped");
    expect(formatClock(Date.UTC(2026, 9, 19))).not.toBe("");
  });
});
