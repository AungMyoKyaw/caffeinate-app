(() => {
  "use strict";

  const config = window.CAFFEINATE_SITE ?? {
    version: "1.0.0",
    minimumMacOS: "macOS 13 or later",
    dmgUrl: "./downloads/Caffeinate.dmg",
    brew: {
      available: false,
      command: "brew install --cask caffeinate"
    }
  };

  const toast = document.querySelector("[data-toast]");
  let toastTimer;

  function showToast(message) {
    if (!(toast instanceof HTMLElement)) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  document.querySelectorAll("[data-version]").forEach((element) => {
    element.textContent = `Version ${config.version}`;
  });

  document.querySelectorAll("[data-macos]").forEach((element) => {
    element.textContent = config.minimumMacOS;
  });

  document.querySelectorAll("[data-dmg-link]").forEach((link) => {
    if (link instanceof HTMLAnchorElement) link.href = config.dmgUrl;
  });

  const header = document.querySelector("[data-header]");
  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const navToggle = document.querySelector("[data-nav-toggle]");
  const navigation = document.querySelector("[data-navigation]");

  function closeNavigation() {
    navigation?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }

  navToggle?.addEventListener("click", () => {
    const isOpen = navigation?.classList.toggle("is-open") ?? false;
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navigation?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });

  const tabs = Array.from(document.querySelectorAll("[data-demo-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-demo-panel]"));

  function activateDemo(name, focus = false) {
    tabs.forEach((tab) => {
      const active = tab.getAttribute("data-demo-tab") === name;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.setAttribute("tabindex", active ? "0" : "-1");
      if (active && focus && tab instanceof HTMLElement) tab.focus();
    });

    panels.forEach((panel) => {
      panel.hidden = panel.getAttribute("data-demo-panel") !== name;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      activateDemo(tab.getAttribute("data-demo-tab") ?? "ready");
    });

    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      activateDemo(tabs[nextIndex].getAttribute("data-demo-tab") ?? "ready", true);
    });
  });

  const brewStatus = document.querySelector("[data-brew-status]");
  const brewDescription = document.querySelector("[data-brew-description]");
  const brewCommand = document.querySelector("[data-brew-command]");
  const copyBrew = document.querySelector("[data-copy-brew]");
  const copyLabel = document.querySelector("[data-copy-label]");

  if (brewCommand) brewCommand.textContent = config.brew.command;

  if (config.brew.available) {
    brewStatus?.classList.add("is-available");
    if (brewStatus) brewStatus.textContent = "Available";
    if (brewDescription) {
      brewDescription.textContent = "Install or update Caffeinate through Homebrew with one command.";
    }
    if (copyBrew instanceof HTMLButtonElement) copyBrew.disabled = false;
    if (copyLabel) copyLabel.textContent = "Copy command";
  }

  copyBrew?.addEventListener("click", async () => {
    if (!config.brew.available) return;
    try {
      await navigator.clipboard.writeText(config.brew.command);
      if (copyLabel) copyLabel.textContent = "Copied";
      showToast("Homebrew command copied.");
      window.setTimeout(() => {
        if (copyLabel) copyLabel.textContent = "Copy command";
      }, 1800);
    } catch {
      showToast("Copy failed. Select the command manually.");
    }
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
