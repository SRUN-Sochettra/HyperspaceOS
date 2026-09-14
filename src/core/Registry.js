// ============================================================
//  Registry — App registration system
//  Every app registers itself here. The dock, context menu,
//  and terminal all read from the Registry automatically.
//  Adding a new app = one register() call.
//
//  Usage:
//    Registry.register('terminal', { ... })
//    Registry.get('terminal')
//    Registry.all()
//    Registry.launch('terminal')   ← goes through WindowManager
// ============================================================

import EventBus from "./EventBus.js";

const Registry = (() => {
  // Map of appId → app definition
  const apps = new Map();

  // ---- APP DEFINITION SHAPE ----
  // {
  //   id:          string        — unique key, e.g. 'terminal'
  //   title:       string        — display name
  //   icon:        string        — emoji or image URL
  //   width:       number        — default window width
  //   height:      number        — default window height
  //   minWidth:    number        — minimum width (optional, default 300)
  //   minHeight:   number        — minimum height (optional, default 200)
  //   resizable:   boolean       — can user resize? (default true)
  //   singleton:   boolean       — only one instance? (default false)
  //   showInDock:  boolean       — appear in dock? (default true)
  //   category:    string        — 'system' | 'media' | 'productivity' | 'utility'
  //   component:   () => Promise — lazy import of the app module
  //   onOpen:      function      — lifecycle hook (optional)
  //   onClose:     function      — lifecycle hook (optional)
  //   onFocus:     function      — lifecycle hook (optional)
  //   onBlur:      function      — lifecycle hook (optional)
  // }

  // ---- REGISTER ----
  function register(id, definition) {
    if (apps.has(id)) {
      console.warn(
        `[Registry] App "${id}" is already registered — overwriting`,
      );
    }

    // Validate required fields
    const required = ["title", "icon", "width", "height", "component"];
    for (const field of required) {
      if (definition[field] === undefined) {
        throw new Error(
          `[Registry] App "${id}" is missing required field: "${field}"`,
        );
      }
    }

    // Merge with defaults
    const app = {
      id,
      minWidth: 300,
      minHeight: 200,
      resizable: true,
      singleton: false,
      showInDock: true,
      category: "utility",
      onOpen: null,
      onClose: null,
      onFocus: null,
      onBlur: null,
      ...definition,
    };

    apps.set(id, app);

    EventBus.emit("registry:registered", { id, app });

    if (import.meta.env?.DEV) {
      console.log(`[Registry] Registered app: ${id}`);
    }

    return app;
  }

  // ---- GET ONE ----
  function get(id) {
    const app = apps.get(id);
    if (!app) {
      console.warn(`[Registry] App "${id}" not found`);
      return null;
    }
    return app;
  }

  // ---- GET ALL ----
  function all() {
    return [...apps.values()];
  }

  // ---- GET BY CATEGORY ----
  function byCategory(category) {
    return [...apps.values()].filter((app) => app.category === category);
  }

  // ---- GET DOCK APPS ----
  function dockApps() {
    return [...apps.values()].filter((app) => app.showInDock);
  }

  // ---- HAS ----
  function has(id) {
    return apps.has(id);
  }

  // ---- LAUNCH ----
  // Convenience method — emits an event that WindowManager listens to
  // So Registry doesn't need to import WindowManager (avoids circular deps)
  function launch(id, options = {}) {
    if (!has(id)) {
      console.error(`[Registry] Cannot launch unknown app: "${id}"`);
      return;
    }
    EventBus.emit("app:launch", { id, options });
  }

  // ---- UNREGISTER ----
  // Useful for plugins or hot-reloading in dev
  function unregister(id) {
    if (!apps.has(id)) return;
    apps.delete(id);
    EventBus.emit("registry:unregistered", { id });
  }

  // ---- DEBUG ----
  function debug() {
    console.group("[Registry] Registered Apps");
    for (const [id, app] of apps) {
      console.log(`  ${app.icon} ${id} — ${app.title} (${app.category})`);
    }
    console.groupEnd();
  }

  return {
    register,
    get,
    all,
    byCategory,
    dockApps,
    has,
    launch,
    unregister,
    debug,
  };
})();

export default Registry;
