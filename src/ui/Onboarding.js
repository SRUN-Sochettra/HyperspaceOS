// ============================================================
//  Onboarding.js — First-time walkthrough
//  Shows a step-by-step tour highlighting key features.
//  Only shows once (tracked in localStorage).
// ============================================================

import EventBus from "../core/EventBus.js";

const STORAGE_KEY = "hyperspace-onboarding-done";

const Onboarding = (() => {
  let overlay = null;
  let currentStep = 0;

  const STEPS = [
    {
      title: "Welcome to HyperSpace OS! 🚀",
      body: "A fully functional web-based operating system. Let me show you around.",
      position: "center",
    },
    {
      title: "The Dock",
      body: "Click icons to launch apps. Hover for tooltips. Active apps show a dot.",
      target: "#dock",
      position: "top",
    },
    {
      title: "Status Bar",
      body: "Shows the current app, FPS counter, connection status, and clock.",
      target: "#statusbar",
      position: "bottom",
    },
    {
      title: "Window Management",
      body: "Drag titlebars to move. Drag edges to snap to half/quarter screen. Use traffic light buttons to close, minimize, or maximize.",
      position: "center",
    },
    {
      title: "Spotlight Search",
      body: "Press Ctrl+Space anytime to search for apps, files, and actions.",
      position: "center",
      highlight: true,
    },
    {
      title: "Virtual Desktops",
      body: "Press Ctrl+1 through Ctrl+4 to switch between workspaces. Each one remembers its windows.",
      position: "center",
    },
    {
      title: "Terminal Power",
      body: 'The terminal has 40+ commands. Try "neofetch", "edit README.md", or "cowsay hello". Tab autocompletes file paths.',
      position: "center",
    },
    {
      title: "Real File System",
      body: "Create, edit, and delete files. Changes in Terminal show in Files app and vice versa. Everything persists across refreshes.",
      position: "center",
    },
    {
      title: "Right-Click Everything",
      body: "Context menus are everywhere — desktop, files, folders. Try right-clicking!",
      position: "center",
    },
    {
      title: "You're Ready! 🎉",
      body: 'Explore, customize, and make it yours. Open Settings to change themes, or type "help" in the terminal.',
      position: "center",
    },
  ];

  function init() {
    // Only show if never completed
    if (localStorage.getItem(STORAGE_KEY)) return;

    EventBus.on("os:boot:complete", () => {
      // Start tour after boot animation finishes
      setTimeout(start, 2500);
    });
  }

  function start() {
    currentStep = 0;
    showStep();
  }

  function showStep() {
    if (currentStep >= STEPS.length) {
      finish();
      return;
    }

    removeOverlay();

    const step = STEPS[currentStep];

    overlay = document.createElement("div");
    overlay.className = "onboarding-overlay";

    // Highlight target element if specified
    let targetRect = null;
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) targetRect = el.getBoundingClientRect();
    }

    const isCenter = step.position === "center" || !targetRect;

    overlay.innerHTML = `
      <div class="onboarding-backdrop"></div>
      <div class="onboarding-card ${isCenter ? "center" : ""}" id="ob-card">
        <div class="onboarding-step-indicator">
          ${STEPS.map((_, i) => `<div class="ob-dot ${i === currentStep ? "active" : ""} ${i < currentStep ? "done" : ""}"></div>`).join("")}
        </div>
        <div class="onboarding-title">${step.title}</div>
        <div class="onboarding-body">${step.body}</div>
        <div class="onboarding-actions">
          <button class="onboarding-skip" id="ob-skip">Skip Tour</button>
          <div style="flex:1"></div>
          ${currentStep > 0 ? '<button class="onboarding-back glass-btn" id="ob-back">Back</button>' : ""}
          <button class="onboarding-next glass-btn primary" id="ob-next">
            ${currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Position card relative to target
    if (targetRect && !isCenter) {
      const card = overlay.querySelector("#ob-card");
      if (step.position === "top") {
        card.style.position = "fixed";
        card.style.bottom = window.innerHeight - targetRect.top + 16 + "px";
        card.style.left = "50%";
        card.style.transform = "translateX(-50%)";
      } else if (step.position === "bottom") {
        card.style.position = "fixed";
        card.style.top = targetRect.bottom + 16 + "px";
        card.style.left = "50%";
        card.style.transform = "translateX(-50%)";
      }
    }

    // Bind buttons
    overlay.querySelector("#ob-next")?.addEventListener("click", () => {
      currentStep++;
      showStep();
    });

    overlay.querySelector("#ob-back")?.addEventListener("click", () => {
      currentStep = Math.max(0, currentStep - 1);
      showStep();
    });

    overlay.querySelector("#ob-skip")?.addEventListener("click", finish);

    // Escape to skip
    const escHandler = (e) => {
      if (e.key === "Escape") {
        finish();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  function finish() {
    removeOverlay();
    localStorage.setItem(STORAGE_KEY, "true");

    EventBus.emit("notification:show", {
      icon: "💡",
      title: "Tip",
      body: "Press Ctrl+Space for Spotlight Search anytime!",
    });
  }

  function removeOverlay() {
    if (overlay?.parentNode) overlay.remove();
    overlay = null;
  }

  // Reset for testing
  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[Onboarding] Reset. Reload to see tour again.");
  }

  return { init, start, reset };
})();

export default Onboarding;
