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

  async mount() { await this.setup(); }
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

  createElement(tag, className = "", innerHTML = "") {
  $(selector) { return this.container.querySelector(selector); }
  $$(selector) { return this.container.querySelectorAll(selector); }
  createElement(tag, className = "", text = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    if (text !== "") el.textContent = String(text);
    return el;
  }

  listen(event, handler) {
    const unsub = EventBus.on(event, handler);
    this.subscriptions.push(unsub);
    return unsub;
  listen(event, handler) { const unsub = EventBus.on(event, handler); this.subscriptions.push(unsub); return unsub; }
  subscribe(key, handler) { const unsub = Store.subscribe(key, handler); this.subscriptions.push(unsub); return unsub; }
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
  addCleanup(cleanup) { this.cleanups.push(cleanup); return cleanup; }
  addInterval(fn, ms) { const id = setInterval(() => { if (!this.destroyed) fn(); }, ms); this.intervals.push(id); return id; }
  addTimeout(fn, ms) { const id = setTimeout(() => { if (!this.destroyed) fn(); }, ms); this.timeouts.push(id); return id; }
  addAnimationFrame(fn) {
    const id = requestAnimationFrame((time) => { this.animationFrames = this.animationFrames.filter((x) => x !== id); if (!this.destroyed) fn(time); });
    this.animationFrames.push(id); return id;
  }

  addTimeout(fn, ms) {
    const id = setTimeout(() => {
      if (!this.destroyed) fn();
    }, ms);
    this.timeouts.push(id);
    return id;
  }

  notify(icon, title, body) {
    EventBus.emit("notification:show", { icon, title, body });
  }

  notify(icon, title, body) { EventBus.emit("notification:show", { icon, title, body }); }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const unsub of this.subscriptions) unsub();
    this.subscriptions = [];
    for (const id of this.intervals) clearInterval(id);
    this.intervals = [];
    for (const id of this.timeouts) clearTimeout(id);
    this.timeouts = [];
    this.onDestroy();
    if (this.container) this.container.innerHTML = "";
    let firstError = null;
    const run = (fn) => { try { fn(); } catch (error) { firstError ||= error; console.error('[BaseApp] Cleanup failed:', error); } };
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
