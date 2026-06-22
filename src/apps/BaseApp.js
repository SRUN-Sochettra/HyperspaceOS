import EventBus from "../core/EventBus.js";
import Store from "../core/Store.js";

export default class BaseApp {
  constructor({ windowId, container }) {
    this.windowId = windowId;
    this.container = container;
    this.subscriptions = [];
    this.intervals = [];
    this.timeouts = [];
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

  createElement(tag, className = "", innerHTML = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  }

  listen(event, handler) {
    const unsub = EventBus.on(event, handler);
    this.subscriptions.push(unsub);
    return unsub;
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

  notify(icon, title, body) {
    EventBus.emit("notification:show", { icon, title, body });
  }

  destroy() {
    this.destroyed = true;
    for (const unsub of this.subscriptions) unsub();
    this.subscriptions = [];
    for (const id of this.intervals) clearInterval(id);
    this.intervals = [];
    for (const id of this.timeouts) clearTimeout(id);
    this.timeouts = [];
    this.onDestroy();
    if (this.container) this.container.innerHTML = "";
  }
}
