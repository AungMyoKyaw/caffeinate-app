export type DurationPreset = {
  id: string;
  label: string;
  shortLabel: string;
  seconds: number | null;
};

export const DURATION_PRESETS: readonly DurationPreset[] = [
  { id: "until-stopped", label: "Until stopped", shortLabel: "Until stopped", seconds: null },
  { id: "30-minutes", label: "30 minutes", shortLabel: "30m", seconds: 30 * 60 },
  { id: "1-hour", label: "1 hour", shortLabel: "1h", seconds: 60 * 60 },
  { id: "2-hours", label: "2 hours", shortLabel: "2h", seconds: 2 * 60 * 60 },
  { id: "4-hours", label: "4 hours", shortLabel: "4h", seconds: 4 * 60 * 60 }
] as const;

export function formatRemaining(seconds: number | null): string {
  if (seconds === null) return "Until stopped";
  if (seconds <= 0) return "Ending now";

  const totalMinutes = Math.ceil(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m remaining`;
  if (minutes === 0) return `${hours}h remaining`;
  return `${hours}h ${minutes}m remaining`;
}

export function buildCommandPreview(keepDisplayAwake: boolean, timeoutSeconds: number | null): string {
  const args = ["-i"];
  if (keepDisplayAwake) args.push("-d");
  if (timeoutSeconds !== null) args.push("-t", String(timeoutSeconds));
  args.push("-w", "<app-pid>");
  return `/usr/bin/caffeinate ${args.join(" ")}`;
}
