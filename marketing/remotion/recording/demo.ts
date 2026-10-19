/* Isolated recording backend: actual Svelte component and styles, no real wake sessions. */
import { mount } from "svelte";
import App from "../../../src/App.svelte";
import "../../../src/styles.css";
import type { CaffeinateClient, CaffeinateStatus, StartOptions } from "../../../src/lib/caffeinate";
let startedAt: number | null = null;
let duration: number | null = null;
let mode: "system" | "both" = "system";
let revision = 0;
const snapshot = (): CaffeinateStatus => {
  const active = startedAt !== null;
  const elapsed = startedAt === null ? null : Math.floor((Date.now() - startedAt) / 1000);
  const remaining = elapsed !== null && duration !== null ? Math.max(0, duration - elapsed) : null;
  return {
    active,
    keepDisplayAwake: active && mode === "both",
    wakeMode: active ? mode : "system",
    startedAtUnixMs: startedAt,
    timeoutSeconds: active ? duration : null,
    remainingSeconds: remaining,
    elapsedSeconds: elapsed,
    endsAtUnixMs: startedAt && duration ? startedAt + duration * 1000 : null,
    revision,
    sessionId: active ? 1 : null,
    command: active ? "/usr/bin/caffeinate " + (mode === "both" ? "-i -d" : "-i") : ""
  };
};
const client: CaffeinateClient = {
  async start(o: StartOptions) {
    mode = o.keepDisplayAwake ? "both" : "system";
    duration = o.timeoutSeconds;
    startedAt = Date.now();
    revision++;
    return snapshot();
  },
  async stop() {
    startedAt = null;
    duration = null;
    revision++;
    return snapshot();
  },
  async status() {
    return snapshot();
  }
};
document.documentElement.dataset.theme = "light";
const target = document.getElementById("app");
if (!target) throw new Error("Recording mount point #app is missing");
mount(App, { target, props: { client, pollIntervalMs: 700 } });
