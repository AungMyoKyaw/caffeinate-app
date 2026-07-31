export interface DurationPreset {
  label: string;
  seconds: number | null;
}

export const DURATION_PRESETS: readonly DurationPreset[] = [
  { label: "Until stopped", seconds: null },
  { label: "30 minutes", seconds: 30 * 60 },
  { label: "1 hour", seconds: 60 * 60 },
  { label: "2 hours", seconds: 2 * 60 * 60 },
  { label: "4 hours", seconds: 4 * 60 * 60 }
] as const;

export function serializeDuration(seconds: number | null): string {
  return seconds === null ? "until-stopped" : String(seconds);
}

export function parseDuration(value: string): number | null {
  if (value === "until-stopped") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 60 || parsed > 86_400) {
    throw new Error("Duration must be between one minute and 24 hours.");
  }

  return parsed;
}

export function formatRemaining(seconds: number | null): string {
  if (seconds === null) return "Until you stop it";
  if (seconds <= 0) return "Finishing…";

  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.ceil((seconds % 3_600) / 60);

  if (hours === 0) return `${minutes} min remaining`;
  if (minutes === 0) return `${hours} hr remaining`;
  return `${hours} hr ${minutes} min remaining`;
}

export function buildCommandPreview(
  keepDisplayAwake: boolean,
  timeoutSeconds: number | null
): string {
  const args = ["/usr/bin/caffeinate", "-i"];
  if (keepDisplayAwake) args.push("-d");
  if (timeoutSeconds !== null) args.push("-t", String(timeoutSeconds));
  args.push("-w", "<app-pid>");
  return args.join(" ");
}
