// ============================================================
//  ContextMenu.js — Right-click menu on desktop
//  Dynamic items based on context (desktop vs window vs dock).
//  Auto-closes on click or outside click.
// ============================================================

import EventBus from "../core/EventBus.js";
import Registry from "../core/Registry.js";

const ContextMenu = (() => {
  let container = null;
  let currentMenu = null;

  function init() {
    container = document.getElementById("context-menu-container");
    if (!container) return;

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("mousedown", onClickOutside);
  }

  function onContextMenu(e) {
    // Don't override context menu inside windows (apps handle their own)
    if (e.target.closest(".hyper-window")) return;
    if (e.target.closest("#dock")) return;

    e.preventDefault();
    close();

    const items = buildDesktopMenu();
    show(e.clientX, e.clientY, items);
  }

  function buildDesktopMenu() {
    const items = [
      {
        icon: "⌨️",
        label: "Open Terminal",
        action: () => Registry.launch("terminal"),
      },
      {
        icon: "📊",
        label: "System Monitor",
        action: () => Registry.launch("sysmon"),
      },
      { type: "separator" },
      {
        icon: "📁",
        label: "Open Files",
        action: () => Registry.launch("files"),
      },
      {
        icon: "⚙️",
        label: "Settings",
        action: () => Registry.launch("settings"),
      },
      { type: "separator" },
      {
        icon: "⊞",
        label: "Tile All Windows",
        action: () => EventBus.emit("window:tile"),
      },
      {
        icon: "🎨",
        label: "Change Theme",
        action: () =>
          EventBus.emit("notification:show", {
            icon: "🎨",
            title: "Theme",
            body: "Open Settings to change theme.",
          }),
      },
      { type: "separator" },
      {
        icon: "ℹ️",
        label: "About HyperSpace",
        action: () =>
          EventBus.emit("notification:show", {
            icon: "⬡",
            title: "HyperSpace OS v2.0",
            body: "Built with vanilla JS, Canvas, and too much caffeine.",
          }),
      },
    ];

    return items;
  }

  function show(x, y, items) {
    const menu = document.createElement("div");
    menu.className = "context-menu";

    menu.innerHTML = items
      .map((item) => {
        if (item.type === "separator") {
          return `<div class="ctx-separator"></div>`;
        }
        return `
        <div class="ctx-item" data-action-id="${Math.random()}">
          <span class="ctx-item-icon">${item.icon}</span>
          <span class="ctx-item-label">${item.label}</span>
          ${item.shortcut ? `<span class="ctx-item-shortcut">${item.shortcut}</span>` : ""}
        </div>
      `;
      })
      .join("");

    // Bind click handlers
    const actionItems = items.filter((i) => i.type !== "separator");
    menu.querySelectorAll(".ctx-item").forEach((el, i) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (actionItems[i]?.action) {
          actionItems[i].action();
        }
        close();
      });
    });

    // Position — keep within viewport
    container.appendChild(menu);

    const rect = menu.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) {
      x = window.innerWidth - rect.width - 8;
    }
    if (y + rect.height > window.innerHeight) {
      y = window.innerHeight - rect.height - 8;
    }

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    currentMenu = menu;
  }

  function close() {
    if (currentMenu) {
      currentMenu.remove();
      currentMenu = null;
    }
  }

  function onClickOutside(e) {
    if (!currentMenu) return;
    if (!currentMenu.contains(e.target)) {
      close();
    }
  }

  function destroy() {
    document.removeEventListener("contextmenu", onContextMenu);
    document.removeEventListener("mousedown", onClickOutside);
    close();
  }

  return { init, close, destroy };
})();

export default ContextMenu;
