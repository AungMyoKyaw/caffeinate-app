# Contributing

Thanks for improving Caffeinate.

## Scope

Keep changes aligned with `PRODUCT.md`. Caffeinate is a local macOS utility for one owned `/usr/bin/caffeinate` process. Do not add accounts, analytics, arbitrary shell execution, remote services, menu-bar mode, scheduling, or unrelated product features without an explicit product decision.

## Setup

```bash
bun install --frozen-lockfile
bun tauri dev
```

## Before opening a pull request

```bash
bun run verify
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

UI changes should also be visually checked in the Tauri app at the default and minimum window sizes, in light and dark appearance, with keyboard navigation and reduced motion.

## Dependencies

Prefer platform/framework capabilities. Every new production dependency needs a concrete product need, compatibility/security review, and footprint justification. Preserve Bun and the committed lockfile.

## Commits

Use focused commits that describe the product or engineering change. Do not commit secrets, local paths, generated `target/`, `dist/`, or dependency folders.
