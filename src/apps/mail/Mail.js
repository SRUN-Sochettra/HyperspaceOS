import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";
import { renderSafeMarkdown } from "../../utils/safeDom.js";

const MAIL_PATH = "/home/root/mail-local.json";
const DEFAULT_MAIL = [{ id: "welcome", sender: "HyperSpace", subject: "Welcome to HyperSpace", snippet: "A local browser desktop demonstration.", body: "# Welcome\nHyperSpace is a **local browser demonstration** with a virtual filesystem. Mail messages created here are stored locally and are not delivered over a network.", date: "Included sample", read: false, folder: "inbox" }];

export default class Mail extends BaseApp {
  async setup() {
    this.activeEmailId = null; this.emails = this.loadState();
    this.container.innerHTML = `<div class="mail-container"><aside class="mail-sidebar" aria-label="Local mail folders"><div class="mail-sidebar-header"><h2>Local Mail</h2><button type="button" class="mail-compose-btn" id="mail-compose-${this.windowId}">Compose</button></div><div class="mail-list" id="mail-list-${this.windowId}" role="list"></div></aside><main class="mail-content"><div class="mail-view" id="mail-view-${this.windowId}"><div class="mail-empty-state"><div>Select a local message to read</div></div></div></main></div>`;
    this.listEl = this.$(`#mail-list-${this.windowId}`); this.viewEl = this.$(`#mail-view-${this.windowId}`);
    this.listenTo(this.$(`#mail-compose-${this.windowId}`), "click", () => this.composeEmail()); this.renderList();
  }
  loadState() { try { const raw = FileSystem.exists(MAIL_PATH) && FileSystem.readFile(MAIL_PATH); const value = raw && JSON.parse(raw); return Array.isArray(value) ? value : DEFAULT_MAIL.map(x => ({...x})); } catch { return DEFAULT_MAIL.map(x => ({...x})); } }
  saveState() { const result = FileSystem.writeFile(MAIL_PATH, JSON.stringify(this.emails, null, 2)); if (!result?.success) { this.notify("", "Mail not saved", result?.error || "Virtual filesystem write failed."); return false; } return true; }
  renderList() {
    this.listEl.replaceChildren();
    for (const email of this.emails) {
      const button = this.createElement("button", `mail-item${this.activeEmailId === email.id ? " active" : ""}${!email.read ? " unread" : ""}`); button.type = "button"; button.dataset.id = email.id; button.setAttribute("role", "listitem");
      const header = this.createElement("span", "mail-item-header"); header.append(this.createElement("span", "mail-item-sender", email.sender), this.createElement("span", "mail-item-date", email.date));
      button.append(header, this.createElement("span", "mail-item-subject", email.subject), this.createElement("span", "mail-item-snippet", email.snippet));
      this.listenTo(button, "click", () => this.loadEmail(email.id)); this.listEl.append(button);
    }
  }
  loadEmail(id) {
    const email = this.emails.find(x => x.id === id); if (!email) return; this.activeEmailId = id; email.read = true; this.saveState(); this.renderList(); this.viewEl.replaceChildren();
    const header = this.createElement("header", "mail-view-header"); header.append(this.createElement("h2", "mail-view-subject", email.subject));
    const meta = this.createElement("div", "mail-view-meta"); meta.append(this.createElement("div", "mail-view-sender", `From: ${email.sender}`), this.createElement("div", "mail-view-date", email.date)); header.append(meta);
    const body = this.createElement("div", "mail-view-body markdown-body"); body.innerHTML = renderSafeMarkdown(email.body); this.viewEl.append(header, body);
  }
  composeEmail() {
    this.activeEmailId = null; this.renderList(); this.viewEl.innerHTML = `<form class="mail-compose-view" id="mail-form-${this.windowId}"><p>This is a local simulation. Send stores the message in a local Sent state and does not deliver email.</p><label>To<input type="email" required class="mail-input" name="to" autocomplete="email"></label><label>Subject<input type="text" required class="mail-input" name="subject" maxlength="200"></label><label>Message<textarea required class="mail-textarea" name="body"></textarea></label><div class="mail-compose-actions"><button type="submit" class="mail-btn primary">Save to Sent</button><button type="button" class="mail-btn" data-action="draft">Save draft</button><button type="button" class="mail-btn" data-action="discard">Discard</button></div><div class="mail-compose-status" role="status" aria-live="polite"></div></form>`;
    const form = this.$(`#mail-form-${this.windowId}`); const status = form.querySelector(".mail-compose-status");
    const collect = (folder) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, sender: folder === "sent" ? `To: ${form.elements.to.value.trim()}` : "Draft", subject: form.elements.subject.value.trim() || "(No subject)", snippet: form.elements.body.value.trim().slice(0, 100), body: form.elements.body.value, date: folder === "sent" ? "Simulated sent locally" : "Draft", read: true, folder });
    this.listenTo(form, "submit", e => { e.preventDefault(); if (!form.reportValidity()) return; this.emails.unshift(collect("sent")); if (this.saveState()) { status.textContent = "Saved to local Sent. No email was delivered."; this.renderList(); } });
    this.listenTo(form.querySelector('[data-action="draft"]'), "click", () => { this.emails.unshift(collect("draft")); if (this.saveState()) { status.textContent = "Draft saved locally."; this.renderList(); } });
    this.listenTo(form.querySelector('[data-action="discard"]'), "click", () => { this.viewEl.replaceChildren(this.createElement("div", "mail-empty-state", "Draft discarded. Select a local message to read.")); this.$(`#mail-compose-${this.windowId}`).focus(); });
    form.elements.to.focus();
  }
}
