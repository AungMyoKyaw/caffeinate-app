# Dependency Decisions

## Production dependencies

### `svelte` 5.56.9

**Use:** Replaces React/React DOM as the application UI framework.

**Why platform/native APIs are insufficient:** Tauri provides the native shell and IPC boundary, not a declarative frontend rendering model. The existing application already required a UI framework; the rewrite changes that framework rather than introducing a new product capability.

**Compatibility:** Paired with `@sveltejs/vite-plugin-svelte` 7.3.0 and Vite 8.1.5 based on the current plugin peer range researched before implementation.

**Security/maintenance:** No remote runtime service is required. The repository keeps the fixed Tauri command boundary and local-only CSP.

**Runtime impact:** This replaces both `react` and `react-dom`. No UI kit, router, state library, icon library, font package, or animation library was added. Actual production bundle size must be measured after the dependency graph can be installed; this sandbox cannot perform that install.

**License:** MIT.

### `@tauri-apps/api` 2.11.1

Existing dependency retained for typed frontend-to-Tauri IPC. No scope expansion.

## Development-only dependencies

The rewrite adds Svelte compilation/checking, formatter, lint, and coverage tooling. These packages are not application runtime dependencies and are intentionally kept out of `dependencies`.

TypeScript is pinned to 6.0.3 even though the repository previously listed 7.0.2. Current `svelte-check` and `typescript-eslint` peer ranges researched during this rewrite support TypeScript 6 but not TypeScript 7, so 6.0.3 is the compatible quality-tooling choice for this branch.

## Lockfile blocker

`bun.lock` cannot be regenerated in the current sandbox because Bun is not installed and outbound package downloads are blocked. The manifest is complete, but the committed lockfile still represents the previous React dependency graph. The dependency/lockfile quality gate therefore remains `BLOCKED`; it must not be described as passing until `bun install` is run with Bun 1.3.14 and the resulting lockfile diff is inspected.
