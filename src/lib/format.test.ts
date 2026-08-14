import { describe, expect, it } from "vitest";
import { buildCommandPreview, DURATION_PRESETS, formatRemaining } from "./format";

describe("duration presets", () => {
  it("exposes the exact supported session choices", () => {
    expect(DURATION_PRESETS.map(({ label, shortLabel, seconds }) => ({ label, shortLabel, seconds }))).toEqual([
      { label: "Until stopped", shortLabel: "Until stopped", seconds: null },
      { label: "30 minutes", shortLabel: "30m", seconds: 1800 },
      { label: "1 hour", shortLabel: "1h", seconds: 3600 },
      { label: "2 hours", shortLabel: "2h", seconds: 7200 },
      { label: "4 hours", shortLabel: "4h", seconds: 14400 }
    ]);
  });
});

describe("formatRemaining", () => {
  it.each([
    [null, "Until stopped"],
    [0, "Ending now"],
    [-1, "Ending now"],
    [1, "1m remaining"],
    [3599, "1h remaining"],
    [3600, "1h remaining"],
    [3660, "1h 1m remaining"],
    [7199, "2h remaining"]
  ])("formats %s seconds", (seconds, expected) => {
    expect(formatRemaining(seconds)).toBe(expected);
  });
});

describe("buildCommandPreview", () => {
  it("builds the safe default command", () => {
    expect(buildCommandPreview(false, null)).toBe("/usr/bin/caffeinate -i -w <app-pid>");
  });

  it("adds display and timeout flags only when requested", () => {
    expect(buildCommandPreview(true, 3600)).toBe(
      "/usr/bin/caffeinate -i -d -t 3600 -w <app-pid>"
    );
  });

  it("supports a bounded timeout without display assertion", () => {
    expect(buildCommandPreview(false, 1800)).toBe("/usr/bin/caffeinate -i -t 1800 -w <app-pid>");
  });
});
