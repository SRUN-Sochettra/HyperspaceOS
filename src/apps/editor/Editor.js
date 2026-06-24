import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";
import EventBus from "../../core/EventBus.js";
import { getPendingFiles } from "./index.js";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from "@codemirror/language";

export default class Editor extends BaseApp {
  async setup() {
    this.openFiles = [];
    this.activeIndex = -1;
    this.editorView = null;
    this.unsavedChanges = new Set();

    this.container.innerHTML = `
      <div class="editor-container">
        <div class="editor-tabs">
          <div class="editor-tabs-list" id="ed-tabs-${this.windowId}"></div>
          <button class="editor-tab-add" id="ed-add-${this.windowId}" title="Open file">+</button>
        </div>
        <div class="editor-body" id="ed-body-${this.windowId}">
          <div class="editor-empty" id="ed-empty-${this.windowId}">
            <div class="editor-empty-icon">💻</div>
            <div class="editor-empty-title">Code Editor</div>
            <div class="editor-empty-hint">
              Open a file from Files app or terminal:<br>
              <code>edit filename.js</code>
            </div>
          </div>
        </div>
        <div class="editor-statusbar">
          <span class="editor-status-file" id="ed-file-${this.windowId}">No file open</span>
          <div style="flex:1"></div>
          <span class="editor-status-save" id="ed-save-${this.windowId}"></span>
          <span class="editor-status-pos" id="ed-pos-${this.windowId}">—</span>
          <span class="editor-status-lang" id="ed-lang-${this.windowId}">—</span>
        </div>
      </div>
    `;

    // Open file button
    this.$(`#ed-add-${this.windowId}`).addEventListener("click", () => {
      this.showFilePicker();
    });

    // Keyboard shortcuts
    this.keyHandler = (e) => {
      const win = document.querySelector(".hyper-window.active");
      if (!win || win.id !== `window-${this.windowId}`) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        this.saveCurrentFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        this.closeTab(this.activeIndex);
      }
    };
    document.addEventListener("keydown", this.keyHandler);

    // Listen for files from other apps (while editor is mounted)
    this.listen("editor:openFile", ({ path, content }) => {
      this.openFile(path, content);
    });

