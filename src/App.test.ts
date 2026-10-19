import { tick, unmount } from "svelte";
import { mount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.svelte";
import type { CaffeinateClient, CaffeinateStatus, StartOptions } from "./lib/caffeinate";

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

const components: ReturnType<typeof mount>[] = [];

function makeClient(statusResult: CaffeinateStatus = idle) {
  const start = vi
    .fn<(options: StartOptions) => Promise<CaffeinateStatus>>()
    .mockResolvedValue(active);
  const stop = vi.fn<() => Promise<CaffeinateStatus>>().mockResolvedValue(idle);
  const status = vi.fn<() => Promise<CaffeinateStatus>>().mockResolvedValue(statusResult);
  return { client: { start, stop, status }, start, stop, status };
}

async function render(client: CaffeinateClient, pollIntervalMs = 100_000) {
  document.body.innerHTML = '<div id="target"></div>';
  const target = document.getElementById("target");
  if (!target) throw new Error("test mount target missing");
  const component = mount(App, { target, props: { client, pollIntervalMs } });
  components.push(component);
  await Promise.resolve();
  await tick();
  return target;
}

function powerButton(): HTMLButtonElement {
  const button = document.querySelector<HTMLButtonElement>(".power-control");
  if (!button) throw new Error("power button missing");
  return button;
}

afterEach(async () => {
  while (components.length > 0) {
    const component = components.pop();
    if (component) await unmount(component);
  }
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("App", () => {
  it("reconciles into the ready state and previews the safe default command", async () => {
    const { client, status } = makeClient();
    const target = await render(client);

    expect(status).toHaveBeenCalledOnce();
    expect(target.textContent).toContain("Mac can sleep.");
    expect(powerButton().getAttribute("aria-label")).toBe("Keep Mac Awake");
    expect(target.textContent).toContain("/usr/bin/caffeinate -i -w <app-pid>");
    expect(target.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it("presents duration once without a redundant selected-value pill", async () => {
    const { client } = makeClient();
    const target = await render(client);

    expect(target.querySelector('[data-testid="selected-duration-pill"]')).toBeNull();
    expect(target.querySelector('[aria-label="Wake session duration"]')).not.toBeNull();
    expect(target.querySelectorAll('input[name="duration"]')).toHaveLength(6);
    expect(target.querySelector('input[aria-label="Custom duration"]')).not.toBeNull();
  });

  it("groups state copy and the primary action in one compact region", async () => {
    const { client } = makeClient();
    const target = await render(client);
    const region = target.querySelector('[data-testid="status-action"]');

    expect(region).not.toBeNull();
    expect(region?.textContent).toContain("Mac can sleep.");
    expect(region?.querySelector(".power-control")).not.toBeNull();
  });

  it("starts with selected display and duration options", async () => {
    const { client, start } = makeClient();
    await render(client);

    document.querySelector<HTMLInputElement>('[aria-label="1 hour"]')?.click();
    document.querySelectorAll<HTMLInputElement>('input[name="wakeMode"]')[2]?.click();
    powerButton().click();
    await Promise.resolve();
    await tick();

    expect(start).toHaveBeenCalledWith({ keepDisplayAwake: true, timeoutSeconds: 3600 });
    expect(document.body.textContent).toContain("Mac stays awake.");
  });

  it("stops an existing active session", async () => {
    const { client, stop } = makeClient(active);
    await render(client);

    powerButton().click();
    await Promise.resolve();
    await tick();

    expect(stop).toHaveBeenCalledOnce();
    expect(document.body.textContent).toContain("Mac can sleep.");
  });

  it("maps Command-Return to the primary action and ignores ordinary Return", async () => {
    const { client, start } = makeClient();
    await render(client);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(start).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
    expect(start).not.toHaveBeenCalled();

    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      metaKey: true,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
    await Promise.resolve();
    await tick();

    expect(event.defaultPrevented).toBe(true);
    expect(start).toHaveBeenCalledOnce();
  });

  it("shows an Error failure from initial status reconciliation", async () => {
    const { client, status } = makeClient();
    status.mockRejectedValueOnce(new Error("status unavailable"));
    const target = await render(client);

    expect(target.querySelector('[role="alert"]')?.textContent).toContain("status unavailable");
  });

  it("stringifies a non-Error reconciliation failure", async () => {
    const { client, status } = makeClient();
    status.mockRejectedValueOnce("offline");
    const target = await render(client);

    expect(target.querySelector('[role="alert"]')?.textContent).toContain("offline");
  });

  it("shows both Error and non-Error action failures and remains idle", async () => {
    const { client, start } = makeClient();
    await render(client);

    start.mockRejectedValueOnce(new Error("cannot start"));
    powerButton().click();
    await Promise.resolve();
    await tick();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("cannot start");

    start.mockRejectedValueOnce("denied");
    powerButton().click();
    await Promise.resolve();
    await tick();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("denied");
  });

  it("polls active status and reconciles natural timeout", async () => {
    vi.useFakeTimers();
    const { client, status } = makeClient(active);
    await render(client, 1000);
    status.mockResolvedValueOnce(idle);

    await vi.advanceTimersByTimeAsync(1000);
    await tick();

    expect(status).toHaveBeenCalledTimes(2);
    expect(document.body.textContent).toContain("Mac can sleep.");
  });

  it("does not trigger an action while the initial status request is unresolved", async () => {
    let resolveStatus: ((value: CaffeinateStatus) => void) | undefined;
    const statusPromise = new Promise<CaffeinateStatus>((resolve) => {
      resolveStatus = resolve;
    });
    const { client, status, start } = makeClient();
    status.mockReturnValueOnce(statusPromise);
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById("target");
    if (!target) throw new Error("test mount target missing");
    const component = mount(App, { target, props: { client, pollIntervalMs: 100_000 } });
    components.push(component);

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", metaKey: true, bubbles: true, cancelable: true })
    );
    expect(start).not.toHaveBeenCalled();

    resolveStatus?.(idle);
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain("Mac can sleep.");
    });
  });

  it("ignores repeated actions while a transition is busy", async () => {
    const { client, start } = makeClient();
    await render(client);
    start.mockReturnValueOnce(new Promise<CaffeinateStatus>(() => undefined));

    powerButton().click();
    await tick();
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        metaKey: true,
        bubbles: true,
        cancelable: true
      })
    );

    expect(start).toHaveBeenCalledOnce();
  });
});
