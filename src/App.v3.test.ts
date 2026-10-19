import { mount, tick, unmount } from "svelte";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.svelte";
import {
  freshData,
  type AppData,
  type Profile,
  type Preferences,
  type Schedule
} from "./lib/app-api";
import type { CaffeinateStatus } from "./lib/caffeinate";

const mock = vi.hoisted(() => ({
  invoke: vi.fn(),
  listen: vi.fn(async (_name: string, _listener: (event: { payload: unknown }) => void) => {
    void _name;
    void _listener;
    return () => undefined;
  })
}));
vi.mock("@tauri-apps/api/core", () => ({ invoke: mock.invoke }));
vi.mock("@tauri-apps/api/event", () => ({ listen: mock.listen }));

let appData: AppData;
let current: CaffeinateStatus;
let component: ReturnType<typeof mount> | undefined;
const idle: CaffeinateStatus = {
  active: false,
  keepDisplayAwake: false,
  timeoutSeconds: null,
  startedAtUnixMs: null,
  remainingSeconds: null,
  command: "",
  wakeMode: "system",
  elapsedSeconds: null,
  endsAtUnixMs: null,
  revision: 0,
  sessionId: null
};
function activeStatus(mode: "system" | "display" | "both" = "system"): CaffeinateStatus {
  return {
    active: true,
    keepDisplayAwake: mode !== "system",
    timeoutSeconds: 7200,
    startedAtUnixMs: 1_800_000_000_000,
    endsAtUnixMs: 1_800_007_200_000,
    remainingSeconds: 4980,
    elapsedSeconds: 2220,
    revision: 1,
    sessionId: 123,
    wakeMode: mode,
    command: "/usr/bin/caffeinate -i -t 7200 -w 42"
  };
}
function button(text: string): HTMLButtonElement {
  const result = [...document.querySelectorAll("button")].find(
    (e) => e.textContent?.trim() === text
  );
  if (!result) throw new Error(`Button not found: ${text}`);
  return result;
}
async function flush() {
  for (let i = 0; i < 4; i++) {
    await Promise.resolve();
    await tick();
  }
}
async function render() {
  document.body.innerHTML = '<div id="test-root"></div>';
  const target = document.getElementById("test-root");
  if (!target) throw new Error("Missing test root");
  component = mount(App, { target, props: { pollIntervalMs: 100_000 } });
  await flush();
  return target;
}
async function click(text: string) {
  button(text).click();
  await flush();
}
beforeEach(() => {
  appData = freshData();
  current = { ...idle };
  mock.invoke.mockReset();
  mock.listen.mockClear();
  mock.invoke.mockImplementation(async (command: string, args?: Record<string, unknown>) => {
    if (command === "get_caffeinate_status") return { ...current };
    if (command === "get_app_data") return structuredClone(appData);
    if (command === "start_wake_session") {
      const o = args?.options as {
        wakeMode: "system" | "display" | "both";
        timeoutSeconds: number | null;
      };
      current = { ...activeStatus(o.wakeMode), timeoutSeconds: o.timeoutSeconds };
      return { ...current };
    }
    if (command === "stop_caffeinate") {
      current = { ...idle, revision: (current.revision ?? 0) + 1 };
      return { ...current };
    }
    if (command === "update_wake_session") {
      const o = args?.options as {
        wakeMode: "system" | "display" | "both";
        timeoutSeconds: number | null;
      };
      current = {
        ...current,
        wakeMode: o.wakeMode,
        timeoutSeconds: o.timeoutSeconds,
        remainingSeconds: o.timeoutSeconds,
        revision: (current.revision ?? 0) + 1
      };
      return { ...current };
    }
    if (command === "save_settings") {
      appData.preferences = { ...(args?.preferences as Preferences) };
      return structuredClone(appData);
    }
    if (command === "save_profile") {
      const p = args?.profile as Profile;
      const updated = { ...p, id: p.id || 12345 };
      appData.profiles = p.id
        ? appData.profiles.map((v) => (v.id === p.id ? updated : v))
        : [...appData.profiles, updated];
      return structuredClone(appData);
    }
    if (command === "delete_profile") {
      appData.profiles = appData.profiles.filter((v) => v.id !== args?.id);
      return structuredClone(appData);
    }
    if (command === "create_schedule") {
      const schedule = args?.schedule as Schedule;
      const updated = { ...schedule, id: schedule.id || 456 };
      appData.schedules = schedule.id
        ? appData.schedules.map((v) => (v.id === schedule.id ? updated : v))
        : [...appData.schedules, updated];
      return structuredClone(appData);
    }
    if (command === "delete_schedule") {
      appData.schedules = appData.schedules.filter((v) => v.id !== args?.id);
      return structuredClone(appData);
    }
    if (command === "set_schedule_enabled") {
      appData.schedules = appData.schedules.map((s) =>
        s.id === args?.id ? { ...s, outcome: args?.enabled ? "pending" : "disabled" } : s
      );
      return structuredClone(appData);
    }
    if (command === "clear_history") {
      appData.history = [];
      return structuredClone(appData);
    }
    throw new Error("Unexpected command " + command);
  });
});
afterEach(async () => {
  if (component) {
    await unmount(component);
    component = undefined;
  }
  document.body.innerHTML = "";
  delete document.documentElement.dataset.theme;
  vi.useRealTimers();
});
describe("Caffeinate 3.0 native bridge and Stillwater flows", () => {
  it("loads persisted mode, duration and native event listeners", async () => {
    appData.preferences.wakeMode = "display";
    appData.preferences.timeoutSeconds = 3600;
    appData.preferences.theme = "dark";
    await render();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(
      document.querySelector<HTMLInputElement>('input[name="wakeMode"]:checked')?.closest("label")
        ?.textContent
    ).toContain("Display");
    expect(
      document
        .querySelector<HTMLInputElement>('input[name="duration"]:checked')
        ?.getAttribute("aria-label")
    ).toBe("1 hour");
    expect(mock.listen).toHaveBeenCalledWith("wake-status", expect.any(Function));
  });
  it("starts a real typed mode and stops through authoritative IPC", async () => {
    await render();
    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="wakeMode"]');
    inputs[2]?.click();
    await click("Keep Mac Awake");
    expect(mock.invoke).toHaveBeenCalledWith("start_wake_session", {
      options: { wakeMode: "both", timeoutSeconds: null }
    });
    expect(document.body.textContent).toContain("Mac stays awake.");
    await click("Stop Session");
    expect(mock.invoke).toHaveBeenCalledWith("stop_caffeinate");
    expect(document.body.textContent).toContain("Mac can sleep.");
  });
  it("edits a running session after staging changes", async () => {
    current = activeStatus();
    await render();
    document.querySelector<HTMLInputElement>('input[aria-label="1 hour"]')?.click();
    await flush();
    expect(document.body.textContent).toContain("Changes not applied");
    expect(mock.invoke).not.toHaveBeenCalledWith("update_wake_session", expect.anything());
    await click("Apply changes");
    expect(mock.invoke).toHaveBeenCalledWith("update_wake_session", {
      options: { wakeMode: "system", timeoutSeconds: 3600 },
      expectedRevision: 1
    });
    expect(document.body.textContent).toContain("Session updated");
  });
  it("discards unsaved active edits without IPC", async () => {
    current = activeStatus();
    await render();
    document.querySelector<HTMLInputElement>('input[aria-label="30 minutes"]')?.click();
    await flush();
    await click("Discard");
    expect(document.body.textContent).not.toContain("Changes not applied");
    expect(mock.invoke).not.toHaveBeenCalledWith("update_wake_session", expect.anything());
  });
  it("rejects custom durations outside the allowed range", async () => {
    await render();
    document.querySelector<HTMLInputElement>('input[aria-label="Custom duration"]')?.click();
    await flush();
    const input = document.getElementById("custom-minutes") as HTMLInputElement;
    input.value = "1441";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    expect(document.body.textContent).toContain("Enter 1–1440 whole minutes");
    expect(button("Keep Mac Awake").disabled).toBe(true);
  });
  it("displays actual command in expandable technical details", async () => {
    current = activeStatus();
    await render();
    const details = document.querySelector("details");
    if (!details) throw new Error("Missing technical details");
    details.open = true;
    await flush();
    expect(details.textContent).toContain("/usr/bin/caffeinate -i -t 7200 -w 42");
  });
  it("creates, applies and deletes local profiles", async () => {
    await render();
    await click("Profiles");
    expect(document.body.textContent).toContain("No profiles yet");
    const input = document.getElementById("profile-name") as HTMLInputElement;
    input.value = "Presentation";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    await click("Save current settings");
    expect(mock.invoke).toHaveBeenCalledWith("save_profile", expect.anything());
    expect(document.body.textContent).toContain("Presentation");
    await click("Edit");
    expect(document.body.textContent).toContain("Save profile");
    const edit = document.getElementById("profile-name") as HTMLInputElement;
    edit.value = "Presentation 2";
    edit.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    await click("Save profile");
    expect(appData.profiles).toHaveLength(1);
    expect(appData.profiles[0]?.name).toBe("Presentation 2");
    await click("Use");
    expect(document.body.textContent).toContain("Mac can sleep.");
    await click("Profiles");
    await click("Delete");
    expect(appData.profiles).toHaveLength(0);
  });
  it("creates and deletes a one-shot schedule", async () => {
    await render();
    await click("Schedules");
    expect(document.body.textContent).toContain("wake a sleeping Mac");
    const future = new Date(Date.now() + 3_600_000);
    const local =
      [
        future.getFullYear(),
        String(future.getMonth() + 1).padStart(2, "0"),
        String(future.getDate()).padStart(2, "0")
      ].join("-") +
      "T" +
      String(future.getHours()).padStart(2, "0") +
      ":" +
      String(future.getMinutes()).padStart(2, "0");
    const date = document.getElementById("sched-date") as HTMLInputElement;
    date.value = local;
    date.dispatchEvent(new Event("input", { bubbles: true }));
    const label = document.getElementById("sched-name") as HTMLInputElement;
    label.value = "Night render";
    label.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    await click("Create schedule");
    expect(mock.invoke).toHaveBeenCalledWith("create_schedule", expect.anything());
    expect(document.body.textContent).toContain("Night render");
    await click("Disable");
    expect(appData.schedules[0]?.outcome).toBe("disabled");
    await click("Enable");
    expect(appData.schedules[0]?.outcome).toBe("pending");
    await click("Edit");
    expect(document.body.textContent).toContain("Save schedule");
    await click("Save schedule");
    expect(appData.schedules).toHaveLength(1);
    await click("Delete");
    expect(appData.schedules).toHaveLength(0);
  });
  it("shows and clears recent session history", async () => {
    appData.history.push({
      id: 777,
      startedAtUnixMs: 1_800_000_000_000,
      endedAtUnixMs: 1_800_003_600_000,
      actualSeconds: 3600,
      wakeMode: "both",
      timeoutSeconds: 3600,
      endReason: "manual"
    });
    await render();
    await click("History");
    expect(document.body.textContent).toContain("both");
    await click("Clear history");
    expect(mock.invoke).toHaveBeenCalledWith("clear_history");
    expect(document.body.textContent).toContain("No completed sessions");
  });
  it("accepts native wake/status, view and low-battery events", async () => {
    await render();
    const send = (name: string, payload: unknown) => {
      const listener = mock.listen.mock.calls.find((entry) => entry[0] === name)?.[1] as
        ((e: { payload: unknown }) => void) | undefined;
      if (!listener) throw new Error("Missing listener: " + name);
      listener({ payload });
    };
    send("wake-status", activeStatus("display"));
    await flush();
    expect(document.body.textContent).toContain("Display idle sleep is prevented.");
    expect(document.body.textContent).toContain("1h 23m");
    send("battery-warning", "Battery is low. The wake session is still active.");
    await flush();
    expect(document.querySelector('[role="status"]')?.textContent).toContain("Battery is low");
    send("show-view", "profiles");
    await flush();
    expect(document.querySelector(".mainhead h2")?.textContent).toBe("Profiles");
    send("show-view", "preferences");
    await flush();
    expect(document.querySelector(".mainhead h2")?.textContent).toBe("Settings");
    appData.preferences.theme = "dark";
    send("preferences-changed", null);
    await flush();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
  it("shows failure recovery when native session start and update fail", async () => {
    const original = mock.invoke.getMockImplementation();
    if (!original) throw new Error("Missing mock");
    mock.invoke.mockImplementation((name: string, args?: Record<string, unknown>) => {
      if (name === "start_wake_session") return Promise.reject(new Error("No native assertion"));
      return original(name, args);
    });
    await render();
    await click("Keep Mac Awake");
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("No native assertion");
    mock.invoke.mockImplementation(original);
    await click("Keep Mac Awake");
    expect(document.body.textContent).toContain("Mac stays awake.");
    mock.invoke.mockImplementation((name: string, args?: Record<string, unknown>) => {
      if (name === "update_wake_session")
        return Promise.reject(new Error("Could not replace assertion"));
      return original(name, args);
    });
    document.querySelector<HTMLInputElement>('input[aria-label="30 minutes"]')?.click();
    await flush();
    await click("Apply changes");
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not replace assertion"
    );
    expect(document.body.textContent).toContain("Mac stays awake.");
  });
  it("allows Stop Session even with an invalid staged custom duration", async () => {
    current = activeStatus("both");
    await render();
    document.querySelector<HTMLInputElement>('input[aria-label="Custom duration"]')?.click();
    await flush();
    const input = document.getElementById("custom-minutes") as HTMLInputElement;
    input.value = "2000";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    expect(button("Apply changes").disabled).toBe(true);
    expect(button("Stop Session").disabled).toBe(false);
    await click("Stop Session");
    expect(mock.invoke).toHaveBeenCalledWith("stop_caffeinate");
  });
  it("validates future schedules before writing to native storage", async () => {
    await render();
    await click("Schedules");
    await click("Create schedule");
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "future local date and time"
    );
    expect(mock.invoke).not.toHaveBeenCalledWith("create_schedule", expect.anything());
  });
  it("cancels profile and schedule editors without persisting", async () => {
    appData.profiles = [{ id: 33, name: "Existing", wakeMode: "system", timeoutSeconds: 3600 }];
    appData.schedules = [
      {
        id: 44,
        label: "Upcoming",
        kind: "start",
        wakeMode: "system",
        timeoutSeconds: 3600,
        triggerAtUnixMs: Date.now() + 7_200_000,
        outcome: "pending"
      }
    ];
    await render();
    await click("Profiles");
    await click("Edit");
    expect(document.body.textContent).toContain("Save profile");
    await click("Cancel edit");
    expect(document.body.textContent).toContain("Save current settings");
    await click("Schedules");
    await click("Edit");
    expect(document.body.textContent).toContain("Save schedule");
    await click("Cancel edit");
    expect(document.body.textContent).toContain("Create schedule");
    expect(mock.invoke).not.toHaveBeenCalledWith("create_schedule", expect.anything());
  });
  it("applies Command-Return keyboard shortcut", async () => {
    await render();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", metaKey: true, bubbles: true })
    );
    await flush();
    expect(mock.invoke).toHaveBeenCalledWith("start_wake_session", expect.anything());
  });
  it("shows indefinite active state and a fallback mode when status omits extended fields", async () => {
    current = {
      ...activeStatus("both"),
      wakeMode: undefined,
      timeoutSeconds: null,
      remainingSeconds: null,
      endsAtUnixMs: null,
      elapsedSeconds: null
    };
    await render();
    expect(document.body.textContent).toContain("Until you stop it");
    expect(document.body.textContent).toContain("System and display idle sleep are prevented.");
    expect(document.querySelector(".sw-horizon")?.getAttribute("aria-label")).toBe(
      "No bounded session progress"
    );
    expect(document.body.textContent).toContain("Time awake");
  });
  it("reports status polling failure without staying in Checking state", async () => {
    const orig = mock.invoke.getMockImplementation();
    if (!orig) throw new Error("Missing mock");
    mock.invoke.mockImplementation((name: string, args?: Record<string, unknown>) =>
      name === "get_caffeinate_status" ? Promise.reject("Status unavailable") : orig(name, args)
    );
    await render();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("Status unavailable");
    expect(document.body.textContent).not.toContain("Checking wake status.");
    expect(button("Keep Mac Awake").disabled).toBe(false);
  });
  it("recovers from corrupt preference reads without hiding the window", async () => {
    const orig = mock.invoke.getMockImplementation();
    if (!orig) throw new Error("Missing mock");
    mock.invoke.mockImplementation((name: string, args?: Record<string, unknown>) =>
      name === "get_app_data"
        ? Promise.reject(new Error("Preferences unreadable"))
        : orig(name, args)
    );
    await render();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Preferences unreadable"
    );
    expect(document.querySelector('nav[aria-label="Caffeinate sections"]')).not.toBeNull();
  });
  it("shows native preference-save failures with actionable errors", async () => {
    const orig = mock.invoke.getMockImplementation();
    if (!orig) throw new Error("Missing mock");
    mock.invoke.mockImplementation((name: string, args?: Record<string, unknown>) =>
      name === "save_settings"
        ? Promise.reject(new Error("Shortcut already registered"))
        : orig(name, args)
    );
    await render();
    await click("Settings");
    await click("Save preferences");
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Shortcut already registered"
    );
  });
  it("uses a default name when a valid one-shot schedule has no label", async () => {
    await render();
    await click("Schedules");
    const future = new Date(Date.now() + 2_400_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;
    const input = document.getElementById("sched-date") as HTMLInputElement;
    input.value = local;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    await click("Create schedule");
    expect(appData.schedules[0]?.label).toBe("Wake session");
  });
  it("persists preference toggles and both global shortcut strings", async () => {
    await render();
    await click("Settings");
    for (const id of ["autostart", "notify", "low"]) {
      const input = document.getElementById(id) as HTMLInputElement;
      input.click();
    }
    for (const [id, value] of [
      ["shortcut-toggle", "CommandOrControl+Shift+C"],
      ["shortcut-show", "CommandOrControl+Shift+O"]
    ]) {
      const input = document.getElementById(id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    await flush();
    await click("Save preferences");
    expect(appData.preferences.launchAtLogin).toBe(true);
    expect(appData.preferences.notifications).toBe(false);
    expect(appData.preferences.batteryWarning).toBe(false);
    expect(appData.preferences.toggleShortcut).toBe("CommandOrControl+Shift+C");
    expect(appData.preferences.showShortcut).toBe("CommandOrControl+Shift+O");
  });
  it("releases native listeners on unmount", async () => {
    const cleanups = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    let count = 0;
    mock.listen.mockImplementation(
      async (_name: string, _cb: (e: { payload: unknown }) => void) => {
        void _name;
        void _cb;
        const fn = cleanups[count] ?? (() => undefined);
        count += 1;
        return fn;
      }
    );
    await render();
    if (!component) throw new Error("Missing mounted component");
    await unmount(component);
    component = undefined;
    expect(count).toBe(4);
    expect(cleanups.every((fn) => fn.mock.calls.length === 1)).toBe(true);
  });
  it("uses accessible native selects with consistent chevrons on both screens", async () => {
    await render();
    await click("Settings");
    const appearance = document.getElementById("theme") as HTMLSelectElement;
    expect(appearance.tagName).toBe("SELECT");
    expect(appearance.closest(".select-shell")?.querySelector(".select-chevron")).not.toBeNull();
    expect(
      appearance.closest(".select-shell")?.querySelector("svg")?.getAttribute("aria-hidden")
    ).toBe("true");
    expect((document.getElementById("shortcut-toggle") as HTMLInputElement).type).toBe("text");
    expect((document.getElementById("shortcut-show") as HTMLInputElement).type).toBe("text");
    const footer = document.querySelector(".preferences-footer");
    expect(footer?.querySelector("button")?.textContent).toBe("Save preferences");
    expect(document.querySelector(".preferences-scroll")).not.toBeNull();
    await click("Schedules");
    const action = document.getElementById("sched-kind") as HTMLSelectElement;
    expect(action.closest(".select-shell")?.querySelector(".select-chevron")).not.toBeNull();
    action.value = "stop";
    action.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(action.value).toBe("stop");
  });
  it("closes the quick action menu on Escape and outside clicks", async () => {
    await render();
    const trigger = document.querySelector<HTMLButtonElement>(".traybtn");
    if (!trigger) throw new Error("Missing quick menu trigger");
    trigger.click();
    await flush();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("quick-menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    await flush();
    document.body.click();
    await flush();
    expect(document.getElementById("quick-menu")).toBeNull();
  });
  it("stores preference changes and applies theme", async () => {
    await render();
    await click("Settings");
    const sel = document.getElementById("theme") as HTMLSelectElement;
    sel.value = "dark";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    await click("Save preferences");
    expect(appData.preferences.theme).toBe("dark");
    await vi.waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
  });
});
