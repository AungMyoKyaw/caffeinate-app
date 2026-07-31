# Caffeinate Ralph Loop

## Objective

Ship a small, trustworthy macOS Tauri application that owns the built-in `caffeinate` process and uses an Impeccable Operate-mode interface.

## Pass 0 — Baseline and contract

- Lock product scope, architecture, visual direction, and package versions.
- Add a contract validator before the implementation exists.
- Gate: validator fails for the intended missing files and markers.

## Pass 1 — Process safety

- Implement fixed-binary argument construction, timeout validation, child ownership, stale-process reconciliation, idempotent start, stop, and exit cleanup.
- Gate: backend contract markers and unit tests exist; no shell plugin or arbitrary shell string.

## Pass 2 — Operable interface

- Implement typed commands, polling, keyboard action, error state, disabled transitions, duration, and display choice.
- Gate: frontend pure-function tests and accessibility contract markers exist.

## Pass 3 — Impeccable finish

- Render deterministic desktop and compact fixtures.
- Audit hierarchy, copy, contrast, overflow, focus, responsive behavior, AI-default tells, and state clarity.
- Apply one repair batch and render one confirmation batch.
- Gate: no P0/P1 visual defect remains.

## Pass 4 — Release preflight

- Run every available deterministic check.
- Record unavailable native checks without pretending they passed.
- Archive from Git, inspect contents, and calculate SHA-256.
- Gate: source archive is clean, reproducible, and documented.
