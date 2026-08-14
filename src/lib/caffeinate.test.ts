import { describe, expect, it, vi } from "vitest";
import { createCaffeinateClient, EMPTY_STATUS, type CaffeinateStatus, type InvokeLike } from "./caffeinate";

const activeStatus: CaffeinateStatus = {
  active: true,
  keepDisplayAwake: true,
  startedAtUnixMs: 1_700_000_000_000,
  timeoutSeconds: 3600,
  remainingSeconds: 3600,
  command: "/usr/bin/caffeinate -i -d -t 3600 -w 42"
};

describe("createCaffeinateClient", () => {
  it("maps start, stop, and status to the exact Tauri commands", async () => {
    const call = vi.fn<InvokeLike>().mockResolvedValue(activeStatus);
    const client = createCaffeinateClient(call);
    const options = { keepDisplayAwake: true, timeoutSeconds: 3600 };

    await expect(client.start(options)).resolves.toEqual(activeStatus);
    await expect(client.stop()).resolves.toEqual(activeStatus);
    await expect(client.status()).resolves.toEqual(activeStatus);

    expect(call).toHaveBeenNthCalledWith(1, "start_caffeinate", { options });
    expect(call).toHaveBeenNthCalledWith(2, "stop_caffeinate");
    expect(call).toHaveBeenNthCalledWith(3, "get_caffeinate_status");
  });

  it("keeps an immutable-looking empty status value for initial UI state", () => {
    expect(EMPTY_STATUS).toEqual({
      active: false,
      keepDisplayAwake: false,
      startedAtUnixMs: null,
      timeoutSeconds: null,
      remainingSeconds: null,
      command: ""
    });
  });
});
