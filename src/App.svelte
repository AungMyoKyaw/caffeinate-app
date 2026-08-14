<script lang="ts">
  import { onMount } from "svelte";
  import {
    caffeinateClient,
    EMPTY_STATUS,
    type CaffeinateClient,
    type CaffeinateStatus
  } from "./lib/caffeinate";
  import { buildCommandPreview, DURATION_PRESETS } from "./lib/format";
  import { getStateCopy } from "./lib/presentation";

  type Props = {
    client?: CaffeinateClient;
    pollIntervalMs?: number;
  };

  let { client = caffeinateClient, pollIntervalMs = 1000 }: Props = $props();

  let status = $state<CaffeinateStatus>(EMPTY_STATUS);
  let keepDisplayAwake = $state(false);
  let timeoutSeconds = $state<number | null>(null);
  let checking = $state(true);
  let busy = $state(false);
  let error = $state("");

  const copy = $derived(getStateCopy(status, checking, busy));
  const command = $derived(
    status.active ? status.command : buildCommandPreview(keepDisplayAwake, timeoutSeconds)
  );
  const settingsDisabled = $derived(checking || busy || status.active);

  async function refreshStatus(): Promise<void> {
    try {
      status = await client.status();
      error = "";
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
    } finally {
      checking = false;
    }
  }

  async function toggleSession(): Promise<void> {
    if (checking || busy) return;

    busy = true;
    error = "";

    try {
      status = status.active
        ? await client.stop()
        : await client.start({
            keepDisplayAwake: keepDisplayAwake,
            timeoutSeconds: timeoutSeconds
          });
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
    } finally {
      busy = false;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.metaKey && event.key === "Enter") {
      event.preventDefault();
      void toggleSession();
    }
  }

  $effect(() => {
    if (!status.active || busy) return;

    const timer = window.setInterval(() => {
      void refreshStatus();
    }, pollIntervalMs);

    return () => window.clearInterval(timer);
  });

  onMount(() => {
    void refreshStatus();
    window.addEventListener("keydown", handleKeydown);

    return () => window.removeEventListener("keydown", handleKeydown);
  });
</script>

<div class:active={status.active} class:busy class:error={Boolean(error)} class="app-shell">
  <header class="app-header">
    <div class="brand-lockup">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="product-name">Caffeinate</span>
    </div>

    <div class="local-note" title="Caffeinate does not use the network">
      <svg aria-hidden="true" viewBox="0 0 20 20">
        <path
          d="M6.5 8.5V6.8A3.5 3.5 0 0 1 10 3.3a3.5 3.5 0 0 1 3.5 3.5v1.7"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="1.5"
        />
        <rect x="4.5" y="8.5" width="11" height="8" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <span>Local only</span>
    </div>
  </header>

  <main class="control-surface">
    <section class="state-stage" aria-live="polite" aria-atomic="true">
      <div class="status-line">
        <span class="status-symbol" aria-hidden="true">
          {#if status.active}
            <svg viewBox="0 0 20 20"><path d="M11.2 1.8 5.7 10h3.8l-.7 8.2 5.5-9h-3.8l.7-7.4Z" fill="currentColor" /></svg>
          {:else}
            <span class="ready-dot"></span>
          {/if}
        </span>
        <span>{copy.statusLabel}</span>
      </div>

      <h1>{copy.title}</h1>
      <p class="state-detail">{copy.detail}</p>

      <div class="power-wrap">
        <button
          aria-label={copy.actionLabel}
          class="power-control"
          disabled={checking || busy}
          onclick={() => void toggleSession()}
          type="button"
        >
          <span class="power-ring" aria-hidden="true"></span>
          {#if busy}
            <span class="progress-mark" aria-hidden="true"></span>
          {:else}
            <svg class="power-glyph" aria-hidden="true" viewBox="0 0 40 40" fill="none">
              <path d="M20 5v14" stroke="currentColor" stroke-linecap="round" stroke-width="2.7" />
              <path
                d="M12.2 9.5a13 13 0 1 0 15.6 0"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="2.7"
              />
            </svg>
          {/if}
        </button>

        <div class="action-caption">
          <strong>{copy.actionLabel}</strong>
          <span>⌘ Return</span>
        </div>
      </div>
    </section>

    {#if error}
      <div class="error-banner" role="alert">
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path d="M10 5.8v5.1M10 14.1h.01" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
        </svg>
        <span>{error}</span>
      </div>
    {/if}

    <section class="settings" aria-label="Wake session settings">
      <fieldset class="setting-row duration-setting" disabled={settingsDisabled}>
        <legend class="visually-hidden">Duration</legend>
        <div class="setting-copy">
          <span class="setting-title" aria-hidden="true">Duration</span>
          <span>Choose when this wake session should end.</span>
        </div>

        <div class="duration-rail" aria-label="Duration">
          {#each DURATION_PRESETS as preset}
            <label class:chosen={timeoutSeconds === preset.seconds}>
              <input
                aria-label={preset.label}
                checked={timeoutSeconds === preset.seconds}
                name="duration"
                onchange={() => (timeoutSeconds = preset.seconds)}
                type="radio"
              />
              <span>{preset.shortLabel}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <div class="setting-row">
        <div class="setting-copy">
          <label for="keep-display-awake">Keep display on</label>
          <span>Also prevent the screen from turning off.</span>
        </div>

        <label class="switch" class:disabled={settingsDisabled} for="keep-display-awake">
          <input
            bind:checked={keepDisplayAwake}
            disabled={settingsDisabled}
            id="keep-display-awake"
            type="checkbox"
          />
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
        </label>
      </div>
    </section>
  </main>

  <footer class="technical-footer">
    <span class="command-label">Command</span>
    <code>{command}</code>
  </footer>
</div>
