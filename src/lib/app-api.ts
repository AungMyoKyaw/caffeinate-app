import { invoke } from "@tauri-apps/api/core";
import type { CaffeinateStatus } from "./caffeinate";

export type WakeMode = "system" | "display" | "both";
export type Theme = "light" | "dark" | "system";
export type View = "session" | "profiles" | "schedules" | "recent" | "preferences";
export interface SessionOptions {
  wakeMode: WakeMode;
  timeoutSeconds: number | null;
}
export interface Preferences extends SessionOptions {
  theme: Theme;
  launchAtLogin: boolean;
  notifications: boolean;
  batteryWarning: boolean;
  toggleShortcut: string;
  showShortcut: string;
}
export interface Profile extends SessionOptions {
  id: number;
  name: string;
}
export interface Schedule extends SessionOptions {
  id: number;
  label: string;
  kind: "start" | "stop";
  triggerAtUnixMs: number;
  outcome: "pending" | "disabled" | "completed" | "missed" | "skipped" | "failed";
}
export interface HistoryEntry {
  id: number;
  startedAtUnixMs: number;
  endedAtUnixMs: number;
  actualSeconds: number;
  wakeMode: WakeMode;
  timeoutSeconds: number | null;
  endReason: string;
}
export interface AppData {
  schemaVersion: number;
  preferences: Preferences;
  profiles: Profile[];
  schedules: Schedule[];
  history: HistoryEntry[];
  scheduledSessionId: number | null;
}
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  wakeMode: "system",
  timeoutSeconds: null,
  launchAtLogin: false,
  notifications: true,
  batteryWarning: true,
  toggleShortcut: "",
  showShortcut: ""
};
export function freshData(): AppData {
  return {
    schemaVersion: 1,
    preferences: { ...DEFAULT_PREFERENCES },
    profiles: [],
    schedules: [],
    history: [],
    scheduledSessionId: null
  };
}
export function validateDuration(value: number | null): boolean {
  return value === null || (Number.isInteger(value) && value >= 60 && value <= 86_400);
}
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Until stopped";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}
export function formatClock(ms: number | null): string {
  if (ms == null) return "Until stopped";
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(ms);
}
export function wakeCommandPreview(mode: WakeMode, seconds: number | null): string {
  const args: string[] = [];
  if (mode !== "display") args.push("-i");
  if (mode !== "system") args.push("-d");
  if (seconds !== null) args.push("-t", String(seconds));
  args.push("-w", "<app-pid>");
  return `/usr/bin/caffeinate ${args.join(" ")}`;
}
export const wakeApi = {
  start: (options: SessionOptions) => invoke<CaffeinateStatus>("start_wake_session", { options }),
  update: (options: SessionOptions, expectedRevision?: number) =>
    invoke<CaffeinateStatus>("update_wake_session", { options, expectedRevision }),
  getData: () => invoke<AppData>("get_app_data"),
  setPreferences: (preferences: Preferences) => invoke<AppData>("save_settings", { preferences }),
  saveProfile: (profile: Profile) => invoke<AppData>("save_profile", { profile }),
  deleteProfile: (id: number) => invoke<AppData>("delete_profile", { id }),
  createSchedule: (schedule: Schedule) => invoke<AppData>("create_schedule", { schedule }),
  deleteSchedule: (id: number) => invoke<AppData>("delete_schedule", { id }),
  setScheduleEnabled: (id: number, enabled: boolean) =>
    invoke<AppData>("set_schedule_enabled", { id, enabled }),
  clearHistory: () => invoke<AppData>("clear_history")
};
