// ============================================================
//  BootScreen.js — Boot sequence controller
//  The HTML is already in index.html (renders before JS).
//  This module just controls the progress bar and dismissal.
// ============================================================

import Store from "../core/Store.js";

const BootScreen = (() => {
  let container = null;
  let progressBar = null;
  let unsubscribe = null;

  function init() {
    container = document.getElementById("boot-screen");
    progressBar = document.getElementById("boot-bar");

    if (!container || !progressBar) {
      console.warn("[BootScreen] Boot screen elements not found");
      return;
    }

    // React to progress changes from OS.js
    unsubscribe = Store.subscribe("os.bootProgress", (value) => {
      if (progressBar) {
        progressBar.style.width = `${value}%`;
      }
    });
  }

  function dismiss() {
    if (!container) return;

    container.classList.add("hidden");

    // Remove from DOM after transition completes
    setTimeout(() => {
      if (container && container.parentNode) {
        container.remove();
      }
      if (unsubscribe) unsubscribe();
      container = null;
      progressBar = null;
    }, 1000);
  }

  return { init, dismiss };
})();

export default BootScreen;
