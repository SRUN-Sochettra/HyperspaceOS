// ============================================================
//  EventBus — Pub/Sub system
//  The nervous system of the OS. Apps never talk to each other
//  directly. They publish events and subscribe to them.
//
//  Usage:
//    EventBus.on('music:play', handler)
//    EventBus.emit('music:play', { track: 'Neon Dreams' })
//    EventBus.off('music:play', handler)
//    EventBus.once('os:boot', handler)   ← fires once, auto-removes
// ============================================================

const EventBus = (() => {
  // Map of eventName → Set of handlers
  const listeners = new Map();

  // ---- SUBSCRIBE ----
  function on(event, handler) {
    if (typeof handler !== "function") {
      throw new Error(`[EventBus] Handler for "${event}" must be a function`);
    }
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(handler);

    // Return unsubscribe function — lets callers clean up easily
    // e.g. const unsub = EventBus.on('x', fn)
    //      unsub() ← removes listener
    return () => off(event, handler);
  }

  // ---- SUBSCRIBE ONCE ----
  function once(event, handler) {
    const wrapper = (data) => {
      handler(data);
      off(event, wrapper);
    };
    return on(event, wrapper);
  }

  // ---- UNSUBSCRIBE ----
  function off(event, handler) {
    const set = listeners.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) listeners.delete(event);
  }

  // ---- PUBLISH ----
  // Events that fire too often to log
  const QUIET_EVENTS = new Set([
    "store:system.fps",
    "store:system.cpu",
    "store:system.mem",
    "store:system.gpu",
    "store:windows.active",
    "store:windows.all",
    "store:apps.open",
  ]);

  function emit(event, data) {
    if (import.meta.env?.DEV && !QUIET_EVENTS.has(event)) {
      console.log(`[EventBus] ${event}`, data ?? "");
    }

    const set = listeners.get(event);
    if (!set || set.size === 0) return;

    for (const handler of [...set]) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }
  }

  // ---- DEBUG UTIL ----
  // Call EventBus.debug() in console to see all active listeners
  function debug() {
    console.group("[EventBus] Active listeners");
    for (const [event, set] of listeners) {
      console.log(`  ${event}: ${set.size} handler(s)`);
    }
    console.groupEnd();
  }

  // ---- CLEAR ALL ----
  // Used during OS shutdown/restart
  function clear() {
    listeners.clear();
  }

  return { on, off, once, emit, debug, clear };
})();

export default EventBus;
