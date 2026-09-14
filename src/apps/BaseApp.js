import EventBus from "../core/EventBus.js";
import Store from "../core/Store.js";

export default class BaseApp {
  constructor({ windowId, container }) {
    this.windowId = windowId;
    this.container = container;
    this.subscriptions = [];
    this.intervals = [];
    this.timeouts = [];
    this.animationFrames = [];
    this.cleanups = [];
    this.destroyed = false;
  }

  async mount() {
    await this.setup();
  }

  async setup() {}
  onDestroy() {}
  onFocus() {}
  onBlur() {}

  $(selector) {
    return this.container.querySelector(selector);
  }

  $$(selector) {
    return this.container.querySelectorAll(selector);
  }

  createElement(tag, className = "", text = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== "") el.textContent = String(text);
    return el;
  }

  listen(event, handler) {
    const unsub = EventBus.on(event, handler);
    this.subscriptions.push(unsub);
    return unsub;
  }

  subscribe(key, handler) {
    const unsub = Store.subscribe(key, handler);
    this.subscriptions.push(unsub);
    return unsub;
  }

  addCleanup(cleanup) {
    this.cleanups.push(cleanup);
    return cleanup;
  }

  listenTo(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    return this.addCleanup(() => target.removeEventListener(event, handler, options));
  }

  addInterval(fn, ms) {
    const id = setInterval(() => {
      if (!this.destroyed) fn();
    }, ms);
    this.intervals.push(id);
    return id;
  }

  addTimeout(fn, ms) {
    const id = setTimeout(() => {
      if (!this.destroyed) fn();
    }, ms);
    this.timeouts.push(id);
    return id;
  }

  addAnimationFrame(fn) {
    const id = requestAnimationFrame((time) => {
      this.animationFrames = this.animationFrames.filter((frame) => frame !== id);
      if (!this.destroyed) fn(time);
    });
    this.animationFrames.push(id);
    return id;
  }

  notify(icon, title, body) {
    EventBus.emit("notification:show", { icon, title, body });
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    let firstError = null;
    const run = (fn) => {
      try { fn(); } catch (error) {
        firstError ||= error;
        console.error("[BaseApp] Cleanup failed:", error);
      }
    };
    for (const unsub of this.subscriptions.splice(0)) run(unsub);
    for (const id of this.intervals.splice(0)) clearInterval(id);
    for (const id of this.timeouts.splice(0)) clearTimeout(id);
    for (const id of this.animationFrames.splice(0)) cancelAnimationFrame(id);
    for (const cleanup of this.cleanups.splice(0).reverse()) run(cleanup);
    run(() => this.onDestroy());
    if (this.container) this.container.replaceChildren();
    if (firstError) throw firstError;
  }
}
