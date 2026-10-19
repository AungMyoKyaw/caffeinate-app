<script lang="ts">
  import { onMount, tick } from "svelte";
  import { listen } from "@tauri-apps/api/event";
  import {
    caffeinateClient,
    EMPTY_STATUS,
    type CaffeinateClient,
    type CaffeinateStatus
  } from "./lib/caffeinate";
  import {
    wakeApi,
    freshData,
    DEFAULT_PREFERENCES,
    formatClock,
    formatDuration,
    validateDuration,
    wakeCommandPreview,
    type AppData,
    type WakeMode,
    type Preferences,
    type View,
    type Profile,
    type Schedule
  } from "./lib/app-api";

  interface Props {
    client?: CaffeinateClient;
    pollIntervalMs?: number;
  }
  let { client = caffeinateClient, pollIntervalMs = 1000 }: Props = $props();
  let status = $state<CaffeinateStatus>({ ...EMPTY_STATUS });
  let data = $state<AppData>(freshData());
  let view = $state<View>("session");
  let mode = $state<WakeMode>("system");
  let timeoutSeconds = $state<number | null>(null);
  let preset = $state("indefinite");
  let customMinutes = $state(90);
  let checking = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");
  let dirty = $state(false);
  let detailsExpanded = $state(false);
  let quickMenuOpen = $state(false);
  let profileName = $state("");
  let editingProfileId = $state(0);
  let editingScheduleId = $state(0);
  let newScheduleName = $state("");
  let scheduleKind = $state<"start" | "stop">("start");
  let scheduleDate = $state("");
  let stagedPreferences = $state<Preferences>({ ...DEFAULT_PREFERENCES });

  const activeMode = $derived(status.wakeMode ?? (status.keepDisplayAwake ? "both" : "system"));
  const availableTime = $derived(status.remainingSeconds);
  const activeElapsed = $derived(
    status.elapsedSeconds ??
      (status.startedAtUnixMs
        ? Math.max(0, Math.floor((Date.now() - status.startedAtUnixMs) / 1000))
        : null)
  );
  const endsAtText = $derived(status.active ? formatClock(status.endsAtUnixMs ?? null) : "—");
  const horizon = $derived(
    status.active && status.timeoutSeconds != null && availableTime != null
      ? Math.max(
          0,
          Math.min(100, ((status.timeoutSeconds - availableTime) / status.timeoutSeconds) * 100)
        )
      : 0
  );
  const command = $derived(
    status.active ? status.command : wakeCommandPreview(mode, timeoutSeconds)
  );
  const hasValidDuration = $derived(validateDuration(timeoutSeconds));
  const isTestClient = $derived(client !== caffeinateClient);

  function showError(reason: unknown) {
    error = reason instanceof Error ? reason.message : String(reason);
  }
  function selectDuration(value: string) {
    preset = value;
    timeoutSeconds =
      value === "indefinite"
        ? null
        : value === "custom"
          ? Math.round(customMinutes * 60)
          : Number(value);
    dirty = status.active;
    notice = "";
    if (value === "custom") {
      void tick().then(() => {
        const input = document.getElementById("custom-minutes");
        if (typeof input?.scrollIntoView === "function") input.scrollIntoView({ block: "nearest" });
      });
    }
  }
  function selectMode(value: WakeMode) {
    mode = value;
    dirty = status.active;
  }
  function syncSelection(next: CaffeinateStatus) {
    mode = next.wakeMode ?? (next.keepDisplayAwake ? "both" : "system");
    timeoutSeconds = next.timeoutSeconds;
    preset =
      next.timeoutSeconds === null
        ? "indefinite"
        : [1800, 3600, 7200, 14400].includes(next.timeoutSeconds)
          ? String(next.timeoutSeconds)
          : "custom";
    if (next.timeoutSeconds != null && preset === "custom") {
      customMinutes = next.timeoutSeconds / 60;
    }
  }
  async function refreshStatus(clearError = true) {
    try {
      const next = await client.status();
      status = next;
      if (!dirty && next.active) syncSelection(next);
      if (clearError) error = "";
    } catch (e) {
      showError(e);
    } finally {
      checking = false;
    }
  }
  async function reloadData() {
    if (isTestClient) return;
    try {
      data = await wakeApi.getData();
      stagedPreferences = { ...data.preferences };
      document.documentElement.dataset.theme = data.preferences.theme;
      if (!status.active) {
        mode = data.preferences.wakeMode;
        timeoutSeconds = data.preferences.timeoutSeconds;
        syncPreset();
      }
    } catch (e) {
      showError(e);
    }
  }
  function syncPreset() {
    preset =
      timeoutSeconds === null
        ? "indefinite"
        : [1800, 3600, 7200, 14400].includes(timeoutSeconds)
          ? String(timeoutSeconds)
          : "custom";
    if (timeoutSeconds !== null && preset === "custom") customMinutes = timeoutSeconds / 60;
  }
  async function toggleSession() {
    if (checking || busy || (!status.active && !hasValidDuration)) return;
    busy = true;
    error = "";
    notice = "";
    try {
      if (status.active) {
        status = await client.stop();
      } else {
        status = isTestClient
          ? await client.start({ keepDisplayAwake: mode !== "system", timeoutSeconds })
          : await wakeApi.start({ wakeMode: mode, timeoutSeconds });
        if (!isTestClient) {
          data = await wakeApi.setPreferences({
            ...data.preferences,
            wakeMode: mode,
            timeoutSeconds
          });
        }
      }
      dirty = false;
      if (!status.active) await reloadData();
    } catch (e) {
      showError(e);
    } finally {
      busy = false;
    }
  }
  async function applyActiveEdits() {
    if (!status.active || busy || !hasValidDuration || isTestClient) return;
    busy = true;
    error = "";
    try {
      status = await wakeApi.update({ wakeMode: mode, timeoutSeconds }, status.revision);
      dirty = false;
      data = await wakeApi.setPreferences({ ...data.preferences, wakeMode: mode, timeoutSeconds });
      notice = "Session updated. The new duration starts now.";
    } catch (e) {
      showError(e);
      await refreshStatus(false);
    } finally {
      busy = false;
    }
  }
  function discardEdits() {
    syncSelection(status);
    dirty = false;
  }
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && quickMenuOpen) {
      quickMenuOpen = false;
      document.querySelector<HTMLButtonElement>(".traybtn")?.focus();
      return;
    }
    if (event.metaKey && event.key === "Enter") {
      event.preventDefault();
      void toggleSession();
    }
  }
  function handleOutsideClick(event: MouseEvent) {
    if (
      quickMenuOpen &&
      event.target instanceof Element &&
      !event.target.closest("#quick-menu, .traybtn")
    ) {
      quickMenuOpen = false;
    }
  }
  onMount(() => {
    let live = true;
    const unsubscribe: (() => void)[] = [];
    void (async () => {
      await refreshStatus();
      if (live) await reloadData();
    })();
    if (!isTestClient) {
      void listen<CaffeinateStatus>("wake-status", (event) => {
        status = event.payload;
        if (!dirty && status.active) syncSelection(status);
      })
        .then((fn) => {
          if (live) unsubscribe.push(fn);
          else fn();
        })
        .catch(showError);
      void listen<string>("show-view", (event) => {
        view = event.payload === "profiles" ? "profiles" : "preferences";
      })
        .then((fn) => {
          if (live) unsubscribe.push(fn);
          else fn();
        })
        .catch(showError);
      void listen<string>("battery-warning", (event) => {
        notice = event.payload;
      })
        .then((fn) => {
          if (live) unsubscribe.push(fn);
          else fn();
        })
        .catch(showError);
      void listen("preferences-changed", () => {
        void reloadData();
      })
        .then((fn) => {
          if (live) unsubscribe.push(fn);
          else fn();
        })
        .catch(showError);
    }
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleOutsideClick);
    const timer = window.setInterval(() => {
      void refreshStatus();
      if (!isTestClient && !busy)
        void wakeApi
          .getData()
          .then((d) => {
            data = d;
          })
          .catch(showError);
    }, pollIntervalMs);
    return () => {
      live = false;
      window.clearInterval(timer);
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("click", handleOutsideClick);
      for (const fn of unsubscribe) fn();
    };
  });
  async function mutate<T>(operation: Promise<T>, result: (v: T) => void) {
    busy = true;
    error = "";
    notice = "";
    try {
      result(await operation);
      notice = "Changes saved.";
    } catch (e) {
      showError(e);
    } finally {
      busy = false;
    }
  }
  async function saveSettings() {
    await mutate(wakeApi.setPreferences(stagedPreferences), (next) => {
      data = next;
      document.documentElement.dataset.theme = next.preferences.theme;
    });
  }
  async function addProfile() {
    const draft: Profile = {
      id: editingProfileId,
      name: profileName,
      wakeMode: mode,
      timeoutSeconds
    };
    await mutate(wakeApi.saveProfile(draft), (next) => {
      data = next;
      profileName = "";
      editingProfileId = 0;
    });
  }
  function editProfile(p: Profile) {
    editingProfileId = p.id;
    profileName = p.name;
    mode = p.wakeMode;
    timeoutSeconds = p.timeoutSeconds;
    syncPreset();
  }
  function applyProfile(p: Profile) {
    mode = p.wakeMode;
    timeoutSeconds = p.timeoutSeconds;
    syncPreset();
    dirty = status.active;
    view = "session";
  }
  function editSchedule(schedule: Schedule) {
    editingScheduleId = schedule.id;
    newScheduleName = schedule.label;
    scheduleKind = schedule.kind;
    mode = schedule.wakeMode;
    timeoutSeconds = schedule.timeoutSeconds;
    syncPreset();
    const d = new Date(schedule.triggerAtUnixMs);
    const pad = (v: number) => String(v).padStart(2, "0");
    scheduleDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  async function addSchedule() {
    const time = new Date(scheduleDate).getTime();
    if (!Number.isFinite(time) || time <= Date.now()) {
      error = "Choose a future local date and time.";
      return;
    }
    const draft: Schedule = {
      id: editingScheduleId,
      label: newScheduleName.trim() || "Wake session",
      kind: scheduleKind,
      triggerAtUnixMs: time,
      wakeMode: mode,
      timeoutSeconds,
      outcome: "pending"
    };
    await mutate(wakeApi.createSchedule(draft), (next) => {
      data = next;
      newScheduleName = "";
      scheduleDate = "";
      editingScheduleId = 0;
    });
  }
  function formatDate(ms: number) {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(ms);
  }
  function selectView(next: View) {
    view = next;
    quickMenuOpen = false;
    error = "";
    notice = "";
    if (next === "preferences") stagedPreferences = { ...data.preferences };
  }
</script>

<svelte:head><title>Caffeinate — Keep your Mac awake</title></svelte:head>
<div class="sw-app" class:sw-active={status.active}>
  <div class="app">
    <aside class="sidebar" aria-label="Caffeinate sidebar">
      <div class="brand">
        <span class="logo" aria-hidden="true"
          ><svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"><path d="M4 16h24M4 21h24M16 7v6" /></svg
          ></span
        >
        Caffeinate
      </div>
      <nav class="nav sw-nav" aria-label="Caffeinate sections">
        {#each [{ id: "session", label: "Session", path: "M12 7v5l4 2", circle: true }, { id: "profiles", label: "Profiles", path: "M8 10h8M8 14h5", box: true }, { id: "schedules", label: "Schedules", path: "M3 10h18M8 3v5M16 3v5M8 14h4", calendar: true }, { id: "recent", label: "History", path: "M3 12a9 9 0 1 1 4 7M3 5v7h7M12 7v5l4 2" }, { id: "preferences", label: "Settings", path: "M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3", circleSmall: true }] as item (item.id)}
          <button
            type="button"
            aria-current={view === item.id ? "page" : undefined}
            onclick={() => selectView(item.id as View)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              {#if item.circle}<circle cx="12" cy="12" r="9" />{/if}
              {#if item.box}<rect x="3" y="5" width="18" height="14" rx="3" />{/if}
              {#if item.calendar}<rect x="3" y="5" width="18" height="16" rx="2" />{/if}
              {#if item.circleSmall}<circle cx="12" cy="12" r="3" />{/if}
              <path d={item.path} />
            </svg>{item.label}
          </button>
        {/each}
      </nav>
      <div class="sidefoot">
        <small>Menu bar status</small>
        <button
          class="traybtn"
          type="button"
          aria-expanded={quickMenuOpen}
          aria-controls="quick-menu"
          onclick={() => (quickMenuOpen = !quickMenuOpen)}
        >
          <span>⌁ Status</span>
          <b
            >{status.active
              ? status.timeoutSeconds == null
                ? "Awake"
                : formatDuration(availableTime ?? 0)
              : "Ready"}</b
          >
        </button>
      </div>
    </aside>

    <main class="main sw-main">
      <header class="mainhead">
        <div>
          <h2>
            {view === "session"
              ? "Session"
              : view === "profiles"
                ? "Profiles"
                : view === "schedules"
                  ? "Schedules"
                  : view === "recent"
                    ? "History"
                    : "Settings"}
          </h2>
          <p>
            {view === "session"
              ? "Awake when it matters."
              : view === "profiles"
                ? "Your saved wake setups."
                : view === "schedules"
                  ? "One-time local actions."
                  : view === "recent"
                    ? "What you have done."
                    : "Your preferences."}
          </p>
        </div>
        <span class="statepill" class:is-ready={!status.active}
          >{checking ? "Checking" : busy ? "Updating" : status.active ? "Awake" : "Ready"}</span
        >
      </header>
      {#if view === "session"}
        <section
          class="panel session-panel sw-session current"
          aria-label="Wake session"
          data-testid="status-action"
        >
          {#if error}<div class="error sw-alert" role="alert">{error}</div>{/if}
          {#if notice}<div class="info sw-notice" role="status">{notice}</div>{/if}
          <div class="session-scroll">
            <div class="hero">
              <div>
                <h3>
                  {checking
                    ? "Checking wake status."
                    : status.active
                      ? "Your Mac is staying awake."
                      : "Ready when you are."}
                </h3>
                <p>
                  {status.active
                    ? activeMode === "system"
                      ? "System sleep is prevented. Your display may still turn off."
                      : activeMode === "display"
                        ? "Display idle sleep is prevented."
                        : "System and display idle sleep are prevented."
                    : "Start a wake session and keep working."}
                </p>
                <span class="sr-only" aria-live="polite"
                  >{status.active ? "Mac stays awake." : "Mac can sleep."}</span
                >
              </div>
              <div>
                <div class="hero-low">
                  <div class="clock" aria-live="off">
                    <small
                      >{status.active
                        ? availableTime === null
                          ? "Time awake"
                          : "Remaining"
                        : "Session status"}</small
                    >
                    <span
                      >{status.active
                        ? availableTime === null
                          ? formatDuration(activeElapsed ?? 0)
                          : formatDuration(availableTime)
                        : "Not running"}</span
                    >
                  </div>
                  <span class="endtime"
                    >{status.active
                      ? availableTime === null
                        ? "Until you stop it"
                        : "Ends at " + endsAtText
                      : "No active session"}</span
                  >
                </div>
                <div
                  class="horizon sw-horizon"
                  role="img"
                  aria-label={status.active && status.timeoutSeconds != null
                    ? Math.round(horizon) + "% of session elapsed"
                    : "No bounded session progress"}
                >
                  <div style:width={horizon + "%"}></div>
                </div>
              </div>
            </div>
            <div class="formarea">
              <div>
                <div class="label">Keep awake</div>
                <fieldset class="choices sw-segments" aria-label="Wake mode">
                  <legend class="sr-only">Wake mode</legend>
                  {#each [{ id: "system", label: "System" }, { id: "display", label: "Display" }, { id: "both", label: "Both" }] as m (m.id)}
                    <label class:chosen={mode === m.id}>
                      <input
                        type="radio"
                        name="wakeMode"
                        checked={mode === m.id}
                        onchange={() => selectMode(m.id as WakeMode)}
                      />
                      {m.label}
                    </label>
                  {/each}
                </fieldset>
              </div>
              <div>
                <div class="label">For how long?</div>
                <fieldset class="choices duration sw-segments" aria-label="Wake session duration">
                  <legend class="sr-only">Wake session duration</legend>
                  {#each [{ id: "indefinite", label: "Until", accessible: "Until stopped" }, { id: "1800", label: "30m", accessible: "30 minutes" }, { id: "3600", label: "1h", accessible: "1 hour" }, { id: "7200", label: "2h", accessible: "2 hours" }, { id: "14400", label: "4h", accessible: "4 hours" }, { id: "custom", label: "Custom", accessible: "Custom duration" }] as d (d.id)}
                    <label class:chosen={preset === d.id}>
                      <input
                        type="radio"
                        name="duration"
                        aria-label={d.accessible}
                        checked={preset === d.id}
                        onchange={() => selectDuration(d.id)}
                      />
                      {d.label}
                    </label>
                  {/each}
                </fieldset>
                {#if preset === "custom"}
                  <div class="custom">
                    <input
                      id="custom-minutes"
                      class="sw-input"
                      type="number"
                      min="1"
                      max="1440"
                      step="1"
                      aria-label="Custom minutes"
                      bind:value={customMinutes}
                      oninput={() => {
                        timeoutSeconds = customMinutes * 60;
                        dirty = status.active;
                      }}
                    />
                    <span>minutes · 1–1440</span>
                  </div>
                  {#if !hasValidDuration}<p class="validation-error sw-error-inline">
                      Enter 1–1440 whole minutes.
                    </p>{/if}
                {/if}
              </div>
            </div>
          </div>
          <div class="bottom">
            {#if status.active && dirty}
              <div class="pending sw-pending">
                <span>Changes not applied</span>
                <div>
                  <button type="button" class="sw-secondary" onclick={discardEdits}>Discard</button>
                  <button
                    type="button"
                    class="sw-primary"
                    disabled={busy || !hasValidDuration}
                    onclick={() => void applyActiveEdits()}>Apply changes</button
                  >
                </div>
              </div>
            {/if}
            <div class="actionbar">
              <span class="hint"
                >⌘ Return · Quick toggle<br />
                {status.active ? "Changes need Apply" : "Also works from the menu bar"}</span
              >
              <button
                type="button"
                class="primary sw-primary power-control"
                aria-label={status.active ? "Stop Session" : "Keep Mac Awake"}
                disabled={checking || busy || (!status.active && !hasValidDuration)}
                onclick={() => void toggleSession()}
              >
                {busy ? "Working…" : status.active ? "Stop Session" : "Keep Mac Awake"}
              </button>
            </div>
            <details class="sw-details" bind:open={detailsExpanded}>
              <summary>Technical details</summary>
              <div class="code sw-command">
                <code>{command}</code>
                <button
                  type="button"
                  class="sw-secondary"
                  onclick={() => void navigator.clipboard?.writeText(command)}>Copy</button
                >
              </div>
            </details>
          </div>
        </section>
      {:else if view === "profiles"}
        <section class="panel current sw-page">
          {#if error}<div class="error" role="alert">{error}</div>{/if}
          {#if notice}<div class="info" role="status">{notice}</div>{/if}
          <div class="pageintro">
            <h3>Save your routine.</h3>
            <p>A mode and duration, ready when you need them.</p>
          </div>
          <div class="field">
            <label for="profile-name">Profile name</label>
            <input
              class="sw-input"
              id="profile-name"
              bind:value={profileName}
              maxlength="32"
              placeholder="Presenting"
            />
          </div>
          <button
            class="primary sw-primary"
            disabled={busy || !profileName.trim()}
            onclick={() => void addProfile()}
          >
            {editingProfileId ? "Save profile" : "Save current settings"}
          </button>
          {#if editingProfileId}<button
              class="secondary sw-secondary"
              onclick={() => {
                editingProfileId = 0;
                profileName = "";
              }}>Cancel edit</button
            >{/if}
          <div class="divider"></div>
          {#if data.profiles.length === 0}
            <div class="empty"><strong>No profiles yet</strong>Save a setup to reuse it later.</div>
          {/if}
          {#each data.profiles as p (p.id)}
            <div class="item sw-list-row">
              <div class="fill">
                <strong>{p.name}</strong><small
                  >{p.wakeMode} · {formatDuration(p.timeoutSeconds)}</small
                >
              </div>
              <button class="textbutton" onclick={() => applyProfile(p)}>Use</button>
              <button class="textbutton" onclick={() => editProfile(p)}>Edit</button>
              <button
                class="textbutton danger"
                onclick={() =>
                  void mutate(wakeApi.deleteProfile(p.id), (d) => {
                    data = d;
                  })}>Delete</button
              >
            </div>
          {/each}
        </section>
      {:else if view === "schedules"}
        <section class="panel current sw-page">
          {#if error}<div class="error" role="alert">{error}</div>{/if}
          {#if notice}<div class="info" role="status">{notice}</div>{/if}
          <div class="pageintro">
            <h3>Plan ahead.</h3>
            <p>Schedule an action while Caffeinate is running.</p>
          </div>
          <div class="field">
            <label for="sched-date">Start at · Local date and time</label>
            <input
              class="sw-input"
              id="sched-date"
              type="datetime-local"
              bind:value={scheduleDate}
            />
          </div>
          <div class="field">
            <label for="sched-name">Name (optional)</label>
            <input
              class="sw-input"
              id="sched-name"
              bind:value={newScheduleName}
              maxlength="50"
              placeholder="Long download"
            />
          </div>
          <div class="field">
            <label for="sched-kind">Action</label>
            <span class="select-shell">
              <select class="sw-input" id="sched-kind" bind:value={scheduleKind}>
                <option value="start">Start wake session</option><option value="stop"
                  >Stop scheduled session</option
                >
              </select>
              <svg
                aria-hidden="true"
                class="select-chevron"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"><path d="m5 7.5 5 5 5-5" /></svg
              >
            </span>
          </div>
          <button class="primary sw-primary" disabled={busy} onclick={() => void addSchedule()}
            >{editingScheduleId ? "Save schedule" : "Create schedule"}</button
          >
          {#if editingScheduleId}<button
              class="secondary sw-secondary"
              onclick={() => {
                editingScheduleId = 0;
                newScheduleName = "";
                scheduleDate = "";
              }}>Cancel edit</button
            >{/if}
          <p class="muted">
            No background daemon: schedules do not run after Quit or wake a sleeping Mac.
          </p>
          <div class="divider"></div>
          {#if data.schedules.length === 0}<div class="empty">
              <strong>No scheduled actions</strong>Choose a future date and time above.
            </div>{/if}
          {#each [...data.schedules].sort((a, b) => a.triggerAtUnixMs - b.triggerAtUnixMs) as s (s.id)}
            <div class="item sw-list-row">
              <div class="fill">
                <strong>{s.label}</strong><small
                  >{s.kind} · {formatDate(s.triggerAtUnixMs)} · {s.outcome}</small
                >
              </div>
              {#if s.outcome === "pending" || s.outcome === "disabled"}
                <button class="textbutton" onclick={() => editSchedule(s)}>Edit</button>
                <button
                  class="textbutton"
                  onclick={() =>
                    void mutate(wakeApi.setScheduleEnabled(s.id, s.outcome === "disabled"), (d) => {
                      data = d;
                    })}>{s.outcome === "disabled" ? "Enable" : "Disable"}</button
                >
              {/if}
              <button
                class="textbutton danger"
                onclick={() =>
                  void mutate(wakeApi.deleteSchedule(s.id), (d) => {
                    data = d;
                  })}>Delete</button
              >
            </div>
          {/each}
        </section>
      {:else if view === "recent"}
        <section class="panel current sw-page">
          {#if error}<div class="error" role="alert">{error}</div>{/if}
          {#if notice}<div class="info" role="status">{notice}</div>{/if}
          <div class="pageintro">
            <h3>Recent sessions.</h3>
            <p>Stored locally. Nothing gets uploaded.</p>
          </div>
          {#if data.history.length === 0}<div class="empty">
              <strong>No completed sessions</strong>Your sessions will appear here.
            </div>{/if}
          {#each data.history as entry (entry.id)}
            <div class="item sw-list-row">
              <div class="fill">
                <strong>{formatDate(entry.startedAtUnixMs)}</strong>
                <small
                  >{entry.wakeMode} · {formatDuration(entry.actualSeconds)} · {entry.endReason}</small
                >
              </div>
            </div>
          {/each}
          {#if data.history.length > 0}<p>
              <button
                class="secondary sw-secondary"
                onclick={() =>
                  void mutate(wakeApi.clearHistory(), (d) => {
                    data = d;
                  })}>Clear history</button
              >
            </p>{/if}
        </section>
      {:else}
        <section class="panel current sw-page preferences-panel">
          <div class="preferences-scroll">
            {#if error}<div class="error" role="alert">{error}</div>{/if}
            {#if notice}<div class="info" role="status">{notice}</div>{/if}
            <div class="pageintro">
              <h3>Make it yours.</h3>
              <p>The essentials, without clutter.</p>
            </div>
            <div class="settingrow sw-pref-row">
              <label for="theme">Appearance</label>
              <span class="select-shell">
                <select class="sw-input" id="theme" bind:value={stagedPreferences.theme}>
                  <option value="system">Follow macOS</option><option value="light">Light</option
                  ><option value="dark">Dark</option>
                </select>
                <svg
                  aria-hidden="true"
                  class="select-chevron"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"><path d="m5 7.5 5 5 5-5" /></svg
                >
              </span>
            </div>
            <div class="settingrow sw-pref-row">
              <label for="autostart"
                >Launch at login<small>Does not start a wake session</small></label
              >
              <input
                id="autostart"
                type="checkbox"
                bind:checked={stagedPreferences.launchAtLogin}
              />
            </div>
            <div class="settingrow sw-pref-row">
              <label for="notify">Session-end notification</label>
              <input id="notify" type="checkbox" bind:checked={stagedPreferences.notifications} />
            </div>
            <div class="settingrow sw-pref-row">
              <label for="low">Low battery warning</label>
              <input id="low" type="checkbox" bind:checked={stagedPreferences.batteryWarning} />
            </div>
            <div class="settingrow sw-pref-row">
              <label for="shortcut-toggle">Global shortcut</label>
              <input
                class="sw-input"
                id="shortcut-toggle"
                type="text"
                autocomplete="off"
                spellcheck="false"
                bind:value={stagedPreferences.toggleShortcut}
                placeholder="Not set"
              />
            </div>
            <div class="settingrow sw-pref-row">
              <label for="shortcut-show">Show window shortcut</label>
              <input
                class="sw-input"
                id="shortcut-show"
                type="text"
                autocomplete="off"
                spellcheck="false"
                bind:value={stagedPreferences.showShortcut}
                placeholder="Not set"
              />
            </div>
            <p class="muted">
              Global shortcuts are disabled unless assigned. Changes stay local to your Mac.
            </p>
          </div>
          <div class="preferences-footer">
            <button class="primary sw-primary" disabled={busy} onclick={() => void saveSettings()}
              >Save preferences</button
            >
          </div>
        </section>
      {/if}
    </main>
  </div>
  {#if quickMenuOpen}
    <div class="traymenu" id="quick-menu" role="group" aria-label="Quick session actions">
      <b>Caffeinate</b>
      <p>
        {status.active
          ? "Awake · " +
            (availableTime == null ? "Until stopped" : formatDuration(availableTime) + " remaining")
          : "Ready · No active session"}
      </p>
      <button
        type="button"
        onclick={() => {
          quickMenuOpen = false;
          selectView("session");
        }}>Open Caffeinate</button
      >
      <button
        type="button"
        onclick={() => {
          quickMenuOpen = false;
          void toggleSession();
        }}>{status.active ? "Stop Session" : "Keep Mac Awake"}</button
      >
      <hr />
      <button
        type="button"
        onclick={() => {
          quickMenuOpen = false;
          selectView("profiles");
        }}>Profiles…</button
      >
      <button
        type="button"
        onclick={() => {
          quickMenuOpen = false;
          selectView("preferences");
        }}>Preferences…</button
      >
      <hr />
      <button type="button" onclick={() => (quickMenuOpen = false)}>Close menu</button>
    </div>
  {/if}
</div>
