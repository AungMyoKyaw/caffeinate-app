import type { CaffeinateStatus } from "./caffeinate";
import { formatRemaining } from "./format";

export interface StateCopy {
  statusLabel: string;
  title: string;
  detail: string;
  actionLabel: string;
}

export function getStateCopy(
  status: CaffeinateStatus,
  checking: boolean,
  busy: boolean
): StateCopy {
  if (checking) {
    return {
      statusLabel: "Checking",
      title: "Checking wake status.",
      detail: "Reading the current macOS sleep assertion.",
      actionLabel: "Checking"
    };
  }

  if (status.active) {
    const displayDetail = status.keepDisplayAwake
      ? "System and display sleep are blocked."
      : "System sleep is blocked. The display may still turn off.";

    return {
      statusLabel: busy ? "Stopping" : "Awake",
      title: "Mac stays awake.",
      detail: `${displayDetail} ${formatRemaining(status.remainingSeconds)}.`,
      actionLabel: busy ? "Stopping" : "Allow Sleep"
    };
  }

  return {
    statusLabel: busy ? "Starting" : "Ready",
    title: "Mac can sleep.",
    detail: "Start a wake session before a long task.",
    actionLabel: busy ? "Starting" : "Keep Mac Awake"
  };
}
