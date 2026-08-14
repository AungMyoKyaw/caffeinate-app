import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const failures = [];

function required(path) {
  const full = join(root, path);
  if (!existsSync(full)) {
    failures.push(`missing ${path}`);
    return "";
  }
  return readFileSync(full, "utf8");
}

function expect(source, pattern, message) {
  if (!pattern.test(source)) failures.push(message);
}

const packageSource = required("package.json");
const packageJson = packageSource ? JSON.parse(packageSource) : {};
const cargo = required("src-tauri/Cargo.toml");
const tauriConfig = required("src-tauri/tauri.conf.json");
const backend = required("src-tauri/src/caffeinate.rs");
const lifecycle = required("src-tauri/src/lib.rs");
const app = required("src/App.svelte");
const client = required("src/lib/caffeinate.ts");
const css = required("src/styles.css");
const viteConfig = required("vite.config.ts");
const vitestConfig = required("vitest.config.ts");
const readme = required("README.md");
required("scripts/check-focused-tests.mjs");

expect(packageSource, /"packageManager"\s*:\s*"bun@\d+\.\d+\.\d+-canary\.\d+\+[0-9a-f]{7,}"/, "packageManager must pin a Bun canary revision");
expect(packageSource, /"tauri:dev"\s*:\s*"bun tauri dev"/, "development must invoke Tauri through Bun");
expect(packageSource, /"tauri:build"\s*:\s*"bun tauri build/, "build must invoke Tauri through Bun");
expect(packageSource, /universal-apple-darwin/, "build must produce a universal macOS binary");
expect(packageSource, /"format:check"/, "formatter check command is missing");
expect(packageSource, /"lint"/, "lint command is missing");
expect(packageSource, /"typecheck"/, "Svelte/type check command is missing");
expect(packageSource, /"coverage"/, "coverage command is missing");
expect(packageSource, /"test:focus"/, "focused-test guard is missing");

const productionDependencies = Object.keys(packageJson.dependencies ?? {}).sort();
const allowedProductionDependencies = ["@tauri-apps/api", "svelte"];
if (JSON.stringify(productionDependencies) !== JSON.stringify(allowedProductionDependencies)) {
  failures.push(
    `production dependencies must stay lightweight: expected ${allowedProductionDependencies.join(", ")}, got ${productionDependencies.join(", ")}`
  );
}

expect(packageSource, /"tailwindcss"\s*:\s*"/, "Tailwind CSS dev dependency is missing");
expect(packageSource, /"@tailwindcss\/vite"\s*:\s*"/, "@tailwindcss/vite dev dependency is missing");

for (const forbidden of ["react", "react-dom", "@vitejs/plugin-react"]) {
  if (packageSource.includes(`"${forbidden}"`)) failures.push(`${forbidden} must be removed from the Svelte rewrite`);
}

expect(packageSource, /"svelte"\s*:\s*"5\./, "Svelte 5 dependency is missing");
expect(viteConfig, /@sveltejs\/vite-plugin-svelte/, "Vite must use the official Svelte plugin");
expect(tauriConfig, /"signingIdentity"\s*:\s*"-"/, "macOS app must be ad-hoc signed");
expect(cargo, /tauri\s*=\s*\{?[^\n]*version\s*=\s*"2/, "Cargo must use Tauri 2");
expect(tauriConfig, /"targets"\s*:\s*\[\s*"app"\s*,\s*"dmg"\s*\]/s, "bundle targets must be app and dmg");
expect(tauriConfig, /"identifier"\s*:\s*"ai\.learningflow\.caffeinate"/, "bundle identifier is missing");
expect(backend, /\/usr\/bin\/caffeinate/, "backend must call the fixed macOS caffeinate binary");
expect(backend, /Command::new\(CAFFEINATE_PATH\)/, "backend must spawn directly with Command::new");
expect(backend, /try_wait\(/, "backend must reconcile timed child exit");
expect(backend, /\.child\s*\.\s*kill\(/s, "backend must kill the child on stop");
expect(lifecycle, /RunEvent::Exit/, "application exit cleanup is missing");
expect(lifecycle, /cleanup\(/, "exit event must call cleanup");
expect(backend, /#\[serde\(rename_all = "camelCase"\)\]/, "Rust command/status contract must remain camelCase");
for (const field of ["keepDisplayAwake", "timeoutSeconds", "startedAtUnixMs", "remainingSeconds"]) {
  if (!client.includes(field)) failures.push(`frontend Tauri contract is missing camelCase field ${field}`);
}
if (/keep_display_awake|timeout_seconds|started_at_unix_ms|remaining_seconds/.test(client + app)) {
  failures.push("frontend Tauri payload/status fields must match Rust camelCase serde contract");
}
expect(app, /aria-live="polite"/, "status updates need an aria-live region");
expect(app, /role="alert"/, "errors need an alert region");
expect(app, /metaKey.*Enter|Enter.*metaKey/s, "Command-Return keyboard action is missing");
expect(app, /DURATION_PRESETS/, "duration presets must remain visible in the Svelte UI");
expect(app, /focus-visible:/, "visible keyboard focus styling is missing");
expect(css, /prefers-reduced-motion/, "reduced motion handling is missing");
expect(css, /prefers-color-scheme:\s*dark/, "dark appearance support is missing");
expect(vitestConfig, /statements:\s*100/, "coverage must require 100% statements");
expect(vitestConfig, /branches:\s*100/, "coverage must require 100% branches");
expect(vitestConfig, /functions:\s*100/, "coverage must require 100% functions");
expect(vitestConfig, /lines:\s*100/, "coverage must require 100% lines");
expect(readme, /bun install/, "README must use bun install");
expect(readme, /bun tauri dev/, "README must document bun tauri dev");
expect(readme, /bun run verify/, "README must document the aggregate verification command");

for (const file of [backend, lifecycle, app, css, packageSource]) {
  if (/tauri-plugin-shell|tauri_plugin_shell/.test(file)) {
    failures.push("shell plugin is forbidden for this fixed-command app");
  }
  if (/TrayIcon|SystemTray|trayIcon|menu bar app/i.test(file)) {
    failures.push("tray or menu-bar implementation is forbidden");
  }
}

if (/linear-gradient|radial-gradient|backdrop-filter/.test(css)) {
  failures.push("gradients or glass effects are forbidden in the Carbon + Volt control surface");
}

if (/@import\s+url|fonts\.googleapis|fonts\.gstatic/.test(css)) {
  failures.push("remote fonts are forbidden; use the macOS system font stack");
}

const frontendSource = [app, required("src/main.ts"), client].join("\n");
if (/\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(/.test(frontendSource)) {
  failures.push("network APIs are forbidden in this local-only utility");
}

const iconDir = join(root, "src-tauri/icons");
if (!existsSync(iconDir) || readdirSync(iconDir).length < 4) {
  failures.push("macOS icon set is incomplete");
}

if (failures.length > 0) {
  console.error(`Contract failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Contract passed: Svelte frontend, fixed-process safety, local-only scope, coverage policy, and lightweight dependency boundary are intact.");
