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

  function durationCellClass(preset: { seconds: number | null }): string {
    const isChosen = timeoutSeconds === preset.seconds;
    return [
      "duration-cell",
      "relative grid min-h-[32px] min-w-0 cursor-pointer place-items-center border-r border-rule text-[10.5px] font-semibold transition-colors duration-[140ms] ease-out last:border-r-0",
      isChosen
        ? "chosen bg-volt-soft text-ink shadow-[inset_0_0_0_1px_var(--color-volt)]"
        : "text-ink-soft hover:bg-surface-muted hover:text-ink",
      settingsDisabled ? "cursor-default" : ""
    ].join(" ");
  }

  function switchTrackClass(checked: boolean): string {
    return [
      "switch-track block h-[27px] w-[44px] rounded-full border bg-surface-muted p-[3px] transition-colors duration-[160ms] ease-out",
      checked ? "border-volt-bright bg-volt-bright" : "border-rule-strong"
    ].join(" ");
  }

  const switchThumbClass = $derived(
    `switch-thumb block h-[19px] w-[19px] rounded-full border bg-surface transition-transform duration-[160ms] ease-out ${keepDisplayAwake ? "translate-x-[17px] border-transparent" : "border-rule"}`
  );
</script>

<div
  class:active={status.active}
  class:busy
  class:error={Boolean(error)}
  class="grid min-h-screen w-full grid-rows-[auto_1fr_auto] bg-paper text-ink"
