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

export type InvokeLike = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

export interface CaffeinateClient {
  start(options: StartOptions): Promise<CaffeinateStatus>;
  stop(): Promise<CaffeinateStatus>;
  status(): Promise<CaffeinateStatus>;
}

export const EMPTY_STATUS: CaffeinateStatus = {
  active: false,
  keepDisplayAwake: false,
  startedAtUnixMs: null,
  timeoutSeconds: null,
  remainingSeconds: null,
  command: ""
};

export function createCaffeinateClient(call: InvokeLike): CaffeinateClient {
  return {
    start(options) {
      return call<CaffeinateStatus>("start_caffeinate", { options });
    },
    stop() {
      return call<CaffeinateStatus>("stop_caffeinate");
    },
    status() {
      return call<CaffeinateStatus>("get_caffeinate_status");
    }
  };
}

export const caffeinateClient = createCaffeinateClient(invoke as InvokeLike);
