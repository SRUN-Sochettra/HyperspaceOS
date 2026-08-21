// ============================================================
//  Dock.js — Bottom taskbar / dock
//  Reads from Registry to build icons automatically.
//  Reacts to Store changes for active indicators.
//  Handles hover animations via CSS, click → launch via EventBus.
// ============================================================

import Registry from "../core/Registry.js";
import Store from "../core/Store.js";
import EventBus from "../core/EventBus.js";

const Dock = (() => {
  let container = null;
  let unsubscribe = null;

  function init() {
    container = document.getElementById("dock");
    if (!container) return;

    // Build dock from Registry
    buildDock();

    // Rebuild if an app is registered later (plugin system)
    EventBus.on("registry:registered", () => buildDock());
    EventBus.on("registry:unregistered", () => buildDock());

    // Update active indicators when open apps change
    unsubscribe = Store.subscribe("apps.open", () => updateIndicators());

    // Show after boot
    EventBus.on("os:boot:complete", () => {
      container.classList.add("visible");
    });

    // Handle dock clicks via delegation
    container.addEventListener("click", (e) => {
      const item = e.target.closest(".dock-item");
      if (!item) return;

      const appId = item.dataset.app;
      if (!appId) return;

      Registry.launch(appId);

      // Bounce animation
      item.classList.add("dock-bounce");
      setTimeout(() => item.classList.remove("dock-bounce"), 400);
    });
  }

  function buildDock() {
    const apps = Registry.dockApps();

    // Group by category for separators
    const categories = ["system", "productivity", "media", "utility"];
    const grouped = [];
    let lastCategory = null;

    // Sort apps into category order
    const sorted = [...apps].sort((a, b) => {
      return categories.indexOf(a.category) - categories.indexOf(b.category);
    });

    for (const app of sorted) {
      if (lastCategory && app.category !== lastCategory) {
        grouped.push({ type: "separator" });
      }
      grouped.push({ type: "app", app });
      lastCategory = app.category;
    }

    // Render
    container.innerHTML = grouped
      .map((item) => {
        if (item.type === "separator") {
          return `<div class="dock-separator"></div>`;
        }
        return `
        <div class="dock-item" data-app="${item.app.id}">
          <span class="dock-item-icon">${item.app.icon}</span>
          <div class="dock-tooltip">${item.app.title}</div>
          <div class="dock-indicator"></div>
        </div>
      `;
      })
      .join("");

    updateIndicators();
  }

  function updateIndicators() {
    const openApps = Store.get("apps.open") || [];

    container.querySelectorAll(".dock-item").forEach((item) => {
      const appId = item.dataset.app;
      const isOpen = openApps.includes(appId);
      item.classList.toggle("active", isOpen);
    });
  }

  function destroy() {
    if (unsubscribe) unsubscribe();
  }

  return { init, destroy };
})();

export default Dock;