>
  <header class="flex min-h-[60px] items-center justify-between border-b border-rule px-6 py-4">
    <div class="flex items-center gap-[9px]">
      <span
        class="inline-grid h-[18px] w-[18px] place-items-center overflow-hidden rounded-[4px]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 1024 1024" class="block h-full w-full">
          <rect width="1024" height="1024" rx="224" fill="#D58A2A" />
          <path
            d="M512 238v278"
            fill="none"
            stroke="#2B201A"
            stroke-width="78"
            stroke-linecap="round"
          />
          <path
            d="M348 314a292 292 0 1 0 328 0"
            fill="none"
            stroke="#2B201A"
            stroke-width="78"
            stroke-linecap="round"
          />
          <circle cx="512" cy="548" r="42" fill="#2B201A" />
        </svg>
      </span>
      <span class="text-[15px] font-semibold leading-none tracking-[-0.01em]">Caffeinate</span>
    </div>

    <div
      class="flex items-center gap-[6px] text-[11px] font-semibold text-quiet"
      title="Caffeinate does not use the network"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" class="h-[15px] w-[15px]">
        <path
          d="M6.5 8.5V6.8A3.5 3.5 0 0 1 10 3.3a3.5 3.5 0 0 1 3.5 3.5v1.7"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="1.5"
        />
        <rect
          x="4.5"
          y="8.5"
          width="11"
          height="8"
          rx="2.2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
      <span>Local only</span>
    </div>
  </header>

  <main class="mx-auto flex w-full max-w-[520px] flex-col px-6 py-5">
    <section
      data-testid="status-action"
      class="status-action grid min-h-[190px] grid-cols-[minmax(0,1fr)_132px] items-center gap-7 border-b border-rule py-4 text-left"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="status-copy min-w-0">
        <div
          class="status-label mb-3 flex h-6 items-center gap-[7px] text-[12px] font-semibold tracking-[0.01em] text-ink-soft"
        >
          <span class="grid h-[18px] w-[18px] place-items-center text-volt" aria-hidden="true">
            {#if status.active}
              <svg viewBox="0 0 20 20" class="h-[15px] w-[15px]"
                ><path
                  d="M11.2 1.8 5.7 10h3.8l-.7 8.2 5.5-9h-3.8l.7-7.4Z"
                  fill="currentColor"
                /></svg
              >
            {:else}
              <span class="h-[7px] w-[7px] rounded-full border-[1.5px] border-quiet"></span>
            {/if}
          </span>
          <span>{copy.statusLabel}</span>
        </div>

        <h1
          class="m-0 max-w-[330px] text-[clamp(28px,5vw,32px)] font-bold leading-[1.08] tracking-[-0.04em]"
        >
          {copy.title}
        </h1>
        <p class="mt-2 mb-0 max-w-[340px] text-[12.5px] leading-[1.5] text-ink-soft">
          {copy.detail}
        </p>
      </div>

      <div class="action-stack flex flex-col items-center justify-self-end">
        <button
          aria-label={copy.actionLabel}
          disabled={checking || busy}
          onclick={() => void toggleSession()}
          type="button"
          class="power-control group relative grid h-[92px] w-[92px] cursor-pointer place-items-center rounded-full border border-rule-strong bg-surface text-ink shadow-[var(--shadow-lift)] transition-[transform,background-color,border-color,color,box-shadow] duration-[180ms] ease-out hover:-translate-y-[2px] hover:scale-[1.018] hover:border-ink active:translate-y-0 active:scale-[0.97] disabled:cursor-default disabled:opacity-[0.68] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-volt {status.active
            ? '!border-volt-bright !bg-volt-bright !text-volt-ink shadow-[0_14px_34px_rgb(54_78_0_/_0.16)]'
            : ''}"
        >
          <span
            class="pointer-events-none absolute inset-[-8px] rounded-full border border-transparent {status.active
              ? 'ring-pulse border-volt-bright'
              : ''}"
            aria-hidden="true"
          ></span>
          {#if busy}
            <span
              class="spin block h-[31px] w-[31px] rounded-full border-2 border-current"
              aria-hidden="true"
            ></span>
          {:else}
            <svg class="h-9 w-9" aria-hidden="true" viewBox="0 0 40 40" fill="none">
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

        <div class="action-label mt-3 flex flex-col items-center gap-[3px] text-center">
          <strong class="text-[12.5px] font-semibold leading-[1.2]">{copy.actionLabel}</strong>
          <span class="text-[10.5px] leading-[1.2] text-quiet">⌘ Return</span>
        </div>
      </div>
    </section>

    {#if error}
      <div
        class="mb-3 mt-[-2px] flex min-h-10 items-center gap-[9px] rounded-[10px] border border-error bg-error-surface px-3 py-[9px] text-left text-[12px] leading-[1.35] text-error"
        role="alert"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" class="h-[17px] w-[17px] flex-shrink-0">
          <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path
            d="M10 5.8v5.1M10 14.1h.01"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="1.8"
          />
        </svg>
        <span>{error}</span>
      </div>
    {/if}

    <section class="border-t border-rule" aria-label="Wake session settings">
      <fieldset
        disabled={settingsDisabled}
        class="grid min-h-[68px] grid-cols-[minmax(150px,0.8fr)_minmax(270px,1.2fr)] items-center gap-5 border-0 border-b border-rule py-3"
      >
        <legend class="sr-only">Duration</legend>
        <div class="flex flex-col items-start gap-[4px] text-left">
          <label class="p-0 text-[12.5px] font-semibold text-ink" for="duration-rail-input"
            >Duration</label
          >
          <span class="text-[10.5px] leading-[1.35] text-quiet"
            >Choose when this wake session should end.</span
          >
        </div>

        <div
          aria-label="Wake session duration"
          class="duration-rail grid w-full max-w-[320px] grid-cols-[1.6fr_repeat(4,_0.72fr)] justify-self-end overflow-hidden rounded-[8px] border bg-surface {settingsDisabled
            ? 'border-rule bg-surface-muted'
            : 'border-rule-strong'}"
        >
          {#each DURATION_PRESETS as preset}
            <label class={durationCellClass(preset)}>
              <input
                aria-label={preset.label}
                checked={timeoutSeconds === preset.seconds}
                id={preset.id === DURATION_PRESETS[0]?.id ? "duration-rail-input" : undefined}
                name="duration"
                onchange={() => (timeoutSeconds = preset.seconds)}
                type="radio"
                class="sr-only"
              />
              <span class="block truncate">{preset.shortLabel}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <div
        class="grid min-h-[68px] grid-cols-[minmax(150px,0.8fr)_minmax(270px,1.2fr)] items-center gap-5 border-b border-rule py-3"
      >
        <div class="flex flex-col items-start gap-[4px] text-left">
          <label class="p-0 text-[12.5px] font-semibold text-ink" for="keep-display-awake"
            >Keep display on</label
          >
          <span class="text-[10.5px] leading-[1.35] text-quiet"
            >Also prevent the screen from turning off.</span
          >
        </div>

        <label
          class="switch relative inline-block h-[27px] w-[44px] cursor-pointer justify-self-end {settingsDisabled
            ? 'cursor-default'
            : ''}"
          for="keep-display-awake"
        >
          <input
            bind:checked={keepDisplayAwake}
            disabled={settingsDisabled}
            id="keep-display-awake"
            type="checkbox"
            class="sr-only"
          />
          <span class={switchTrackClass(keepDisplayAwake)} aria-hidden="true">
            <span class={switchThumbClass}></span>
          </span>
        </label>
      </div>
    </section>
  </main>

  <footer
    class="grid min-h-12 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-rule bg-surface-muted px-6 py-3"
  >
    <span class="text-[9.5px] font-bold uppercase tracking-[0.08em] text-quiet">Command</span>
    <code
      title={command}
      class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10.5px] leading-[1.35] text-ink-soft"
    >
      {command}
    </code>
  </footer>
</div>
