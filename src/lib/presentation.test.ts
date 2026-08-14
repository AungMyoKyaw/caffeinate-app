import { describe, expect, it } from "vitest";
import { type CaffeinateStatus } from "./caffeinate";
import { getStateCopy } from "./presentation";

const idle: CaffeinateStatus = {
  active: false,
  keepDisplayAwake: false,
  startedAtUnixMs: null,
  timeoutSeconds: null,
  remainingSeconds: null,
  command: ""
};

const active: CaffeinateStatus = {
  active: true,
  keepDisplayAwake: false,
  startedAtUnixMs: null,
  timeoutSeconds: null,
  remainingSeconds: null,
  command: "/usr/bin/caffeinate -i -w 42"
};

describe("getStateCopy", () => {
  it("describes initial status reconciliation", () => {
    expect(getStateCopy(idle, true, false)).toEqual({
      statusLabel: "Checking",
      title: "Checking wake status.",
      detail: "Reading the current macOS sleep assertion.",
      actionLabel: "Checking"
    });
  });

  it("describes a ready Mac", () => {
    expect(getStateCopy(idle, false, false)).toEqual({
      statusLabel: "Ready",
      title: "Mac can sleep.",
      detail: "Start a wake session before a long task.",
      actionLabel: "Keep Mac Awake"
    });
  });

  it("describes a starting session", () => {
    expect(getStateCopy(idle, false, true)).toMatchObject({
      statusLabel: "Starting",
      actionLabel: "Starting"
    });
  });

  it("describes an active session that lets the display sleep", () => {
    expect(getStateCopy(active, false, false)).toEqual({
      statusLabel: "Awake",
      title: "Mac stays awake.",
      detail: "System sleep is blocked. The display may still turn off. Until stopped.",
      actionLabel: "Allow Sleep"
    });
  });

  it("describes display-awake and timed sessions", () => {
    expect(
      getStateCopy({ ...active, keepDisplayAwake: true, remainingSeconds: 3600 }, false, false)
    ).toMatchObject({
      detail: "System and display sleep are blocked. 1h remaining."
    });
  });

  it("describes a stopping session", () => {
    expect(getStateCopy(active, false, true)).toMatchObject({
      statusLabel: "Stopping",
      actionLabel: "Stopping"
    });
  });
});
