// ============================================================
//  ThemeEngine.js — Complete theme system
//  Supports multiple full themes beyond just accent color.
//  Each theme overrides CSS variables on :root.
// ============================================================

import Store from "./Store.js";
import EventBus from "./EventBus.js";

const THEMES = {
  midnight: {
    name: "Midnight",
    accent: "#00f5ff",
    vars: {
      "--surface-base": "#020206",
      "--surface-0": "rgba(6,6,18,0.97)",
      "--surface-1": "rgba(12,12,30,0.88)",
      "--glass-bg": "rgba(8,8,24,0.6)",
      "--text-primary": "rgba(235,235,255,0.92)",
      "--text-secondary": "rgba(190,195,230,0.52)",
      "--neon-cyan": "#00f5ff",
    },
  },

  aurora: {
    name: "Aurora",
    accent: "#00f5a0",
    vars: {
      "--surface-base": "#020808",
      "--surface-0": "rgba(6,18,14,0.97)",
      "--surface-1": "rgba(10,28,22,0.88)",
      "--glass-bg": "rgba(6,20,16,0.6)",
      "--text-primary": "rgba(230,255,245,0.92)",
      "--text-secondary": "rgba(180,220,200,0.52)",
      "--neon-cyan": "#00f5a0",
      "--neon-purple": "#00c8ff",
    },
  },

  ember: {
    name: "Ember",
    accent: "#ff6b35",
    vars: {
      "--surface-base": "#080302",
      "--surface-0": "rgba(20,8,4,0.97)",
      "--surface-1": "rgba(32,14,8,0.88)",
      "--glass-bg": "rgba(24,10,6,0.6)",
      "--text-primary": "rgba(255,240,230,0.92)",
      "--text-secondary": "rgba(230,190,170,0.52)",
      "--neon-cyan": "#ff6b35",
      "--neon-purple": "#ff3366",
      "--neon-blue": "#ff8c00",
    },
  },

  sakura: {
    name: "Sakura",
    accent: "#ff69b4",
    vars: {
      "--surface-base": "#080206",
      "--surface-0": "rgba(18,6,14,0.97)",
      "--surface-1": "rgba(28,10,22,0.88)",
      "--glass-bg": "rgba(20,8,16,0.6)",
      "--text-primary": "rgba(255,235,245,0.92)",
      "--text-secondary": "rgba(220,180,200,0.52)",
      "--neon-cyan": "#ff69b4",
      "--neon-purple": "#da70d6",
      "--neon-blue": "#ff1493",
    },
  },

  frost: {
    name: "Frost",
    accent: "#88ccff",
    vars: {
      "--surface-base": "#040608",
      "--surface-0": "rgba(8,14,22,0.97)",
      "--surface-1": "rgba(14,24,36,0.88)",
      "--glass-bg": "rgba(10,18,28,0.55)",
      "--glass-blur": "48px",
      "--text-primary": "rgba(220,235,255,0.95)",
      "--text-secondary": "rgba(170,195,230,0.55)",
      "--neon-cyan": "#88ccff",
      "--neon-purple": "#6699cc",
    },
  },

  void: {
    name: "Void",
    accent: "#b400ff",
    vars: {
      "--surface-base": "#030008",
      "--surface-0": "rgba(8,2,18,0.97)",
      "--surface-1": "rgba(16,6,32,0.88)",
      "--glass-bg": "rgba(12,4,24,0.6)",
      "--text-primary": "rgba(240,230,255,0.92)",
      "--text-secondary": "rgba(200,180,230,0.52)",
      "--neon-cyan": "#b400ff",
      "--neon-purple": "#8800cc",
      "--neon-blue": "#6600ff",
    },
  },

  terminal: {
    name: "Terminal",
    accent: "#33ff33",
    vars: {
      "--surface-base": "#000800",
      "--surface-0": "rgba(0,12,0,0.97)",
      "--surface-1": "rgba(0,20,0,0.88)",
      "--glass-bg": "rgba(0,14,0,0.6)",
      "--text-primary": "rgba(200,255,200,0.92)",
      "--text-secondary": "rgba(100,200,100,0.52)",
      "--neon-cyan": "#33ff33",
      "--neon-purple": "#00cc44",
      "--neon-blue": "#00ff66",
      "--neon-green": "#66ff66",
    },
  },
};

const ThemeEngine = (() => {
  let currentTheme = "midnight";

  function init() {
    const saved = Store.get("settings.theme");
    if (saved && THEMES[saved]) {
      apply(saved);
    }

    console.log("[ThemeEngine] Initialized");
  }

  function apply(themeName) {
    const theme = THEMES[themeName];
    if (!theme) return;

    currentTheme = themeName;

    const root = document.documentElement;

    // Apply all CSS variable overrides
    for (const [key, value] of Object.entries(theme.vars)) {
      root.style.setProperty(key, value);
    }

    // Compute accent RGB for rgba() usage
    const accent = theme.accent;
    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);

    root.style.setProperty("--neon-cyan", accent);
    root.style.setProperty("--neon-cyan-rgb", `${r}, ${g}, ${b}`);
    root.style.setProperty("--neon-cyan-dim", `rgba(${r}, ${g}, ${b}, 0.12)`);
    root.style.setProperty("--neon-cyan-glow", `rgba(${r}, ${g}, ${b}, 0.35)`);
    root.style.setProperty(
      "--glass-border-focus",
      `rgba(${r}, ${g}, ${b}, 0.25)`,
    );

    Store.set("settings.theme", themeName);
    Store.set("settings.accentColor", accent);

    EventBus.emit("theme:changed", { theme: themeName });

    console.log(`[ThemeEngine] Applied theme: ${themeName}`);
  }

  function getCurrent() {
    return currentTheme;
  }
  function getAll() {
    return THEMES;
  }
  function getTheme(name) {
    return THEMES[name];
  }

  return { init, apply, getCurrent, getAll, getTheme };
})();

export default ThemeEngine;
