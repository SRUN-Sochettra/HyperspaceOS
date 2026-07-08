import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";

export default class Contacts extends BaseApp {
  async setup() {
    this.contactsPath = "/home/root/contacts.json";
    this.contacts = [];

    this.container.innerHTML = `
      <div class="contacts-app">
        <div class="contacts-header">
          <h2>Contacts</h2>
          <div class="contacts-form">
            <input type="text" id="contact-name-${this.windowId}" class="contacts-input" placeholder="Name" />
            <input type="text" id="contact-phone-${this.windowId}" class="contacts-input" placeholder="Phone" />
            <input type="email" id="contact-email-${this.windowId}" class="contacts-input" placeholder="Email" />
            <button id="add-contact-${this.windowId}" class="contacts-btn">Add</button>
          </div>
        </div>
        <div class="contacts-list" id="contacts-list-${this.windowId}">
          <!-- Contacts will be rendered here -->
        </div>
      </div>
    `;

    this.nameInput = this.$(`#contact-name-${this.windowId}`);
    this.phoneInput = this.$(`#contact-phone-${this.windowId}`);
    this.emailInput = this.$(`#contact-email-${this.windowId}`);
    this.addButton = this.$(`#add-contact-${this.windowId}`);
    this.listContainer = this.$(`#contacts-list-${this.windowId}`);

    this.addButton.addEventListener("click", () => this.addContact());

    this.loadContacts();
  }

  addContact() {
    const name = this.nameInput.value.trim();
    const phone = this.phoneInput.value.trim();
    const email = this.emailInput.value.trim();

    if (!name) {
      this.notify("⚠️", "Error", "Name is required.");
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name,
      phone,
      email
    };

    this.contacts.push(newContact);
    this.saveContacts();
    this.renderContacts();

    this.nameInput.value = "";
    this.phoneInput.value = "";
    this.emailInput.value = "";
  }

  deleteContact(id) {
    this.contacts = this.contacts.filter(c => c.id !== id);
    this.saveContacts();
    this.renderContacts();
  }

  renderContacts() {
    this.listContainer.innerHTML = "";

    if (this.contacts.length === 0) {
      this.listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 20px;">No contacts found.</div>`;
      return;
    }

    this.contacts.forEach(contact => {
      const card = document.createElement("div");
      card.className = "contact-card";

      const info = document.createElement("div");
      info.className = "contact-info";

      const nameEl = document.createElement("div");
      nameEl.className = "contact-name";
      nameEl.textContent = contact.name;
      info.appendChild(nameEl);

      if (contact.phone) {
        const phoneEl = document.createElement("div");
        phoneEl.className = "contact-phone";
        phoneEl.textContent = `📞 ${contact.phone}`;
        info.appendChild(phoneEl);
      }

      if (contact.email) {
        const emailEl = document.createElement("div");
        emailEl.className = "contact-email";
        emailEl.textContent = `📧 ${contact.email}`;
        info.appendChild(emailEl);
      }

      const actions = document.createElement("div");

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "contact-delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => this.deleteContact(contact.id));
      actions.appendChild(deleteBtn);

      card.appendChild(info);
      card.appendChild(actions);

      this.listContainer.appendChild(card);
    });
  }

  loadContacts() {
    try {
      if (FileSystem.exists(this.contactsPath)) {
        const data = FileSystem.readFile(this.contactsPath);
        if (data) {
          this.contacts = JSON.parse(data);
        }
      }
    } catch (e) {
      console.error("[Contacts] Failed to load contacts:", e);
      this.contacts = [];
    }
    this.renderContacts();
  }

  saveContacts() {
    try {
      FileSystem.writeFile(this.contactsPath, JSON.stringify(this.contacts, null, 2));
    } catch (e) {
      console.error("[Contacts] Failed to save contacts:", e);
    }
  }
}
