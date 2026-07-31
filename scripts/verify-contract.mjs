import { readFileSync, existsSync, readdirSync } from "node:fs";
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

const packageJson = required("package.json");
const cargo = required("src-tauri/Cargo.toml");
const tauriConfig = required("src-tauri/tauri.conf.json");
const backend = required("src-tauri/src/caffeinate.rs");
const lifecycle = required("src-tauri/src/lib.rs");
const app = required("src/App.tsx");
const css = required("src/styles.css");
const readme = required("README.md");

expect(packageJson, /"packageManager"\s*:\s*"bun@/, "packageManager must pin Bun");
expect(packageJson, /"tauri:dev"\s*:\s*"bun tauri dev"/, "development must invoke Tauri through Bun");
expect(packageJson, /"tauri:build"\s*:\s*"bun tauri build/, "build must invoke Tauri through Bun");
expect(packageJson, /universal-apple-darwin/, "build must produce a universal macOS binary");
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
expect(app, /aria-live="polite"/, "status updates need an aria-live region");
expect(app, /role="alert"/, "errors need an alert region");
expect(app, /metaKey.*Enter|Enter.*metaKey/s, "Command-Return keyboard action is missing");
expect(css, /:focus-visible/, "visible keyboard focus styling is missing");
expect(css, /prefers-reduced-motion/, "reduced motion handling is missing");
expect(readme, /bun install/, "README must use bun install");
expect(readme, /bun tauri dev/, "README must document bun tauri dev");

for (const file of [backend, lifecycle, app, css, packageJson]) {
  if (/tauri-plugin-shell|tauri_plugin_shell/.test(file)) {
    failures.push("shell plugin is forbidden for this fixed-command app");
  }
  if (/TrayIcon|SystemTray|trayIcon|menu bar app/i.test(file)) {
    failures.push("tray or menu-bar implementation is forbidden");
  }
}

if (/linear-gradient|radial-gradient|backdrop-filter/.test(css)) {
  failures.push("AI-default gradients or glass effects are forbidden");
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

console.log("Contract passed: Caffeinate repository matches the product, process, packaging, and UI constraints.");
