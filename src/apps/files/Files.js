import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";
import EventBus from "../../core/EventBus.js";
import Registry from "../../core/Registry.js";

export default class Files extends BaseApp {
  async setup() {
    this.currentPath = "/home/root";
    this.historyStack = ["/home/root"];
    this.historyIndex = 0;
    this.selectedItems = new Set();
    this.clipboard = null;
    this.renameTarget = null;

    this.render();

    // Re-render when file system changes from other apps
    this.listen("fs:change", () => {
      // Only re-render if the change affects our current directory
      this.render();
    });
  }

  render() {
    const entries = FileSystem.readdir(this.currentPath);

    // If directory doesn't exist, go home
    if (!entries) {
      this.currentPath = "/home/root";
      this.historyStack = ["/home/root"];
      this.historyIndex = 0;
      return this.render();
    }

    const pathParts = this.currentPath.split("/").filter(Boolean);
    const du = FileSystem.du(this.currentPath);

    this.container.innerHTML = `
      <div class="fm-container">
        <div class="fm-toolbar">
          <button class="fm-nav-btn" id="fm-back-${this.windowId}"
            ${this.historyIndex <= 0 ? "disabled" : ""} title="Back">←</button>
          <button class="fm-nav-btn" id="fm-fwd-${this.windowId}"
            ${this.historyIndex >= this.historyStack.length - 1 ? "disabled" : ""} title="Forward">→</button>
          <button class="fm-nav-btn" id="fm-up-${this.windowId}" title="Up">↑</button>
          <button class="fm-nav-btn" id="fm-home-${this.windowId}" title="Home">⌂</button>

          <div class="fm-breadcrumb">
            <span class="fm-crumb" data-path="/">⬡ root</span>
            ${pathParts
              .map((part, i) => {
                const path = "/" + pathParts.slice(0, i + 1).join("/");
                return `<span class="fm-crumb-sep">›</span><span class="fm-crumb" data-path="${path}">${part}</span>`;
              })
              .join("")}
          </div>

          <div style="flex:1"></div>

          <button class="fm-action-btn" id="fm-newfile-${this.windowId}" title="New File">+📄</button>
          <button class="fm-action-btn" id="fm-newfolder-${this.windowId}" title="New Folder">+📁</button>
          <button class="fm-action-btn" id="fm-refresh-${this.windowId}" title="Refresh">↻</button>
        </div>

        <div class="fm-grid" id="fm-grid-${this.windowId}">
          ${
            entries.length === 0
              ? `<div class="fm-empty">
                <div style="font-size:32px;margin-bottom:8px;opacity:0.3">📂</div>
                <div>Empty folder</div>
                <div style="font-size:var(--text-xs);margin-top:4px;color:var(--text-tertiary)">
                  Right-click to create files
                </div>
              </div>`
              : entries.map((entry) => this.renderItem(entry)).join("")
          }
        </div>

        <div class="fm-statusbar">
          <span>${entries.length} item${entries.length !== 1 ? "s" : ""}</span>
          <span>${this.selectedItems.size > 0 ? this.selectedItems.size + " selected" : ""}</span>
          <span>${this.formatSize(du.totalSize)}</span>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderItem(entry) {
    const icon = this.getIcon(entry);
    const isSelected = this.selectedItems.has(entry.path);

    return `
      <div class="fm-item ${isSelected ? "selected" : ""}"
           data-path="${entry.path}"
           data-name="${entry.name}"
           data-type="${entry.type}"
           draggable="true"
           tabindex="0">
        <span class="fm-item-icon">${icon}</span>
        <span class="fm-item-name">${entry.name}</span>
        ${
          entry.type === "file"
            ? `<span class="fm-item-meta">${this.formatSize(entry.size)}</span>`
            : `<span class="fm-item-meta">${(FileSystem.readdir(entry.path) || []).length} items</span>`
        }
      </div>
    `;
  }

  getIcon(entry) {
    if (entry.type === "dir") {
      // Special folder icons
      const folderIcons = {
        Desktop: "🖥️",
        Documents: "📄",
        Downloads: "📥",
        Music: "🎵",
        Projects: "💻",
        Pictures: "🖼️",
        Notes: "📝",
        ".config": "⚙️",
        ".ssh": "🔑",
        node_modules: "📦",
        experiments: "🧪",
        "hyperspace-os": "🚀",
      };
      return folderIcons[entry.name] || "📁";
    }

    // File icons by extension
    const ext = entry.name.split(".").pop()?.toLowerCase();
    const fileIcons = {
      js: "📜",
      mjs: "📜",
      ts: "📘",
      jsx: "⚛️",
      tsx: "⚛️",
      json: "📋",
      css: "🎨",
      html: "🌐",
      xml: "📰",
      md: "📝",
      txt: "📄",
      log: "📊",
      py: "🐍",
      rb: "💎",
      go: "🔵",
      rs: "🦀",
      java: "☕",
      sh: "⚡",
      bash: "⚡",
      zsh: "⚡",
      yml: "⚙️",
      yaml: "⚙️",
      toml: "⚙️",
      ini: "⚙️",
      png: "🖼️",
      jpg: "🖼️",
      jpeg: "🖼️",
      gif: "🖼️",
      svg: "🖼️",
      mp3: "🎵",
      wav: "🎵",
      flac: "🎵",
      mp4: "🎬",
      avi: "🎬",
      mkv: "🎬",
      pdf: "📕",
      doc: "📘",
      docx: "📘",
      xls: "📗",
      xlsx: "📗",
      zip: "📦",
      tar: "📦",
      gz: "📦",
      env: "🔒",
      lock: "🔒",
    };

    // Exact filename matches
    const nameIcons = {
      "README.md": "📖",
      LICENSE: "📜",
      Makefile: "🔧",
      ".bashrc": "⚡",
      ".gitignore": "🙈",
      "package.json": "📦",
      known_hosts: "🔑",
      "system.log": "📊",
    };

    return nameIcons[entry.name] || fileIcons[ext] || "📄";
  }

  bindEvents() {
    const wid = this.windowId;

    // Navigation buttons
    this.$(`#fm-back-${wid}`)?.addEventListener("click", () => this.goBack());
    this.$(`#fm-fwd-${wid}`)?.addEventListener("click", () => this.goForward());
    this.$(`#fm-up-${wid}`)?.addEventListener("click", () => this.goUp());
    this.$(`#fm-home-${wid}`)?.addEventListener("click", () =>
      this.navigate("/home/root"),
    );
    this.$(`#fm-refresh-${wid}`)?.addEventListener("click", () =>
      this.render(),
    );

    // Action buttons
    this.$(`#fm-newfile-${wid}`)?.addEventListener("click", () =>
      this.createNewFile(),
    );
    this.$(`#fm-newfolder-${wid}`)?.addEventListener("click", () =>
      this.createNewFolder(),
    );

    // Breadcrumbs
    this.$$(".fm-crumb").forEach((el) => {
      el.addEventListener("click", () => this.navigate(el.dataset.path));
    });

    // Grid right-click (empty area)
    this.$(`#fm-grid-${wid}`)?.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".fm-item")) return;
      e.preventDefault();
      e.stopPropagation();
      this.showGridMenu(e.clientX, e.clientY);
    });

    // File/folder items
    this.$$(".fm-item").forEach((el) => {
      const path = el.dataset.path;
      const name = el.dataset.name;
      const type = el.dataset.type;

      // Click to select
      el.addEventListener("click", (e) => {
        if (e.ctrlKey || e.metaKey) {
          // Toggle selection
          if (this.selectedItems.has(path)) this.selectedItems.delete(path);
          else this.selectedItems.add(path);
        } else {
          this.selectedItems.clear();
          this.selectedItems.add(path);
        }
        this.updateSelectionUI();
      });

      // Double-click to open
      el.addEventListener("dblclick", () => {
        if (type === "dir") {
          this.navigate(path);
        } else {
          this.openFile(path, name);
        }
      });

      // Right-click context menu
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Select this item if not already selected
        if (!this.selectedItems.has(path)) {
          this.selectedItems.clear();
          this.selectedItems.add(path);
          this.updateSelectionUI();
        }

        this.showItemMenu(e.clientX, e.clientY, path, name, type);
      });
    });

    // Keyboard shortcuts in the grid
    this.container.setAttribute("tabindex", "0");
    this.container.addEventListener("keydown", (e) => this.onKeyDown(e));
  }

  // ---- NAVIGATION ----

  navigate(path) {
    path = FileSystem.normalize(path);
    if (!FileSystem.isDir(path)) return;

    // Trim forward history
    this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    this.historyStack.push(path);
    this.historyIndex = this.historyStack.length - 1;
    this.currentPath = path;
    this.selectedItems.clear();
    this.render();
  }

  goBack() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.currentPath = this.historyStack[this.historyIndex];
    this.selectedItems.clear();
    this.render();
  }

  goForward() {
    if (this.historyIndex >= this.historyStack.length - 1) return;
    this.historyIndex++;
    this.currentPath = this.historyStack[this.historyIndex];
    this.selectedItems.clear();
    this.render();
  }

  goUp() {
    const parent = FileSystem.parentPath(this.currentPath);
    if (parent !== this.currentPath) this.navigate(parent);
  }

  // ---- OPEN FILE ----

  openFile(path, name) {
    const ext = name.split(".").pop()?.toLowerCase();
    const content = FileSystem.readFile(path);

    if (content === null) {
      this.notify("❌", "Error", `Cannot read file: ${name}`);
      return;
    }

    const textExtensions = [
      "js",
      "mjs",
      "ts",
      "jsx",
      "tsx",
      "json",
      "css",
      "html",
      "xml",
      "svg",
      "md",
      "txt",
      "log",
      "csv",
      "py",
      "rb",
      "go",
      "rs",
      "java",
      "c",
      "cpp",
      "h",
      "sh",
      "bash",
      "zsh",
      "yml",
      "yaml",
      "toml",
      "ini",
      "cfg",
      "env",
      "gitignore",
      "dockerignore",
      "sql",
      "graphql",
    ];

    const isText = !ext || textExtensions.includes(ext) || name.startsWith(".");

    if (ext === "md") {
      EventBus.emit("markdown:queueFile", { path });
      EventBus.emit("markdown:openFile", { path });
      Registry.launch("markdown", { path });
      return;
    }

    if (isText) {
      // Queue the file first (editor/index.js catches this even if editor isn't mounted)
      EventBus.emit("editor:queueFile", { path, content });

      // Also emit the direct event for already-mounted editors
      EventBus.emit("editor:openFile", { path, content });

      // Launch editor (if singleton and already open, just focuses it)
      Registry.launch("editor");
      return;
    }

    // Non-text files
    this.notify(
      "📄",
      name,
      `${this.formatSize(content.length)} — .${ext?.toUpperCase() || "Unknown"} file`,
    );
  }

  // ---- SELECTION UI ----

  updateSelectionUI() {
    this.$$(".fm-item").forEach((el) => {
      el.classList.toggle("selected", this.selectedItems.has(el.dataset.path));
    });

    // Update statusbar selection count
    const statusbar = this.container.querySelector(".fm-statusbar");
    if (statusbar) {
      const spans = statusbar.querySelectorAll("span");
      if (spans[1]) {
        spans[1].textContent =
          this.selectedItems.size > 0
            ? `${this.selectedItems.size} selected`
            : "";
      }
    }
  }

  // ---- KEYBOARD ----

  onKeyDown(e) {
    // Delete selected items
    if (
      e.key === "Delete" ||
      (e.key === "Backspace" && !e.target.closest("input"))
    ) {
      e.preventDefault();
      if (this.selectedItems.size > 0) this.deleteSelected();
    }

    // Copy
    if ((e.ctrlKey || e.metaKey) && e.key === "c") {
      e.preventDefault();
      this.copySelected();
    }

    // Cut
    if ((e.ctrlKey || e.metaKey) && e.key === "x") {
      e.preventDefault();
      this.cutSelected();
    }

    // Paste
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      e.preventDefault();
      this.pasteClipboard();
    }

    // Select all
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      const entries = FileSystem.readdir(this.currentPath) || [];
      this.selectedItems.clear();
      entries.forEach((e) => this.selectedItems.add(e.path));
      this.updateSelectionUI();
    }

    // Enter — open selected
    if (e.key === "Enter" && this.selectedItems.size === 1) {
      const path = [...this.selectedItems][0];
      const stat = FileSystem.stat(path);
      if (stat) {
        if (stat.type === "dir") this.navigate(path);
        else this.openFile(path, stat.name);
      }
    }

    // Backspace — go up (when not typing)
    if (
      e.key === "Backspace" &&
      e.target.closest("input") === null &&
      this.selectedItems.size === 0
    ) {
      e.preventDefault();
      this.goUp();
    }

    // F2 — rename
    if (e.key === "F2" && this.selectedItems.size === 1) {
      e.preventDefault();
      this.renameItem([...this.selectedItems][0]);
    }
  }

  // ---- FILE OPERATIONS ----

  createNewFile() {
    const name = prompt("New file name:");
    if (!name || !name.trim()) return;

    const path = FileSystem.join(this.currentPath, name.trim());

    if (FileSystem.exists(path)) {
      this.notify(
        "⚠️",
        "Already exists",
        `"${name}" already exists in this folder`,
      );
      return;
    }

    const result = FileSystem.writeFile(path, "");
    if (result.error) {
      this.notify("❌", "Error", result.error);
    } else {
      this.notify("✅", "Created", name);
      this.render();
    }
  }

  createNewFolder() {
    const name = prompt("New folder name:");
    if (!name || !name.trim()) return;

    const path = FileSystem.join(this.currentPath, name.trim());

    if (FileSystem.exists(path)) {
      this.notify(
        "⚠️",
        "Already exists",
        `"${name}" already exists in this folder`,
      );
      return;
    }

    const result = FileSystem.mkdir(path);
    if (result.error) {
      this.notify("❌", "Error", result.error);
    } else {
      this.notify("✅", "Created", name);
      this.render();
    }
  }

  renameItem(path) {
    const oldName = FileSystem.basename(path);
    const newName = prompt("Rename to:", oldName);

    if (!newName || !newName.trim() || newName.trim() === oldName) return;

    const newPath = FileSystem.join(
      FileSystem.parentPath(path),
      newName.trim(),
    );

    if (FileSystem.exists(newPath)) {
      this.notify("⚠️", "Already exists", `"${newName}" already exists`);
      return;
    }

    const result = FileSystem.mv(path, newPath);
    if (result.error) {
      this.notify("❌", "Rename failed", result.error);
    } else {
      this.selectedItems.clear();
      this.selectedItems.add(newPath);
      this.render();
    }
  }

  deleteSelected() {
    const count = this.selectedItems.size;
    const names = [...this.selectedItems].map((p) => FileSystem.basename(p));

    const msg =
      count === 1 ? `Delete "${names[0]}"?` : `Delete ${count} items?`;

    if (!confirm(msg)) return;

    let deleted = 0;
    for (const path of this.selectedItems) {
      const result = FileSystem.rm(path, true);
      if (!result.error) deleted++;
    }

    this.selectedItems.clear();
    this.notify(
      "🗑️",
      "Deleted",
      `${deleted} item${deleted !== 1 ? "s" : ""} removed`,
    );
    this.render();
  }

  copySelected() {
    if (this.selectedItems.size === 0) return;
    this.clipboard = {
      action: "copy",
      paths: [...this.selectedItems],
    };
    this.notify(
      "📋",
      "Copied",
      `${this.selectedItems.size} item${this.selectedItems.size !== 1 ? "s" : ""}`,
    );
  }

  cutSelected() {
    if (this.selectedItems.size === 0) return;
    this.clipboard = {
      action: "cut",
      paths: [...this.selectedItems],
    };
    this.notify(
      "✂️",
      "Cut",
      `${this.selectedItems.size} item${this.selectedItems.size !== 1 ? "s" : ""}`,
    );
  }

  pasteClipboard() {
    if (!this.clipboard || this.clipboard.paths.length === 0) return;

    let completed = 0;
    for (const srcPath of this.clipboard.paths) {
      const name = FileSystem.basename(srcPath);
      let destPath = FileSystem.join(this.currentPath, name);

      // Handle name conflict
      if (FileSystem.exists(destPath) && destPath !== srcPath) {
        const ext = name.includes(".") ? "." + name.split(".").pop() : "";
        const base = ext ? name.slice(0, -ext.length) : name;
        destPath = FileSystem.join(this.currentPath, `${base} (copy)${ext}`);
      }

      let result;
      if (this.clipboard.action === "copy") {
        result = FileSystem.cp(srcPath, destPath);
      } else {
        // Don't move to same location
        if (destPath === srcPath) continue;
        result = FileSystem.mv(srcPath, destPath);
      }

      if (!result.error) completed++;
    }

    if (this.clipboard.action === "cut") {
      this.clipboard = null;
    }

    this.selectedItems.clear();
    this.notify(
      "📋",
      "Pasted",
      `${completed} item${completed !== 1 ? "s" : ""}`,
    );
    this.render();
  }

  // ---- CONTEXT MENUS ----

  showItemMenu(x, y, path, name, type) {
    this.closeMenu();

    const items = [];

    // Open
    if (type === "dir") {
      items.push({
        icon: "📂",
        label: "Open",
        action: () => this.navigate(path),
      });
    } else {
      items.push({
        icon: "📝",
        label: "Open in Editor",
        action: () => this.openFile(path, name),
      });
    }

    items.push({ type: "separator" });

    // Edit operations
    items.push({
      icon: "✏️",
      label: "Rename",
      shortcut: "F2",
      action: () => this.renameItem(path),
    });
    items.push({
      icon: "📋",
      label: "Copy",
      shortcut: "⌘C",
      action: () => this.copySelected(),
    });
    items.push({
      icon: "✂️",
      label: "Cut",
      shortcut: "⌘X",
      action: () => this.cutSelected(),
    });

    if (this.clipboard) {
      items.push({
        icon: "📄",
        label: "Paste",
        shortcut: "⌘V",
        action: () => this.pasteClipboard(),
      });
    }

    items.push({ type: "separator" });

    // File info
    const stat = FileSystem.stat(path);
    if (stat && stat.type === "file") {
      items.push({
        icon: "ℹ️",
        label: `${this.formatSize(stat.size)}`,
        action: () => {},
        disabled: true,
      });
    }

    if (stat && stat.type === "dir") {
      const dirDu = FileSystem.du(path);
      items.push({
        icon: "ℹ️",
        label: `${dirDu.fileCount} files, ${this.formatSize(dirDu.totalSize)}`,
        action: () => {},
        disabled: true,
      });
    }

    items.push({ type: "separator" });

    // Delete
    items.push({
      icon: "🗑️",
      label: "Delete",
      shortcut: "Del",
      action: () => this.deleteSelected(),
    });

    this.showMenu(x, y, items);
  }

  showGridMenu(x, y) {
    this.closeMenu();

    const items = [
      { icon: "📄", label: "New File", action: () => this.createNewFile() },
      { icon: "📁", label: "New Folder", action: () => this.createNewFolder() },
      { type: "separator" },
    ];

    if (this.clipboard) {
      items.push({
        icon: "📋",
        label: "Paste",
        shortcut: "⌘V",
        action: () => this.pasteClipboard(),
      });
      items.push({ type: "separator" });
    }

    items.push({ icon: "↻", label: "Refresh", action: () => this.render() });

    if (this.currentPath !== "/home/root") {
      items.push({
        icon: "⌂",
        label: "Go Home",
        action: () => this.navigate("/home/root"),
      });
    }

    this.showMenu(x, y, items);
  }

  showMenu(x, y, items) {
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.position = "fixed";
    menu.style.zIndex = "99999";

    menu.innerHTML = items
      .map((item) => {
        if (item.type === "separator") {
          return '<div class="ctx-separator"></div>';
        }
        return `
        <div class="ctx-item ${item.disabled ? "disabled" : ""}">
          <span class="ctx-item-icon">${item.icon}</span>
          <span class="ctx-item-label">${item.label}</span>
          ${item.shortcut ? `<span class="ctx-item-shortcut">${item.shortcut}</span>` : ""}
        </div>
      `;
      })
      .join("");

    // Position — keep within viewport
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();

    menu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + "px";
    menu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + "px";

    // Bind actions
    const actionItems = items.filter(
      (i) => i.type !== "separator" && !i.disabled,
    );
    let actionIndex = 0;
    menu.querySelectorAll(".ctx-item:not(.disabled)").forEach((el) => {
      const action = actionItems[actionIndex]?.action;
      actionIndex++;
      if (action) {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          action();
          this.closeMenu();
        });
      }
    });

    this._menu = menu;

    // Close on any click outside
    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        this.closeMenu();
        document.removeEventListener("mousedown", closeHandler, true);
      }
    };
    // Use setTimeout so the current click doesn't immediately close it
    setTimeout(() => {
      document.addEventListener("mousedown", closeHandler, true);
    }, 10);
  }

  closeMenu() {
    if (this._menu) {
      this._menu.remove();
      this._menu = null;
    }
  }

  // ---- HELPERS ----

  formatSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  onDestroy() {
    this.closeMenu();
    this.selectedItems.clear();
    this.clipboard = null;
  }
}
