import { describe, expect, test } from "bun:test";
import {
  buildCommandPreview,
  formatRemaining,
  parseDuration,
  serializeDuration
} from "./format";

describe("duration serialization", () => {
  test("preserves the until-stopped option", () => {
    expect(serializeDuration(null)).toBe("until-stopped");
    expect(parseDuration("until-stopped")).toBeNull();
  });

  test("rejects an unsafe duration", () => {
    expect(() => parseDuration("30")).toThrow("between one minute and 24 hours");
  });
});

describe("status formatting", () => {
  test("formats remaining hours and minutes", () => {
    expect(formatRemaining(5_400)).toBe("1 hr 30 min remaining");
  });

  test("builds a fixed command preview", () => {
    expect(buildCommandPreview(true, 3_600)).toBe(
      "/usr/bin/caffeinate -i -d -t 3600 -w <app-pid>"
    );
  });
});
