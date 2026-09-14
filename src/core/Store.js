// ============================================================
//  Store — Reactive state management
//  Single source of truth for the entire OS.
//  Supports deep path access, subscriptions, and middleware.
//
//  Usage:
//    Store.set('windows.active', 3)
//    Store.get('windows.active')       → 3
//    Store.subscribe('windows', cb)    ← fires on any windows.* change
//    Store.patch('settings', { theme: 'dark' })
// ============================================================

import EventBus from "./EventBus.js";

const Store = (() => {
  // ---- INITIAL STATE ----
  // This is the full OS state tree.
  // Every piece of meaningful state lives here.
  const state = {
    os: {
      booted: false,
      bootProgress: 0,
      version: "2.0.0",
      buildDate: "2025-01-06",
    },
    windows: {
      all: [], // Array of window objects
      active: null, // ID of focused window
      nextId: 1,
      nextZIndex: 100,
    },
    apps: {
      open: [], // List of open appIds (for dock indicators)
    },
    music: {
      playing: false,
      currentTime: 84,
      duration: 242,
      track: "Neon Dreams",
      artist: "HyperSpace Radio",
    },
    system: {
      fps: 60,
      cpu: 0,
      memory: 0,
      network: 0,
      gpu: 0,
    },
    settings: {
      theme: "neon-cyan",
      accentColor: "#00f5ff",
      particlesEnabled: true,
      animationsEnabled: true,
      glassmorphismIntensity: 1,
    },
    notifications: {
      queue: [],
    },
    desktop: {
      wallpaper: "nebula",
      iconSize: "medium",
    },
  };

  // ---- SUBSCRIBERS ----
  // Map of path prefix → Set of callbacks
  const subscribers = new Map();

  // ---- MIDDLEWARE ----
  // Run before every set() — can transform or block changes
  const middleware = [];

  // ---- GET ----
  // Supports dot-notation: get('windows.active')
  function get(path) {
    if (!path) return state;

    return path.split(".").reduce((obj, key) => {
      if (obj === undefined || obj === null) return undefined;
      return obj[key];
    }, state);
  }

  // ---- SET ----
  // Deep path setter with subscriber notification
  function set(path, value) {
    // Run middleware chain
    let finalValue = value;
    for (const mw of middleware) {
      const result = mw(path, finalValue, state);
      // Middleware can return false to block the change
      if (result === false) return;
      // Middleware can return a new value to transform
      if (result !== undefined) finalValue = result;
    }

    // Walk the path and set the value
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (obj[key] === undefined || obj[key] === null) obj[key] = {};
      return obj[key];
    }, state);

    const oldValue = target[lastKey];
    target[lastKey] = finalValue;

    // Don't notify if value didn't change (shallow check)
    if (oldValue === finalValue) return;

    // Notify all matching subscribers
    // 'windows.active' change notifies:
    //   → 'windows.active' subscribers
    //   → 'windows' subscribers
    //   → '' (root) subscribers
    notifySubscribers(path, finalValue, oldValue);
  }

  // ---- PATCH ----
  // Shallow merge into an object at path
  // patch('settings', { theme: 'dark' }) merges, doesn't replace
  function patch(path, updates) {
    const current = get(path);
    if (typeof current !== "object" || current === null) {
      throw new Error(`[Store] Cannot patch non-object at "${path}"`);
    }
    set(path, { ...current, ...updates });
  }

  // ---- SUBSCRIBE ----
  // Fires whenever the path or any sub-path changes
  // Returns unsubscribe function
  function subscribe(path, callback) {
    if (!subscribers.has(path)) {
      subscribers.set(path, new Set());
    }
    subscribers.get(path).add(callback);

    return () => {
      const set = subscribers.get(path);
      if (set) {
        set.delete(callback);
        if (set.size === 0) subscribers.delete(path);
      }
    };
  }

  // ---- NOTIFY SUBSCRIBERS ----
  function notifySubscribers(changedPath, newValue, oldValue) {
    const parts = changedPath.split(".");

    // Build all parent paths that should be notified
    // 'windows.active' → ['windows.active', 'windows', '']
    const paths = parts.map((_, i) => parts.slice(0, i + 1).join("."));
    paths.push(""); // root subscribers

    for (const path of paths) {
      const set = subscribers.get(path);
      if (!set) continue;
      for (const cb of [...set]) {
        try {
          cb(newValue, oldValue, changedPath);
        } catch (err) {
          console.error(`[Store] Error in subscriber for "${path}":`, err);
        }
      }
    }

    // Also emit on EventBus so non-Store code can react
    EventBus.emit(`store:${changedPath}`, { value: newValue, old: oldValue });
  }

  // ---- USE MIDDLEWARE ----
  function use(fn) {
    middleware.push(fn);
    return () => {
      const i = middleware.indexOf(fn);
      if (i !== -1) middleware.splice(i, 1);
    };
  }

  // ---- RESET ----
  // Deep clone resets a specific path to initial state
  // (useful if an app wants to reset its own state)
  function reset(path) {
    console.warn(`[Store] reset("${path}") called`);
  }

  // ---- DEBUG ----
  function debug() {
    console.group("[Store] Current State");
    console.log(JSON.parse(JSON.stringify(state)));
    console.groupEnd();
  }

  return { get, set, patch, subscribe, use, debug };
})();

export default Store;
