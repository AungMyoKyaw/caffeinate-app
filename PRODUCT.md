# Caffeinate — Product Context

## Product

Caffeinate is a macOS-only desktop utility that prevents idle system sleep by managing the built-in `/usr/bin/caffeinate` command. It is a normal desktop window, never a menu bar application.

## User

A Mac user who needs a long build, upload, download, render, presentation, remote session, or coding-agent run to continue without the machine sleeping.

## Core job

Make the Mac stay awake, make the active state unmistakable, and stop cleanly when the user asks or closes the application.

## Surface mode

**Operate.** The interface exists to complete one task quickly and verify its current state.

## Product principles

- One primary action. No dashboard, navigation, account, analytics, or onboarding.
- Native truth over abstraction: show what is blocked and show the exact command.
- Safe by default: prevent idle system sleep; keeping the display on is optional.
- Clear lifecycle: stopping or quitting the app releases the assertion.
- Local only: no network requests, telemetry, accounts, or stored personal data.
- Keyboard operable and readable in both light and dark macOS appearances.

## Version 1 scope

- Start and stop a `caffeinate` session.
- Optional display-awake assertion.
- Duration presets: Until stopped, 30 minutes, 1 hour, 2 hours, 4 hours.
- Live active/remaining status.
- Automatic stale-process reconciliation.
- Cleanup on application exit, plus a `-w <app-pid>` fail-safe.
- macOS application bundle configuration.

## Explicit non-goals

- Menu bar or tray behavior.
- Launch at login.
- Scheduling, calendars, recurring automation, or remote control.
- Preventing lid-close sleep.
- Hidden background operation after the application exits.
- Shell plugins or arbitrary command execution.

## Voice

Calm, literal, compact. No hype, jokes, productivity claims, or vague labels.

## Anti-references

- Card grids and card-inside-card layouts.
- Purple gradients, glassmorphism, glowing blobs, excessive shadows.
- Pill-shaped controls everywhere.
- Decorative charts or fake activity indicators.
- Generic copy such as “Unlock your potential” or “Boost productivity.”
