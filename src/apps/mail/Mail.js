import BaseApp from "../BaseApp.js";

export default class Mail extends BaseApp {
  async setup() {
    this.activeEmailId = null;

    this.emails = [
      {
        id: 1,
        sender: "HyperSpace Team",
        subject: "Welcome to HyperSpace OS v2.0",
        snippet: "Experience the future of the web with our new OS.",
        body: `
# Welcome to HyperSpace OS v2.0

We are thrilled to have you here! This update brings a massive overhaul to the interface, performance, and features.

## What's New?
* **Glassmorphism UI**: A stunning new visual language.
* **Virtual File System**: Real persistence for your data.
* **New Apps**: Mail, Whiteboard, AI Assistant, and more!

Enjoy your stay in HyperSpace!

Cheers,
The HyperSpace Team
        `,
        date: "Today",
        read: false,
      },
      {
        id: 2,
        sender: "GitHub Alerts",
        subject: "Action required: Dependencies update",
        snippet: "Please review the latest dependabot alerts for your repo.",
        body: `
**Security Alert**

Dependabot found a vulnerability in one of your dependencies.
Please review the alert and merge the PR.

Repository: \`hyperspace-os\`
Severity: High

[Review PR on GitHub](#)
        `,
        date: "Yesterday",
        read: true,
      },
      {
        id: 3,
        sender: "Alice Smith",
        subject: "Meeting notes from yesterday",
        snippet: "Here are the notes we took during our sync...",
        body: `
Hi,

Here are the notes we took during our sync yesterday:

*   Discussed the new design system.
*   Agreed on the tech stack (Vite + Vanilla JS).
*   Target release date: end of Q3.

Let me know if I missed anything!

Best,
Alice
        `,
        date: "Last Week",
        read: true,
      }
    ];

    this.container.innerHTML = `
      <div class="mail-container">
        <div class="mail-sidebar">
          <div class="mail-sidebar-header">
            <h2>Inbox</h2>
            <button class="mail-compose-btn" id="mail-compose-${this.windowId}">Compose</button>
          </div>
          <div class="mail-list" id="mail-list-${this.windowId}"></div>
        </div>
        <div class="mail-content">
          <div class="mail-view" id="mail-view-${this.windowId}">
            <div class="mail-empty-state">
              <div class="mail-empty-icon">✉️</div>
              <div>Select an email to read</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.listEl = this.$(`#mail-list-${this.windowId}`);
    this.viewEl = this.$(`#mail-view-${this.windowId}`);
    this.composeBtn = this.$(`#mail-compose-${this.windowId}`);

    this.composeBtn.addEventListener("click", () => {
        this.composeEmail();
    });

    // We use Marked for Markdown rendering if available, else fallback
    try {
      const { marked } = await import("marked");
      this.marked = marked;
      this.marked.setOptions({ breaks: true, gfm: true });
    } catch(e) {
      console.warn("Marked not available for Mail app.");
    }

    this.renderList();
  }

  renderList() {
    this.listEl.innerHTML = this.emails
      .map((email) => {
        const isActive = this.activeEmailId === email.id;
        const isUnread = !email.read;
        return `
        <div class="mail-item ${isActive ? "active" : ""} ${isUnread ? "unread" : ""}" data-id="${email.id}">
          <div class="mail-item-header">
            <span class="mail-item-sender">${email.sender}</span>
            <span class="mail-item-date">${email.date}</span>
          </div>
          <div class="mail-item-subject">${email.subject}</div>
          <div class="mail-item-snippet">${email.snippet}</div>
        </div>
      `;
      })
      .join("");

    this.listEl.querySelectorAll(".mail-item").forEach((el) => {
      el.addEventListener("click", () => this.loadEmail(parseInt(el.dataset.id)));
    });
  }

  loadEmail(id) {
    this.activeEmailId = id;
    const email = this.emails.find(e => e.id === id);
    if (!email) return;

    if (!email.read) {
        email.read = true;
        this.renderList(); // Re-render to update unread status in list
    }

    const bodyHtml = this.marked ? this.marked.parse(email.body) : email.body.replace(/\\n/g, '<br>');

    this.viewEl.innerHTML = `
      <div class="mail-view-header">
        <h2 class="mail-view-subject">${email.subject}</h2>
        <div class="mail-view-meta">
          <div class="mail-view-sender">From: <strong>${email.sender}</strong></div>
          <div class="mail-view-date">${email.date}</div>
        </div>
      </div>
      <div class="mail-view-body markdown-body">
        ${bodyHtml}
      </div>
    `;

    // Re-render list to update active state
    this.renderList();
  }

  composeEmail() {
      this.viewEl.innerHTML = `
        <div class="mail-compose-view">
            <input type="text" placeholder="To" class="mail-input">
            <input type="text" placeholder="Subject" class="mail-input">
            <textarea placeholder="Write your message..." class="mail-textarea"></textarea>
            <div class="mail-compose-actions">
                <button class="mail-btn primary">Send</button>
                <button class="mail-btn">Discard</button>
            </div>
        </div>
      `;
      this.activeEmailId = null;
      this.renderList();
  }
}
