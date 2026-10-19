(() => {
  "use strict";

  const config = window.CAFFEINATE_SITE ?? {
    previewVersion: "3.0.0-beta.0",
    publishedVersion: "2.1.0",
    releasesUrl: "https://github.com/AungMyoKyaw/caffeinate-app/releases",
    brew: { available: false, command: "" }
  };

  const screens = [
    {
      id: "session",
      title: "Stay in control.",
      description:
        "Choose System, Display or Both. Pick a duration, see the running state, and stop instantly when you're done.",
      caption: "A live wake session with an explicit stop action.",
      alt: "Real macOS Caffeinate 3.0 Session screen showing an active wake session and duration controls"
    },
    {
      id: "profiles",
      title: "One setup. Any time.",
      description:
        "Save the wake modes and durations you reach for often. Your favorite routine is one selection away.",
      caption: "Profiles and their local, reusable configurations.",
      alt: "Caffeinate 3.0 Profiles screen with a field to name and save a wake setup"
    },
    {
      id: "schedules",
      title: "Plan ahead, simply.",
      description:
        "Create local one-time start or stop actions, change them when plans shift, and always see their status.",
      caption: "One-time schedules, available while Caffeinate runs.",
      alt: "Caffeinate 3.0 Schedules screen with date, name and action controls"
    },
    {
      id: "history",
      title: "A quiet record.",
      description:
        "See recent completed sessions without an account. Everything stays on your Mac, under your control.",
      caption: "Local history, without cloud tracking.",
      alt: "Caffeinate 3.0 History screen listing a completed session and clear-history control"
    },
    {
      id: "settings",
      title: "Make it yours.",
      description:
        "Appearance, notifications, login launch, low-battery warnings and optional global shortcuts, all in one place.",
      caption: "Simple preferences that stay out of your way.",
      alt: "Caffeinate 3.0 Settings screen showing light appearance, notifications and optional shortcuts"
    }
  ];
  const tabs = [...document.querySelectorAll("[data-gallery-tab]")];
  const image = document.getElementById("gallery-image");
  const panel = document.getElementById("gallery-panel");
  const dialog = document.getElementById("image-dialog");
  const dialogImage = document.getElementById("dialog-image");
  const dialogLabel = document.getElementById("dialog-label");
  const toast = document.querySelector("[data-toast]");
  let toastTimeout = 0;
  let active = 0;

  function notify(message) {
    if (!(toast instanceof HTMLElement)) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  document.querySelectorAll("[data-preview-version]").forEach((el) => {
    el.textContent = config.previewVersion;
  });
  document.querySelectorAll("[data-published-version]").forEach((el) => {
    el.textContent = config.publishedVersion;
  });
  document.querySelectorAll("[data-stable-link]").forEach((link) => {
    if (link instanceof HTMLAnchorElement) link.href = config.releasesUrl;
  });
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
  document.querySelectorAll("[data-brew-command]").forEach((el) => {
    el.textContent = config.brew.command;
  });
  document.querySelectorAll("[data-copy-brew]").forEach((button) => {
    button.hidden = !config.brew.available;
  });

  function activateGallery(index, focusTab = false) {
    active = (index + screens.length) % screens.length;
    const screen = screens[active];
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === active));
      tab.setAttribute("tabindex", i === active ? "0" : "-1");
      if (i === active && focusTab) tab.focus();
    });
    if (panel) panel.setAttribute("aria-labelledby", tabs[active].id);
    if (image) {
      image.setAttribute("src", "assets/screenshots/" + screen.id + ".webp");
      image.setAttribute("alt", screen.alt);
    }
    const count = document.getElementById("gallery-count");
    const title = document.getElementById("gallery-screen-title");
    const description = document.getElementById("gallery-description");
    const caption = document.getElementById("gallery-caption");
    if (count) count.textContent = String(active + 1).padStart(2, "0") + " / 05";
    if (title) title.textContent = screen.title;
    if (description) description.textContent = screen.description;
    if (caption) caption.textContent = screen.caption;
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activateGallery(i));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = i;
      if (event.key === "ArrowRight") next = i + 1;
      if (event.key === "ArrowLeft") next = i - 1;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = screens.length - 1;
      activateGallery(next, true);
    });
  });
  document
    .querySelector("[data-gallery-next]")
    ?.addEventListener("click", () => activateGallery(active + 1));
  document
    .querySelector("[data-gallery-prev]")
    ?.addEventListener("click", () => activateGallery(active - 1));
  activateGallery(0);

  document.querySelector("[data-open-preview]")?.addEventListener("click", () => {
    if (!(dialog instanceof HTMLDialogElement) || !(dialogImage instanceof HTMLImageElement))
      return;
    const screen = screens[active];
    dialogImage.src = "assets/screenshots/" + screen.id + ".webp";
    dialogImage.alt = screen.alt;
    if (dialogLabel)
      dialogLabel.textContent =
        "Caffeinate 3.0 — " + screen.id[0].toUpperCase() + screen.id.slice(1);
    dialog.showModal();
  });
  document.querySelector("[data-close-preview]")?.addEventListener("click", () => {
    if (dialog instanceof HTMLDialogElement) dialog.close();
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog && dialog instanceof HTMLDialogElement) dialog.close();
  });

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      notify(label + " copied to clipboard.");
    } catch {
      notify("Clipboard unavailable. Select and copy the visible command.");
    }
  }
  document.querySelector("[data-copy-command]")?.addEventListener("click", () => {
    void copy("/usr/bin/caffeinate -i -w <app-pid>", "Example command");
  });
  document.querySelector("[data-copy-brew]")?.addEventListener("click", () => {
    void copy(config.brew.command, "Homebrew command");
  });

  const toggle = document.querySelector("[data-nav-toggle]");
  const navigation = document.getElementById("site-nav");
  function closeMenu() {
    navigation?.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open navigation");
  }
  toggle?.addEventListener("click", () => {
    const open = navigation?.classList.toggle("is-open") ?? false;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Element && !event.target.closest(".site-nav, .nav-toggle"))
      closeMenu();
  });
})();
