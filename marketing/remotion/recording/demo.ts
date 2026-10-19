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
  const elapsed = active ? Math.floor((Date.now() - startedAt!) / 1000) : null;
  const remaining = active && duration !== null ? Math.max(0, duration - elapsed!) : null;
  return {active,keepDisplayAwake:active && mode === "both",wakeMode:active ? mode : "system",
    startedAtUnixMs:startedAt,timeoutSeconds:active ? duration : null,
    remainingSeconds:remaining,elapsedSeconds:elapsed,
    endsAtUnixMs:startedAt && duration ? startedAt + duration * 1000 : null,
    revision,sessionId:active ? 1 : null,
    command:active ? "/usr/bin/caffeinate " + (mode === "both" ? "-i -d" : "-i") : ""};
};
const client: CaffeinateClient = {
  async start(o:StartOptions){ mode=o.keepDisplayAwake ? "both" : "system"; duration=o.timeoutSeconds; startedAt=Date.now(); revision++; return snapshot(); },
  async stop(){ startedAt=null; duration=null; revision++; return snapshot(); },
  async status(){return snapshot();}
};
document.documentElement.dataset.theme = "light";
mount(App, {target: document.getElementById("app")!, props: {client, pollIntervalMs: 700}});
