import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";
import { marked } from "marked";

export default class MarkdownViewer extends BaseApp {
  async setup() {
    marked.setOptions({ breaks: true, gfm: true });

    this.container.innerHTML = `
      <div class="markdown-viewer-container">
        <div class="markdown-toolbar">
          <span class="markdown-title" id="md-title-${this.windowId}">Markdown Viewer</span>
          <div style="flex: 1;"></div>
          <button class="glass-btn" id="md-refresh-${this.windowId}">🔄 Refresh</button>
        </div>
        <div class="markdown-content" id="md-content-${this.windowId}">
          <div class="markdown-empty">Open a .md file to view its contents</div>
        </div>
      </div>
    `;

    this.contentEl = this.$(`#md-content-${this.windowId}`);
    this.titleEl = this.$(`#md-title-${this.windowId}`);

    this.$(`#md-refresh-${this.windowId}`).addEventListener("click", () => {
      if (this.currentPath) {
        this.openFile(this.currentPath);
      }
    });

    // Check if a file was passed when the app was launched
    const { path } = this.options || {};
    if (path) {
      this.openFile(path);
    }
  }

  openFile(path) {
    if (!FileSystem.exists(path)) {
      this.notify("❌", "Error", `File not found: ${path}`);
      return;
    }

    const content = FileSystem.readFile(path);
    if (content === null) {
        this.notify("❌", "Error", `Could not read file: ${path}`);
        return;
    }

    this.currentPath = path;
    const basename = FileSystem.basename(path);
    this.titleEl.textContent = basename;

    try {
      const html = marked.parse(content);
      this.contentEl.innerHTML = html;
      this.contentEl.classList.remove("markdown-empty-state");
    } catch (e) {
      this.contentEl.innerHTML = `<div class="markdown-error">Failed to parse markdown: ${e.message}</div>`;
    }
  }
}
