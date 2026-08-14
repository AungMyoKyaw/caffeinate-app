# Dependency Decisions

## Production dependencies

### `svelte` 5.56.9

**Use:** Replaces React/React DOM as the application UI framework.

**Why platform/native APIs are insufficient:** Tauri provides the native shell and IPC boundary, not a declarative frontend rendering model. The existing application already required a UI framework; the rewrite changes that framework rather than introducing a new product capability.

**Compatibility:** Paired with `@sveltejs/vite-plugin-svelte` 7.3.0 and Vite 8.1.5 based on the current plugin peer range researched before implementation.

**Security/maintenance:** No remote runtime service is required. The repository keeps the fixed Tauri command boundary and local-only CSP.

**Runtime impact:** This replaces both `react` and `react-dom`. No UI kit, router, state library, icon library, font package, or animation library was added. Tailwind CSS provides the styling utilities at build time only (see below).

**License:** MIT.

### `@tauri-apps/api` 2.11.1

Existing dependency retained for typed frontend-to-Tauri IPC. No scope expansion.

## Development-only dependencies

The rewrite adds Svelte compilation/checking, formatter, lint, coverage tooling, and the Tailwind CSS toolchain. None of these packages are application runtime dependencies; they are intentionally kept out of `dependencies` and do not ship in the production bundle.

### `tailwindcss` 4.x + `@tailwindcss/vite` 4.x

**Use:** Build-time CSS utility framework. Generates the production stylesheet from the `@theme` block in `src/styles.css` and the utility classes used in `App.svelte`.

**Why:** Replaces a hand-written vanilla CSS file of ~600 lines. Tailwind v4's CSS-first `@theme` configuration lets the Carbon + Volt design tokens map directly to utility class names (`bg-paper`, `text-ink`, `border-volt-bright`, etc.) without a JavaScript config file.

**Runtime impact:** Tailwind compiles down to a single ~19 kB CSS file (≈5 kB gzipped). No Tailwind JavaScript is loaded at runtime. This is comparable in size to the prior hand-written stylesheet and produces no measurable runtime overhead.

**License:** MIT.

### `esbuild`

**Use:** Required by `@tailwindcss/vite` for the build pipeline's transformer step.

**License:** MIT.

### TypeScript 6.0.3

TypeScript is pinned to 6.0.3 even though the repository previously listed 7.0.2. Current `svelte-check` and `typescript-eslint` peer ranges researched during this rewrite support TypeScript 6 but not TypeScript 7, so 6.0.3 is the compatible quality-tooling choice for this branch.

## Lockfile blocker

`bun.lock` cannot be regenerated in the current sandbox because Bun is not installed and outbound package downloads are blocked. The manifest is complete, but the committed lockfile still represents the previous React dependency graph. The dependency/lockfile quality gate therefore remains `BLOCKED`; it must not be described as passing until `bun install` is run with Bun 1.3.14 and the resulting lockfile diff is inspected.
