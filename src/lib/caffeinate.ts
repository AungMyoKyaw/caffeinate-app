import { invoke } from "@tauri-apps/api/core";

export interface StartOptions {
  keepDisplayAwake: boolean;
  timeoutSeconds: number | null;
}

export interface CaffeinateStatus {
  active: boolean;
  keepDisplayAwake: boolean;
  startedAtUnixMs: number | null;
  timeoutSeconds: number | null;
  remainingSeconds: number | null;
  command: string;
}

export const EMPTY_STATUS: CaffeinateStatus = {
  active: false,
  keepDisplayAwake: false,
  startedAtUnixMs: null,
  timeoutSeconds: null,
  remainingSeconds: null,
  command: ""
};

export async function startCaffeinate(
  options: StartOptions
): Promise<CaffeinateStatus> {
  return invoke<CaffeinateStatus>("start_caffeinate", { options });
}

export async function stopCaffeinate(): Promise<CaffeinateStatus> {
  return invoke<CaffeinateStatus>("stop_caffeinate");
}

export async function getCaffeinateStatus(): Promise<CaffeinateStatus> {
  return invoke<CaffeinateStatus>("get_caffeinate_status");
}
