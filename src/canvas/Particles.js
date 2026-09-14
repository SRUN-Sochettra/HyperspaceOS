// ============================================================
//  Particles.js — Floating ambient particles
//  Tiny glowing dots that drift upward. Pure CSS animation
//  on dynamically created elements.
//
//  Why CSS instead of canvas?
//  - Canvas particles would fight with the background render loop
//  - CSS animations are GPU-composited (no main thread cost)
//  - Each particle is independent — no sync needed
//  - Easy to toggle via Settings (display: none)
// ============================================================

import Store from "../core/Store.js";
import EventBus from "../core/EventBus.js";

const Particles = (() => {
  let container = null;
  let particles = [];
  let enabled = true;

  const CONFIG = {
    count: 18,
    minSize: 1,
    maxSize: 3,
    minDuration: 12, // seconds
    maxDuration: 25,
    minOpacity: 0.15,
    maxOpacity: 0.4,
    maxDrift: 100, // horizontal drift in px
    colors: [
      "rgba(0, 245, 255, VAR)", // cyan
      "rgba(180, 0, 255, VAR)", // purple
      "rgba(255, 255, 255, VAR)", // white
      "rgba(0, 102, 255, VAR)", // blue
    ],
  };

  function init() {
    container = document.body;

    // Create initial batch
    for (let i = 0; i < CONFIG.count; i++) {
      spawnParticle(i * (CONFIG.maxDuration / CONFIG.count));
    }

    // React to settings toggle
    Store.subscribe("settings.particlesEnabled", (val) => {
      enabled = val;
      particles.forEach((p) => {
        p.style.display = enabled ? "" : "none";
      });
    });

    console.log(`[Particles] Spawned ${CONFIG.count} particles`);
  }

  function spawnParticle(delay = 0) {
    const el = document.createElement("div");
    el.className = "particle";

    // Randomize properties
    const x = Math.random() * 100;
    const size =
      CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
    const duration =
      CONFIG.minDuration +
      Math.random() * (CONFIG.maxDuration - CONFIG.minDuration);
    const drift = (Math.random() - 0.5) * CONFIG.maxDrift * 2;
    const opacity =
      CONFIG.minOpacity +
      Math.random() * (CONFIG.maxOpacity - CONFIG.minOpacity);

    // Pick a random color
    const colorTemplate =
      CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    const color = colorTemplate.replace("VAR", opacity.toFixed(2));

    el.style.cssText = `
      left: ${x}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 0 ${size * 3}px ${color};
      --drift: ${drift}px;
      animation-duration: ${duration}s;
      animation-delay: ${-delay}s;
    `;

    if (!enabled) {
      el.style.display = "none";
    }

    container.appendChild(el);
    particles.push(el);

    // When animation ends, respawn with fresh values
    el.addEventListener("animationiteration", () => {
      // Slight variation on each cycle
      const newX = Math.random() * 100;
      const newDrift = (Math.random() - 0.5) * CONFIG.maxDrift * 2;
      el.style.left = `${newX}%`;
      el.style.setProperty("--drift", `${newDrift}px`);
    });
  }

  function destroy() {
    particles.forEach((p) => {
      if (p.parentNode) p.remove();
    });
    particles = [];
    console.log("[Particles] Destroyed");
  }

  return { init, destroy };
})();

export default Particles;
