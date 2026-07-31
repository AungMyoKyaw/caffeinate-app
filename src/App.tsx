import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMPTY_STATUS,
  getCaffeinateStatus,
  startCaffeinate,
  stopCaffeinate,
  type CaffeinateStatus
} from "./lib/caffeinate";
import {
  buildCommandPreview,
  DURATION_PRESETS,
  formatRemaining,
  parseDuration,
  serializeDuration
} from "./lib/format";

function PowerGlyph({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="power-glyph"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M12 3v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7.2 5.9a8 8 0 1 0 9.6 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {active ? <circle cx="12" cy="12" r="1.4" fill="currentColor" /> : null}
    </svg>
  );
}

function App() {
  const [status, setStatus] = useState<CaffeinateStatus>(EMPTY_STATUS);
  const [keepDisplayAwake, setKeepDisplayAwake] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const nextStatus = await getCaffeinateStatus();
      setStatus(nextStatus);
      setError(null);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!status.active) return undefined;

    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [refreshStatus, status.active]);

  const toggleSession = useCallback(async () => {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const nextStatus = status.active
        ? await stopCaffeinate()
        : await startCaffeinate({ keepDisplayAwake, timeoutSeconds });
      setStatus(nextStatus);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  }, [busy, keepDisplayAwake, status.active, timeoutSeconds]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "Enter") {
        event.preventDefault();
        void toggleSession();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSession]);

  const activeDetail = useMemo(() => {
    if (!status.active) return "Start a session before a long task.";

    const displayDetail = status.keepDisplayAwake
      ? "The system and display will remain awake."
      : "The system stays awake while the display may turn off.";

    return `${displayDetail} ${formatRemaining(status.remainingSeconds)}.`;
  }, [status]);

  const command = status.active
    ? status.command
    : buildCommandPreview(keepDisplayAwake, timeoutSeconds);

  return (
    <div className={`app-shell${status.active ? " is-active" : ""}`}>
      <header className="app-header">
        <div>
          <p className="product-name">Caffeinate</p>
          <p className="product-note">Local macOS utility</p>
        </div>
        <div className="privacy-note">
          <span aria-hidden="true" className="privacy-mark" />
          No network
        </div>
      </header>

      <main>
        <section className="state-field" aria-live="polite" aria-atomic="true">
          <div className="status-line">
            <span className="status-signal" aria-hidden="true" />
            <span>{status.active ? "Awake" : "Ready"}</span>
          </div>
          <h1>{status.active ? "Idle sleep is blocked." : "Sleep is allowed."}</h1>
          <p className="state-detail">{activeDetail}</p>
        </section>

        {error ? (
          <div className="error-message" role="alert">
            <strong>Could not update the sleep assertion.</strong>
            <span>{error}</span>
          </div>
        ) : null}

        <button
          className="primary-action"
          type="button"
          onClick={() => void toggleSession()}
          disabled={busy}
        >
          <PowerGlyph active={status.active} />
          <span>{busy ? "Checking…" : status.active ? "Allow Sleep" : "Keep Mac Awake"}</span>
          <kbd>⌘↵</kbd>
        </button>

        <section className="controls" aria-label="Caffeinate settings">
          <div className="control-row">
            <div className="control-copy">
              <label htmlFor="duration">Duration</label>
              <span>Stop automatically, or keep running until you stop it.</span>
            </div>
            <select
              id="duration"
              value={serializeDuration(timeoutSeconds)}
              onChange={(event) => setTimeoutSeconds(parseDuration(event.target.value))}
              disabled={busy || status.active}
            >
              {DURATION_PRESETS.map((preset) => (
                <option key={preset.label} value={serializeDuration(preset.seconds)}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-row">
            <div className="control-copy">
              <label htmlFor="display-awake">Keep display on</label>
              <span>Also prevent the screen from turning off.</span>
            </div>
            <label className="switch" htmlFor="display-awake">
              <input
                id="display-awake"
                type="checkbox"
                checked={keepDisplayAwake}
                onChange={(event) => setKeepDisplayAwake(event.target.checked)}
                disabled={busy || status.active}
              />
              <span className="switch-track" aria-hidden="true">
                <span className="switch-thumb" />
              </span>
              <span className="sr-only">
                {keepDisplayAwake ? "Display stays on" : "Display may turn off"}
              </span>
            </label>
          </div>
        </section>
      </main>

      <footer className="technical-footer">
        <span>Command</span>
        <code>{command}</code>
      </footer>
    </div>
  );
}

export default App;