    // Process files queued before we mounted
    const pending = getPendingFiles();
    if (pending.length > 0) {
      for (const file of pending) {
        this.openFile(file.path, file.content);
      }
    } else {
      // Nothing pending — try to open a default file
      if (FileSystem.isFile("/home/root/README.md")) {
        this.openFile("/home/root/README.md");
      }
    }
  }

  // ---- OPEN FILE ----
  openFile(path, content) {
    path = FileSystem.normalize(path);

    // Already open? Just switch to it
    const existing = this.openFiles.findIndex((f) => f.path === path);
    if (existing !== -1) {
      this.switchTab(existing);
      return;
    }

    // Read from FS if no content provided
    if (content === undefined || content === null) {
      content = FileSystem.readFile(path);
      if (content === null) {
        this.notify("❌", "Editor", `Cannot read: ${path}`);
        return;
      }
    }

    this.openFiles.push({
      path,
      name: FileSystem.basename(path),
      content,
      savedContent: content,
    });

    this.switchTab(this.openFiles.length - 1);
  }

  // ---- SWITCH TAB ----
  switchTab(index) {
    if (index < 0 || index >= this.openFiles.length) return;

    // Save current content before switching
    this.syncCurrentContent();

    this.activeIndex = index;
    const file = this.openFiles[index];

    this.renderTabs();
    this.createEditor(file.content);
    this.updateStatusBar(file);

    // Hide empty state
    const empty = this.$(`#ed-empty-${this.windowId}`);
    if (empty) empty.style.display = "none";
  }

  // ---- SYNC CONTENT from CodeMirror to our data ----
  syncCurrentContent() {
    if (this.activeIndex >= 0 && this.editorView) {
      const file = this.openFiles[this.activeIndex];
      if (file) {
        file.content = this.editorView.state.doc.toString();
      }
    }
  }

  // ---- RENDER TABS ----
  renderTabs() {
    const list = this.$(`#ed-tabs-${this.windowId}`);
    if (!list) return;

    list.innerHTML = this.openFiles
      .map((file, i) => {
        const active = i === this.activeIndex;
        const unsaved = this.unsavedChanges.has(file.path);
        const icon = this.getFileIcon(file.name);
        return `
        <div class="editor-tab ${active ? "active" : ""}" data-idx="${i}">
          <span class="editor-tab-icon">${icon}</span>
          <span class="editor-tab-name">${file.name}${unsaved ? " •" : ""}</span>
          <button class="editor-tab-close" data-idx="${i}">×</button>
        </div>
      `;
      })
      .join("");

    // Tab clicks
    list.querySelectorAll(".editor-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        if (e.target.closest(".editor-tab-close")) return;
        this.switchTab(parseInt(tab.dataset.idx));
      });
    });

    // Close clicks
    list.querySelectorAll(".editor-tab-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeTab(parseInt(btn.dataset.idx));
      });
    });
  }

  // ---- CREATE CODEMIRROR ----
  createEditor(content) {
    const body = this.$(`#ed-body-${this.windowId}`);
    if (!body) return;

    // Destroy old
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }

    // Remove old CM elements
    body.querySelectorAll(".cm-editor").forEach((el) => el.remove());

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      bracketMatching(),
      javascript(),
      oneDark,
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.updateListener.of((update) => {
        if (update.selectionSet) this.onCursorMove(update.state);
        if (update.docChanged) this.onContentChange(update.state);
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "13px",
          backgroundColor: "transparent",
        },
        ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
        ".cm-gutters": {
          backgroundColor: "rgba(0,0,0,0.2)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
          color: "rgba(200,200,255,0.18)",
          minWidth: "40px",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "rgba(0,245,255,0.05)",
          color: "rgba(200,200,255,0.4)",
        },
        ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.015)" },
        ".cm-cursor": {
          borderLeftColor: "var(--neon-cyan)",
          borderLeftWidth: "2px",
        },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
          backgroundColor: "rgba(0,245,255,0.12) !important",
        },
        ".cm-matchingBracket": {
          backgroundColor: "rgba(0,245,255,0.15)",
          outline: "1px solid rgba(0,245,255,0.3)",
        },
      }),
    ];

    this.editorView = new EditorView({
      state: EditorState.create({ doc: content || "", extensions }),
      parent: body,
    });
  }

  // ---- CONTENT CHANGED ----
  onContentChange(state) {
    const file = this.openFiles[this.activeIndex];
    if (!file) return;

    file.content = state.doc.toString();
    const changed = file.content !== file.savedContent;

    if (changed) this.unsavedChanges.add(file.path);
    else this.unsavedChanges.delete(file.path);

    this.renderTabs();

    const saveEl = this.$(`#ed-save-${this.windowId}`);
    if (saveEl) {
      saveEl.textContent = changed ? "● Modified" : "";
      saveEl.style.color = changed ? "var(--neon-yellow)" : "";
    }
  }

  // ---- CURSOR MOVED ----
  onCursorMove(state) {
    const pos = state.selection.main.head;
    const line = state.doc.lineAt(pos);
    const col = pos - line.from + 1;
    const el = this.$(`#ed-pos-${this.windowId}`);
    if (el) el.textContent = `Ln ${line.number}, Col ${col}`;
  }

  // ---- SAVE ----
  saveCurrentFile() {
    if (this.activeIndex < 0) return;
    const file = this.openFiles[this.activeIndex];
    if (!file) return;

    this.syncCurrentContent();

    const result = FileSystem.writeFile(file.path, file.content);
    if (result.error) {
      this.notify("❌", "Save Failed", result.error);
      return;
    }

    file.savedContent = file.content;
    this.unsavedChanges.delete(file.path);
    this.renderTabs();

    const saveEl = this.$(`#ed-save-${this.windowId}`);
    if (saveEl) {
      saveEl.textContent = "✓ Saved";
      saveEl.style.color = "var(--neon-green)";
      this.addTimeout(() => {
        if (saveEl) {
          saveEl.textContent = "";
          saveEl.style.color = "";
        }
      }, 2000);
    }
  }

  // ---- CLOSE TAB ----
  closeTab(index) {
    if (index < 0 || index >= this.openFiles.length) return;

    const file = this.openFiles[index];

    if (this.unsavedChanges.has(file.path)) {
      if (!confirm(`"${file.name}" has unsaved changes. Close anyway?`)) return;
    }

    // Save current content before removing
    this.syncCurrentContent();

    this.unsavedChanges.delete(file.path);
    this.openFiles.splice(index, 1);

    if (this.openFiles.length === 0) {
      this.activeIndex = -1;
      if (this.editorView) {
        this.editorView.destroy();
        this.editorView = null;
      }
      this.renderTabs();
      const body = this.$(`#ed-body-${this.windowId}`);
      if (body)
        body.querySelectorAll(".cm-editor").forEach((el) => el.remove());
      const empty = this.$(`#ed-empty-${this.windowId}`);
      if (empty) empty.style.display = "";
      this.updateStatusBar(null);
    } else {
      this.switchTab(Math.min(index, this.openFiles.length - 1));
    }
  }

  // ---- STATUS BAR ----
  updateStatusBar(file) {
    const fileEl = this.$(`#ed-file-${this.windowId}`);
    const langEl = this.$(`#ed-lang-${this.windowId}`);
    const posEl = this.$(`#ed-pos-${this.windowId}`);
    const saveEl = this.$(`#ed-save-${this.windowId}`);

    if (file) {
      if (fileEl) fileEl.textContent = file.path;
      if (langEl) langEl.textContent = this.detectLang(file.name);
      if (posEl) posEl.textContent = "Ln 1, Col 1";
      if (saveEl) {
        saveEl.textContent = "";
        saveEl.style.color = "";
      }
    } else {
      if (fileEl) fileEl.textContent = "No file open";
      if (langEl) langEl.textContent = "—";
      if (posEl) posEl.textContent = "—";
      if (saveEl) {
        saveEl.textContent = "";
        saveEl.style.color = "";
      }
    }
  }

  // ---- FILE PICKER ----
  showFilePicker() {
    let currentPath = "/home/root";
    const overlay = document.createElement("div");
    overlay.className = "editor-picker-overlay";

    const renderPicker = () => {
      const entries = FileSystem.readdir(currentPath) || [];

      overlay.innerHTML = `
        <div class="editor-picker">
          <div class="editor-picker-header">
            <span class="editor-picker-title">Open File</span>
            <button class="editor-picker-close" id="ep-close">×</button>
          </div>
          <div class="editor-picker-path">${currentPath}</div>
          <div class="editor-picker-list">
            ${
              currentPath !== "/"
                ? `
              <div class="editor-picker-item" data-action="nav" data-path="${FileSystem.parentPath(currentPath)}">
                <span>📂</span><span>..</span>
              </div>
            `
                : ""
            }
            ${entries
              .map(
                (e) => `
              <div class="editor-picker-item" data-action="${e.type === "dir" ? "nav" : "open"}" data-path="${e.path}">
                <span>${e.type === "dir" ? "📁" : this.getFileIcon(e.name)}</span>
                <span>${e.name}</span>
                ${e.type === "file" ? `<span class="editor-picker-size">${this.formatSize(e.size)}</span>` : ""}
              </div>
            `,
              )
              .join("")}
            ${entries.length === 0 ? '<div style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:var(--text-sm)">Empty folder</div>' : ""}
          </div>
        </div>
      `;

      // Close button
      overlay
        .querySelector("#ep-close")
        .addEventListener("click", () => overlay.remove());

      // Items
      overlay.querySelectorAll(".editor-picker-item").forEach((item) => {
        item.addEventListener("click", () => {
          if (item.dataset.action === "nav") {
            currentPath = item.dataset.path;
            renderPicker();
          } else {
            this.openFile(item.dataset.path);
            overlay.remove();
          }
        });
      });
    };

    // Click overlay background to close
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    this.container.appendChild(overlay);
    renderPicker();
  }

  // ---- HELPERS ----
  detectLang(name) {
    const ext = name.split(".").pop()?.toLowerCase();
    const map = {
      js: "JavaScript",
      mjs: "JavaScript",
      ts: "TypeScript",
      jsx: "React",
      tsx: "React TSX",
      json: "JSON",
      css: "CSS",
      html: "HTML",
      md: "Markdown",
      txt: "Plain Text",
      log: "Log",
      py: "Python",
      sh: "Shell",
      yml: "YAML",
      yaml: "YAML",
    };
    return map[ext] || "Plain Text";
  }

  getFileIcon(name) {
    const ext = name.split(".").pop()?.toLowerCase();
    const map = {
      js: "📜",
      ts: "📘",
      json: "📋",
      css: "🎨",
      html: "🌐",
      md: "📝",
      txt: "📄",
      log: "📊",
      py: "🐍",
      sh: "⚡",
    };
    return map[ext] || "📄";
  }

  formatSize(bytes) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    return (bytes / 1024).toFixed(1) + " KB";
  }

  onFocus() {
    if (this.editorView) this.editorView.focus();
  }

  onDestroy() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
    this.openFiles = [];
    this.unsavedChanges.clear();
  }
}
