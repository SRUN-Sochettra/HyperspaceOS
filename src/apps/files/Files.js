import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";
import EventBus from "../../core/EventBus.js";
import Registry from "../../core/Registry.js";
import BaseApp from '../BaseApp.js'
import { escapeHtml } from '../../utils/safeDom.js'
import FileSystem from '../../core/FileSystem.js'
import EventBus from '../../core/EventBus.js'
import Registry from '../../core/Registry.js'
import { icon } from '../../ui/Icons.js'

export default class Files extends BaseApp {
  async setup() {
    this.currentPath = "/home/root";
    this.historyStack = ["/home/root"];
    this.historyIndex = 0;
    this.selectedItems = new Set();
    this.clipboard = null;
    this.renameTarget = null;
    this.currentPath = '/home/root'
    this.history = ['/home/root']
    this.historyIndex = 0
    this.viewMode = 'grid' // 'grid' | 'list'
    this.sortBy = 'name' // 'name' | 'size' | 'time'
    this.sortAsc = true
    this.selectedItems = new Set()
    this.clipboard = null // { op: 'copy'|'cut', paths: [] }

    this.render();

    // Re-render when file system changes from other apps
    this.listen("fs:change", () => {
      // Only re-render if the change affects our current directory
      this.render();
    });
    this.renderShell()
    this.navigate(this.currentPath, false)
    this.bindEvents()
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

  renderShell() {
    this.container.innerHTML = `
      <div class="fm-container">
        <div class="fm-toolbar">
          <button class="fm-nav-btn" id="fm-back-${this.windowId}"
            ${this.historyIndex <= 0 ? "disabled" : ""} title="Back">←</button>
          <button class="fm-nav-btn" id="fm-fwd-${this.windowId}"
            ${this.historyIndex >= this.historyStack.length - 1 ? "disabled" : ""} title="Forward">→</button>
          <button class="fm-nav-btn" id="fm-up-${this.windowId}" title="Up">↑</button>
          <button class="fm-nav-btn" id="fm-home-${this.windowId}" title="Home">⌂</button>
      <div class="files-app">
        <!-- Toolbar -->
        <div class="files-toolbar">
          <div class="files-nav-btns">
            <button class="files-btn" id="fb-back" title="Back" disabled>←</button>
            <button class="files-btn" id="fb-forward" title="Forward" disabled>→</button>
            <button class="files-btn" id="fb-up" title="Up one level">↑</button>
            <button class="files-btn" id="fb-refresh" title="Refresh">↻</button>
          </div>
          <div class="files-path-bar">
            <span class="files-path-icon">${icon('folder')}</span>
            <div class="files-breadcrumbs" id="files-crumbs"></div>
          </div>
          <div class="files-actions">
            <button class="files-btn" id="fb-newfile" title="New File">+ File</button>
            <button class="files-btn" id="fb-newfolder" title="New Folder">+ Folder</button>
            <div class="files-view-toggle">
              <button class="files-btn active" id="fb-grid" title="Grid View">⊞</button>
              <button class="files-btn" id="fb-list" title="List View">≡</button>
            </div>
          </div>
        </div>

          <div class="fm-breadcrumb">
            <span class="fm-crumb" data-path="/">⬡ root</span>
            ${pathParts
              .map((part, i) => {
                const path = "/" + pathParts.slice(0, i + 1).join("/");
                return `<span class="fm-crumb-sep">›</span><span class="fm-crumb" data-path="${path}">${part}</span>`;
              })
              .join("")}
        <!-- Main Area: Sidebar + File List -->
        <div class="files-main">
          <!-- Sidebar -->
          <div class="files-sidebar">
            <div class="files-sidebar-section">
              <div class="files-sidebar-heading">Favorites</div>
              <div class="files-sidebar-item" data-path="/home/root">
                <span>${icon('folder')}</span><span>Home</span>
              </div>
              <div class="files-sidebar-item" data-path="/home/root/Desktop">
                <span>${icon('folder')}</span><span>Desktop</span>
              </div>
              <div class="files-sidebar-item" data-path="/home/root/Documents">
                <span>${icon('folder')}</span><span>Documents</span>
              </div>
              <div class="files-sidebar-item" data-path="/home/root/Pictures">
                <span>${icon('folder')}</span><span>Pictures</span>
              </div>
              <div class="files-sidebar-item" data-path="/home/root/Music">
                <span>${icon('music')}</span><span>Music</span>
              </div>
            </div>
            <div class="files-sidebar-section">
              <div class="files-sidebar-heading">System</div>
              <div class="files-sidebar-item" data-path="/">
                <span>${icon('files')}</span><span>Root (/)</span>
              </div>
              <div class="files-sidebar-item" data-path="/etc">
                <span>${icon('settings')}</span><span>etc</span>
              </div>
              <div class="files-sidebar-item" data-path="/tmp">
                <span>${icon('folder')}</span><span>tmp</span>
              </div>
            </div>
          </div>

          <div style="flex:1"></div>

          <button class="fm-action-btn" id="fm-newfile-${this.windowId}" title="New File">+file</button>
          <button class="fm-action-btn" id="fm-newfolder-${this.windowId}" title="New Folder">+folder</button>
          <button class="fm-action-btn" id="fm-refresh-${this.windowId}" title="Refresh">↻</button>
          <!-- File Grid / List -->
          <div class="files-content" id="files-content">
            <div class="files-grid" id="files-grid"></div>
          </div>
        </div>

        <div class="fm-grid" id="fm-grid-${this.windowId}">
<<<<<<< HEAD
          ${entries.length === 0
        ? `<div class="fm-empty">
                <div style="font-size:32px;margin-bottom:8px;opacity:0.3">folder</div>
=======
          ${
            entries.length === 0
              ? `<div class="fm-empty">
                <div style="font-size:32px;margin-bottom:8px;opacity:0.3">📂</div>
>>>>>>> origin/main
                <div>Empty folder</div>
                <div style="font-size:var(--text-xs);margin-top:4px;color:var(--text-tertiary)">
                  Right-click to create files
                </div>
              </div>`
              : entries.map((entry) => this.renderItem(entry)).join("")
          }
        <!-- Status Bar -->
        <div class="files-statusbar" id="files-status">
          <span id="fs-count">0 items</span>
          <span id="fs-selected"></span>
          <span id="fs-space">Persistent Storage</span>
        </div>

        <div class="fm-statusbar">
          <span>${entries.length} item${entries.length !== 1 ? "s" : ""}</span>
          <span>${this.selectedItems.size > 0 ? this.selectedItems.size + " selected" : ""}</span>
          <span>${this.formatSize(du.totalSize)}</span>
        </div>
      </div>
    `;

    this.bindEvents();
    `
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
<<<<<<< HEAD
        'Desktop': 'desktop', 'Documents': 'file', 'Downloads': 'download',
        'Music': 'music', 'Projects': 'code', 'Pictures': 'image',
        'Notes': 'note', '.config': 'settings', '.ssh': 'key',
        'node_modules': 'archive', 'experiments': 'lab',
        'hyperspace-os': '',
      }
      return folderIcons[entry.name] || 'folder'
=======
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
>>>>>>> origin/main
    if (entry.type === 'dir') return icon('folder')
    const ext = entry.name.split('.').pop()?.toLowerCase()
    const map = {
      js: 'editor',
      ts: 'editor',
      json: 'files',
      css: 'files',
      html: 'files',
      md: 'markdown',
      txt: 'file',
      log: 'sysmon',
      png: 'photos',
      jpg: 'photos',
      jpeg: 'photos',
      gif: 'photos',
      svg: 'photos',
      mp3: 'music',
      wav: 'music',
      ogg: 'music',
      mp4: 'video',
      webm: 'video',
      py: 'editor',
      sh: 'terminal',
    }
    const iconName = map[ext] || 'file'
    return icon(iconName)
  }

    // File icons by extension
    const ext = entry.name.split(".").pop()?.toLowerCase();
    const fileIcons = {
<<<<<<< HEAD
      js: 'code', mjs: 'code', ts: 'file', jsx: 'React', tsx: 'React',
      json: 'list', css: '', html: 'web', xml: 'XML',
      md: 'note', txt: 'file', log: 'chart',
      py: 'Python', rb: '', go: 'Go', rs: 'Rust', java: 'Java',
      sh: '', bash: '', zsh: '',
      yml: 'settings', yaml: 'settings', toml: 'settings', ini: 'settings',
      png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image',
      mp3: 'music', wav: 'music', flac: 'music',
      mp4: 'video', avi: 'video', mkv: 'video',
      pdf: 'PDF', doc: 'file', docx: 'file', xls: 'sheet', xlsx: 'sheet',
      zip: 'archive', tar: 'archive', gz: 'archive',
      env: 'locked', lock: 'locked',
    }
  bindEvents() {
    // Nav buttons
    this.$('#fb-back').addEventListener('click', () => this.goBack())
    this.$('#fb-forward').addEventListener('click', () => this.goForward())
    this.$('#fb-up').addEventListener('click', () => this.goUp())
    this.$('#fb-refresh').addEventListener('click', () => this.render())

    // Exact filename matches
    const nameIcons = {
      'README.md': 'readme', 'LICENSE': 'code', 'Makefile': 'tool',
      '.bashrc': '', '.gitignore': 'ignored', 'package.json': 'archive',
      'known_hosts': 'key', 'system.log': 'chart',
    }
    // Actions
    this.$('#fb-newfile').addEventListener('click', () => this.createNewFile())
    this.$('#fb-newfolder').addEventListener('click', () => this.createNewFolder())

    return nameIcons[entry.name] || fileIcons[ext] || 'file'
=======
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
    // View toggle
    this.$('#fb-grid').addEventListener('click', () => this.setViewMode('grid'))
    this.$('#fb-list').addEventListener('click', () => this.setViewMode('list'))

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
    // Sidebar items
    this.container.querySelectorAll('.files-sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const p = item.dataset.path
        if (p) this.navigate(p)
      })
    })

    return nameIcons[entry.name] || fileIcons[ext] || "📄";
>>>>>>> origin/main
  }
    // Content container click (deselect if clicking background)
    const content = this.$('#files-content')
    content.addEventListener('click', (e) => {
      if (e.target === content || e.target.id === 'files-grid') {
        this.clearSelection()
      }
    })

  bindEvents() {
    const wid = this.windowId;
    // Content context menu (right click background)
    content.addEventListener('contextmenu', (e) => {
      if (e.target === content || e.target.id === 'files-grid') {
        e.preventDefault()
        this.showGridMenu(e.clientX, e.clientY)
      }
    })

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
    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !this.isEditing) {
        this.goBack()
      } else if (e.key === 'F2') {
        this.renameSelected()
      } else if (e.key === 'Delete') {
        this.deleteSelected()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        this.copySelected()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        this.cutSelected()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        this.pasteClipboard()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        this.selectAll()
      }
    })

    // Action buttons
    this.$(`#fm-newfile-${wid}`)?.addEventListener("click", () =>
      this.createNewFile(),
    );
    this.$(`#fm-newfolder-${wid}`)?.addEventListener("click", () =>
      this.createNewFolder(),
    );
    // Listen to filesystem events to keep in sync
    this._onFsChange = () => this.render()
    EventBus.on('fs:change', this._onFsChange)
  }

    // Breadcrumbs
    this.$$(".fm-crumb").forEach((el) => {
      el.addEventListener("click", () => this.navigate(el.dataset.path));
    });
  navigate(path, recordHistory = true) {
    const stat = FileSystem.stat(path)
    if (!stat || stat.type !== 'dir') {
      this.notify('Error', 'Files', `Path not found: ${path}`)
      return
    }

    // Grid right-click (empty area)
    this.$(`#fm-grid-${wid}`)?.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".fm-item")) return;
      e.preventDefault();
      e.stopPropagation();
      this.showGridMenu(e.clientX, e.clientY);
    });
    this.currentPath = path
    this.clearSelection()

    // File/folder items
    this.$$(".fm-item").forEach((el) => {
      const path = el.dataset.path;
      const name = el.dataset.name;
      const type = el.dataset.type;
    if (recordHistory) {
      this.history = this.history.slice(0, this.historyIndex + 1)
      this.history.push(path)
      this.historyIndex = this.history.length - 1
    }

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
    this.updateNavButtons()
    this.renderBreadcrumbs()
    this.render()
    this.highlightSidebar()
  }

      // Double-click to open
      el.addEventListener("dblclick", () => {
        if (type === "dir") {
          this.navigate(path);
        } else {
          this.openFile(path, name);
        }
      });
  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.navigate(this.history[this.historyIndex], false)
    }
  }

      // Right-click context menu
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.navigate(this.history[this.historyIndex], false)
    }
  }

        // Select this item if not already selected
        if (!this.selectedItems.has(path)) {
          this.selectedItems.clear();
          this.selectedItems.add(path);
          this.updateSelectionUI();
        }
  goUp() {
    if (this.currentPath === '/') return
    const parent = FileSystem.parentPath(this.currentPath)
    this.navigate(parent)
  }

        this.showItemMenu(e.clientX, e.clientY, path, name, type);
      });
    });
  updateNavButtons() {
    const back = this.$('#fb-back')
    const forward = this.$('#fb-forward')
    const up = this.$('#fb-up')

    // Keyboard shortcuts in the grid
    this.container.setAttribute("tabindex", "0");
    this.container.addEventListener("keydown", (e) => this.onKeyDown(e));
    if (back) back.disabled = this.historyIndex <= 0
    if (forward) forward.disabled = this.historyIndex >= this.history.length - 1
    if (up) up.disabled = this.currentPath === '/'
  }

  // ---- NAVIGATION ----
  renderBreadcrumbs() {
    const crumbsEl = this.$('#files-crumbs')
    if (!crumbsEl) return

  navigate(path) {
    path = FileSystem.normalize(path);
    if (!FileSystem.isDir(path)) return;
    const parts = this.currentPath === '/' ? [''] : this.currentPath.split('/')
    let accum = ''
    let html = ''

    // Trim forward history
    this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    this.historyStack.push(path);
    this.historyIndex = this.historyStack.length - 1;
    this.currentPath = path;
    this.selectedItems.clear();
    this.render();
  }
    parts.forEach((part, i) => {
      accum += (i === 0 ? '' : '/') + part
      const p = accum || '/'
      const label = part || 'root'
      html += `<span class="files-crumb" data-path="${escapeHtml(p)}">${escapeHtml(label)}</span>`
      if (i < parts.length - 1) {
        html += '<span class="files-crumb-sep">/</span>'
      }
    })

  goBack() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.currentPath = this.historyStack[this.historyIndex];
    this.selectedItems.clear();
    this.render();
  }
    crumbsEl.innerHTML = html

  goForward() {
    if (this.historyIndex >= this.historyStack.length - 1) return;
    this.historyIndex++;
    this.currentPath = this.historyStack[this.historyIndex];
    this.selectedItems.clear();
    this.render();
    crumbsEl.querySelectorAll('.files-crumb').forEach(el => {
      el.addEventListener('click', () => {
        this.navigate(el.dataset.path)
      })
    })
  }

  goUp() {
    const parent = FileSystem.parentPath(this.currentPath);
    if (parent !== this.currentPath) this.navigate(parent);
  highlightSidebar() {
    this.container.querySelectorAll('.files-sidebar-item').forEach(item => {
      if (item.dataset.path === this.currentPath) {
        item.classList.add('active')
      } else {
        item.classList.remove('active')
      }
    })
  }

  // ---- OPEN FILE ----
  render() {
    const grid = this.$('#files-grid')
    if (!grid) return

  openFile(path, name) {
    const ext = name.split(".").pop()?.toLowerCase();
    const content = FileSystem.readFile(path);
    let entries = FileSystem.readdir(this.currentPath) || []

    if (content === null) {
<<<<<<< HEAD
      this.notify('Error', 'Error', `Cannot read file: ${name}`)
    // Sort: directories always first, then by chosen key
    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      if (this.sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name)
        return this.sortAsc ? cmp : -cmp
      }
      if (this.sortBy === 'size') {
        return this.sortAsc ? a.size - b.size : b.size - a.size
      }
      if (this.sortBy === 'time') {
        return this.sortAsc ? a.mtime - b.mtime : b.mtime - a.mtime
      }
      return 0
    })

    // Update status bar
    const countEl = this.$('#fs-count')
    if (countEl) countEl.textContent = `${entries.length} item${entries.length === 1 ? '' : 's'}`

    if (entries.length === 0) {
      grid.innerHTML = '<div class="files-empty">This folder is empty</div>'
      return
=======
      this.notify("❌", "Error", `Cannot read file: ${name}`);
      return;
>>>>>>> origin/main
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
    if (this.viewMode === 'grid') {
      grid.className = 'files-grid'
      grid.innerHTML = entries.map(e => `
        <div class="files-item ${this.selectedItems.has(e.path) ? 'selected' : ''}" data-path="${escapeHtml(e.path)}" data-type="${escapeHtml(e.type)}" data-name="${escapeHtml(e.name)}">
          <div class="files-item-icon">${this.getIcon(e)}</div>
          <div class="files-item-name" title="${escapeHtml(e.name)}">${escapeHtml(e.name)}</div>
          <div class="files-item-meta">${e.type === 'dir' ? 'Folder' : this.formatSize(e.size)}</div>
        </div>
      `).join('')
    } else {
      grid.className = 'files-list'
      grid.innerHTML = `
        <div class="files-list-header">
          <span class="flh-name">Name</span>
          <span class="flh-size">Size</span>
          <span class="flh-time">Modified</span>
        </div>
        ${entries.map(e => `
          <div class="files-list-row ${this.selectedItems.has(e.path) ? 'selected' : ''}" data-path="${escapeHtml(e.path)}" data-type="${escapeHtml(e.type)}" data-name="${escapeHtml(e.name)}">
            <div class="flr-name">
              <span class="flr-icon">${this.getIcon(e)}</span>
              <span class="flr-label" title="${escapeHtml(e.name)}">${escapeHtml(e.name)}</span>
            </div>
            <div class="flr-size">${e.type === 'dir' ? '--' : this.formatSize(e.size)}</div>
            <div class="flr-time">${new Date(e.mtime).toLocaleDateString()}</div>
          </div>
        `).join('')}
      `
    }

    const isText = !ext || textExtensions.includes(ext) || name.startsWith(".");
    this.bindItemEvents()
  }

    if (ext === "md") {
      EventBus.emit("markdown:queueFile", { path });
      EventBus.emit("markdown:openFile", { path });
      Registry.launch("markdown", { path });
      return;
    }
  bindItemEvents() {
    const items = this.container.querySelectorAll('.files-item, .files-list-row')

    if (isText) {
      // Queue the file first (editor/index.js catches this even if editor isn't mounted)
      EventBus.emit("editor:queueFile", { path, content });
    items.forEach(el => {
      const path = el.dataset.path
      const type = el.dataset.type
      const name = el.dataset.name

      // Also emit the direct event for already-mounted editors
      EventBus.emit("editor:openFile", { path, content });
      // Click: select (with multi-select support)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        if (e.ctrlKey || e.metaKey) {
          // Toggle selection
          if (this.selectedItems.has(path)) {
            this.selectedItems.delete(path)
            el.classList.remove('selected')
          } else {
            this.selectedItems.add(path)
            el.classList.add('selected')
          }
        } else if (e.shiftKey && this.lastSelectedPath) {
          // Range selection
          this.selectRange(this.lastSelectedPath, path)
        } else {
          // Single select
          this.clearSelection()
          this.selectedItems.add(path)
          el.classList.add('selected')
        }
        this.lastSelectedPath = path
        this.updateStatusSelection()
      })

      // Launch editor (if singleton and already open, just focuses it)
      Registry.launch("editor");
      return;
    }
      // Double-click: open / enter
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation()
        if (type === 'dir') {
          this.navigate(path)
        } else {
          this.openFile(path, name)
        }
      })

    // Non-text files
<<<<<<< HEAD
    this.notify('file', name, `${this.formatSize(content.length)} — .${ext?.toUpperCase() || 'Unknown'} file`)
=======
    this.notify(
      "📄",
      name,
      `${this.formatSize(content.length)} — .${ext?.toUpperCase() || "Unknown"} file`,
    );
>>>>>>> origin/main
  }
      // Right-click: context menu
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!this.selectedItems.has(path)) {
          this.clearSelection()
          this.selectedItems.add(path)
          el.classList.add('selected')
          this.updateStatusSelection()
        }
        this.showItemMenu(e.clientX, e.clientY, path, type, name)
      })

  // ---- SELECTION UI ----
      // Drag and Drop support
      el.setAttribute('draggable', 'true')
      el.addEventListener('dragstart', (e) => {
        const dragPaths = this.selectedItems.has(path) ? Array.from(this.selectedItems) : [path]
        e.dataTransfer.setData('text/plain', JSON.stringify({ paths: dragPaths, sourcePath: this.currentPath }))
        e.dataTransfer.effectAllowed = 'move'
      })

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
      if (type === 'dir') {
        el.addEventListener('dragover', (e) => {
          e.preventDefault()
          el.classList.add('drag-over')
        })
        el.addEventListener('dragleave', () => {
          el.classList.remove('drag-over')
        })
        el.addEventListener('drop', (e) => {
          e.preventDefault()
          el.classList.remove('drag-over')
          try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'))
            if (data && data.paths) {
              this.moveItems(data.paths, path)
            }
          } catch (err) { }
        })
      }
    }
    })
  }

  // ---- KEYBOARD ----
  openFile(path, name) {
    const ext = name.split('.').pop()?.toLowerCase()
    const content = FileSystem.readFile(path)

  onKeyDown(e) {
    // Delete selected items
    if (
      e.key === "Delete" ||
      (e.key === "Backspace" && !e.target.closest("input"))
    ) {
      e.preventDefault();
      if (this.selectedItems.size > 0) this.deleteSelected();
    }
    const textExtensions = [
      'txt', 'md', 'js', 'json', 'css', 'html', 'log', 'py', 'sh',
      'ts', 'jsx', 'tsx', 'yml', 'yaml', 'xml', 'svg', 'ini', 'conf', 'env',
      'gitignore', 'dockerignore', 'sql', 'graphql'
    ]

    // Copy
    if ((e.ctrlKey || e.metaKey) && e.key === "c") {
      e.preventDefault();
      this.copySelected();
    }
    const isText = !ext || textExtensions.includes(ext) || name.startsWith('.')

    // Cut
    if ((e.ctrlKey || e.metaKey) && e.key === "x") {
      e.preventDefault();
      this.cutSelected();
    if (ext === 'md') {
      EventBus.emit('markdown:queueFile', { path })
      EventBus.emit('markdown:openFile', { path })
      Registry.launch('markdown', { path })
      return
    }

    // Paste
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      e.preventDefault();
      this.pasteClipboard();
    if (isText) {
      EventBus.emit('editor:queueFile', { path, content })
      EventBus.emit('editor:openFile', { path, content })
      Registry.launch('editor')
      return
    }

    // Select all
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      const entries = FileSystem.readdir(this.currentPath) || [];
      this.selectedItems.clear();
      entries.forEach((e) => this.selectedItems.add(e.path));
      this.updateSelectionUI();
    if (['mp3', 'wav', 'ogg'].includes(ext)) {
      Registry.launch('music')
      return
    }

    // Enter — open selected
    if (e.key === "Enter" && this.selectedItems.size === 1) {
      const path = [...this.selectedItems][0];
      const stat = FileSystem.stat(path);
      if (stat) {
        if (stat.type === "dir") this.navigate(path);
        else this.openFile(path, stat.name);
      }
    if (['mp4', 'webm'].includes(ext)) {
      Registry.launch('video')
      return
    }

    // Backspace — go up (when not typing)
    if (
      e.key === "Backspace" &&
      e.target.closest("input") === null &&
      this.selectedItems.size === 0
    ) {
      e.preventDefault();
      this.goUp();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
      Registry.launch('photos')
      return
    }

    // F2 — rename
    if (e.key === "F2" && this.selectedItems.size === 1) {
      e.preventDefault();
      this.renameItem([...this.selectedItems][0]);
    }
    this.notify('Notice', 'Files', `Cannot preview binary file: ${name}`)
  }

  // ---- FILE OPERATIONS ----
  clearSelection() {
    this.selectedItems.clear()
    this.container.querySelectorAll('.files-item.selected, .files-list-row.selected').forEach(el => {
      el.classList.remove('selected')
    })
    this.updateStatusSelection()
  }

  createNewFile() {
    const name = prompt("New file name:");
    if (!name || !name.trim()) return;
  selectAll() {
    this.selectedItems.clear()
    this.container.querySelectorAll('.files-item, .files-list-row').forEach(el => {
      this.selectedItems.add(el.dataset.path)
      el.classList.add('selected')
    })
    this.updateStatusSelection()
  }

    const path = FileSystem.join(this.currentPath, name.trim());
  selectRange(fromPath, toPath) {
    const items = Array.from(this.container.querySelectorAll('.files-item, .files-list-row'))
    const paths = items.map(el => el.dataset.path)
    const idxA = paths.indexOf(fromPath)
    const idxB = paths.indexOf(toPath)
    if (idxA === -1 || idxB === -1) return

    if (FileSystem.exists(path)) {
<<<<<<< HEAD
      this.notify('Warning', 'Already exists', `"${name}" already exists in this folder`)
      return
=======
      this.notify(
        "⚠️",
        "Already exists",
        `"${name}" already exists in this folder`,
      );
      return;
>>>>>>> origin/main
    const [start, end] = [Math.min(idxA, idxB), Math.max(idxA, idxB)]
    this.clearSelection()
    for (let i = start; i <= end; i++) {
      this.selectedItems.add(paths[i])
      items[i].classList.add('selected')
    }
    this.updateStatusSelection()
  }

    const result = FileSystem.writeFile(path, "");
    if (result.error) {
<<<<<<< HEAD
      this.notify('Error', 'Error', result.error)
  updateStatusSelection() {
    const selEl = this.$('#fs-selected')
    if (!selEl) return
    const count = this.selectedItems.size
    selEl.textContent = count > 0 ? `${count} selected` : ''
  }

  setViewMode(mode) {
    this.viewMode = mode
    this.$('#fb-grid')?.classList.toggle('active', mode === 'grid')
    this.$('#fb-list')?.classList.toggle('active', mode === 'list')
    this.render()
  }

  // ---- FILE OPERATIONS ----

  createNewFile() {
    const name = prompt('Enter new file name:', 'untitled.txt')
    if (!name) return
    const path = FileSystem.join(this.currentPath, name)
    const res = FileSystem.writeFile(path, '')
    if (res.error) {
      this.notify('Error', 'Files', res.error)
    } else {
      this.notify('Done', 'Created', name)
      this.render()
=======
      this.notify("❌", "Error", result.error);
    } else {
      this.notify("✅", "Created", name);
      this.render();
>>>>>>> origin/main
    }
  }

  createNewFolder() {
    const name = prompt("New folder name:");
    if (!name || !name.trim()) return;

    const path = FileSystem.join(this.currentPath, name.trim());

    if (FileSystem.exists(path)) {
<<<<<<< HEAD
      this.notify('Warning', 'Already exists', `"${name}" already exists in this folder`)
      return
=======
      this.notify(
        "⚠️",
        "Already exists",
        `"${name}" already exists in this folder`,
      );
      return;
>>>>>>> origin/main
    }

    const result = FileSystem.mkdir(path);
    if (result.error) {
<<<<<<< HEAD
      this.notify('Error', 'Error', result.error)
    const name = prompt('Enter new folder name:', 'New Folder')
    if (!name) return
    const path = FileSystem.join(this.currentPath, name)
    const res = FileSystem.mkdir(path)
    if (res.error) {
      this.notify('Error', 'Files', res.error)
    } else {
      this.notify('Done', 'Created', name)
      this.render()
=======
      this.notify("❌", "Error", result.error);
    } else {
      this.notify("✅", "Created", name);
      this.render();
>>>>>>> origin/main
    }
  }

  renameSelected() {
    if (this.selectedItems.size !== 1) return
    const path = Array.from(this.selectedItems)[0]
    this.renameItem(path)
  }

  renameItem(path) {
    const oldName = FileSystem.basename(path);
    const newName = prompt("Rename to:", oldName);
    const oldName = FileSystem.basename(path)
    const newName = prompt('Rename item to:', oldName)
    if (!newName || newName === oldName) return

    if (!newName || !newName.trim() || newName.trim() === oldName) return;

    const newPath = FileSystem.join(
      FileSystem.parentPath(path),
      newName.trim(),
    );

    if (FileSystem.exists(newPath)) {
<<<<<<< HEAD
      this.notify('Warning', 'Already exists', `"${newName}" already exists`)
      return
=======
      this.notify("⚠️", "Already exists", `"${newName}" already exists`);
      return;
>>>>>>> origin/main
    }

    const result = FileSystem.mv(path, newPath);
    if (result.error) {
<<<<<<< HEAD
      this.notify('Error', 'Rename failed', result.error)
=======
      this.notify("❌", "Rename failed", result.error);
>>>>>>> origin/main
    const res = FileSystem.rename(path, newName)
    if (res.error) {
      this.notify('Error', 'Files', res.error)
    } else {
      this.selectedItems.clear();
      this.selectedItems.add(newPath);
      this.render();
      this.render()
    }
  }

  deleteSelected() {
    const count = this.selectedItems.size;
    const names = [...this.selectedItems].map((p) => FileSystem.basename(p));
    const count = this.selectedItems.size
    if (count === 0) return
    if (!confirm(`Delete ${count} item${count === 1 ? '' : 's'}?`)) return

    const msg =
      count === 1 ? `Delete "${names[0]}"?` : `Delete ${count} items?`;

    if (!confirm(msg)) return;

    let deleted = 0;
    for (const path of this.selectedItems) {
      const result = FileSystem.rm(path, true);
      if (!result.error) deleted++;
    }

<<<<<<< HEAD
    this.selectedItems.clear()
    this.notify('Delete', 'Deleted', `${deleted} item${deleted !== 1 ? 's' : ''} removed`)
    this.selectedItems.forEach(p => {
      FileSystem.delete(p)
    })
    this.clearSelection()
    this.render()
=======
    this.selectedItems.clear();
    this.notify(
      "🗑️",
      "Deleted",
      `${deleted} item${deleted !== 1 ? "s" : ""} removed`,
    );
    this.render();
>>>>>>> origin/main
  }

  copySelected() {
    if (this.selectedItems.size === 0) return;
    if (this.selectedItems.size === 0) return
    this.clipboard = {
      action: "copy",
      paths: [...this.selectedItems],
<<<<<<< HEAD
      op: 'copy',
      paths: Array.from(this.selectedItems),
    }
    this.notify('list', 'Copied', `${this.selectedItems.size} item${this.selectedItems.size !== 1 ? 's' : ''}`)
=======
    };
    this.notify(
      "📋",
      "Copied",
      `${this.selectedItems.size} item${this.selectedItems.size !== 1 ? "s" : ""}`,
    );
>>>>>>> origin/main
    this.notify('Info', 'Clipboard', `Copied ${this.selectedItems.size} item(s)`)
  }

  cutSelected() {
    if (this.selectedItems.size === 0) return;
    if (this.selectedItems.size === 0) return
    this.clipboard = {
      action: "cut",
      paths: [...this.selectedItems],
<<<<<<< HEAD
      op: 'cut',
      paths: Array.from(this.selectedItems),
    }
    this.notify('Cut', 'Cut', `${this.selectedItems.size} item${this.selectedItems.size !== 1 ? 's' : ''}`)
=======
    };
    this.notify(
      "✂️",
      "Cut",
      `${this.selectedItems.size} item${this.selectedItems.size !== 1 ? "s" : ""}`,
    );
>>>>>>> origin/main
    this.notify('Info', 'Clipboard', `Cut ${this.selectedItems.size} item(s)`)
  }

  pasteClipboard() {
    if (!this.clipboard || this.clipboard.paths.length === 0) return;
    if (!this.clipboard || !this.clipboard.paths.length) return

    let completed = 0;
    for (const srcPath of this.clipboard.paths) {
      const name = FileSystem.basename(srcPath);
      let destPath = FileSystem.join(this.currentPath, name);
    this.clipboard.paths.forEach(srcPath => {
      const name = FileSystem.basename(srcPath)
      const destPath = FileSystem.join(this.currentPath, name)

      // Handle name conflict
      if (FileSystem.exists(destPath) && destPath !== srcPath) {
        const ext = name.includes(".") ? "." + name.split(".").pop() : "";
        const base = ext ? name.slice(0, -ext.length) : name;
        destPath = FileSystem.join(this.currentPath, `${base} (copy)${ext}`);
      if (this.clipboard.op === 'copy') {
        FileSystem.copy(srcPath, destPath)
      } else if (this.clipboard.op === 'cut') {
        FileSystem.move(srcPath, destPath)
      }
    })

      let result;
      if (this.clipboard.action === "copy") {
        result = FileSystem.cp(srcPath, destPath);
      } else {
        // Don't move to same location
        if (destPath === srcPath) continue;
        result = FileSystem.mv(srcPath, destPath);
      }

      if (!result.error) completed++;
    if (this.clipboard.op === 'cut') {
      this.clipboard = null
    }

    if (this.clipboard.action === "cut") {
      this.clipboard = null;
    }
    this.render()
  }

<<<<<<< HEAD
    this.selectedItems.clear()
    this.notify('list', 'Pasted', `${completed} item${completed !== 1 ? 's' : ''}`)
  moveItems(paths, destDir) {
    paths.forEach(p => {
      const name = FileSystem.basename(p)
      const dest = FileSystem.join(destDir, name)
      FileSystem.move(p, dest)
    })
    this.render()
=======
    this.selectedItems.clear();
    this.notify(
      "📋",
      "Pasted",
      `${completed} item${completed !== 1 ? "s" : ""}`,
    );
    this.render();
>>>>>>> origin/main
  }

  // ---- CONTEXT MENUS ----

  showItemMenu(x, y, path, name, type) {
    this.closeMenu();
  showItemMenu(x, y, path, type, name) {
    this.closeMenu()

    const items = [];
    const items = []

    // Open
<<<<<<< HEAD
    if (type === 'dir') {
      items.push({ icon: 'folder', label: 'Open', action: () => this.navigate(path) })
      items.push({ icon: icon('folder'), label: 'Open Folder', action: () => this.navigate(path) })
    } else {
      items.push({ icon: 'note', label: 'Open in Editor', action: () => this.openFile(path, name) })
=======
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
>>>>>>> origin/main
      if (name.endsWith('.md')) {
        items.push({
          icon: icon('markdown'),
          label: 'Open in Markdown Viewer',
          action: () => {
            EventBus.emit('markdown:queueFile', { path })
            EventBus.emit('markdown:openFile', { path })
            Registry.launch('markdown', { path })
          }
        })
      }
      items.push({ icon: icon('editor'), label: 'Open in Editor', action: () => this.openFile(path, name) })
    }

    items.push({ type: "separator" });
    items.push({ type: 'separator' })

    // Edit operations
<<<<<<< HEAD
    items.push({ icon: 'Pencil', label: 'Rename', shortcut: 'F2', action: () => this.renameItem(path) })
    items.push({ icon: 'list', label: 'Copy', shortcut: '⌘C', action: () => this.copySelected() })
    items.push({ icon: 'Cut', label: 'Cut', shortcut: '⌘X', action: () => this.cutSelected() })
    items.push({ icon: icon('editor'), label: 'Rename', shortcut: 'F2', action: () => this.renameItem(path) })
    items.push({ icon: icon('files'), label: 'Copy', shortcut: '⌘C', action: () => this.copySelected() })
    items.push({ icon: icon('close'), label: 'Cut', shortcut: '⌘X', action: () => this.cutSelected() })

    if (this.clipboard) {
      items.push({ icon: 'file', label: 'Paste', shortcut: '⌘V', action: () => this.pasteClipboard() })
=======
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
>>>>>>> origin/main
      items.push({ icon: icon('file'), label: 'Paste', shortcut: '⌘V', action: () => this.pasteClipboard() })
    }

    items.push({ type: "separator" });
    items.push({ type: 'separator' })

    // File info
    const stat = FileSystem.stat(path);
    if (stat && stat.type === "file") {
    const stat = FileSystem.stat(path)
    if (stat && stat.type === 'file') {
      items.push({
<<<<<<< HEAD
        icon: 'Info',
=======
        icon: "ℹ️",
>>>>>>> origin/main
        icon: icon('info'),
        label: `${this.formatSize(stat.size)}`,
        action: () => {},
        action: () => { },
        disabled: true,
      });
      })
    }

    if (stat && stat.type === "dir") {
      const dirDu = FileSystem.du(path);
    if (stat && stat.type === 'dir') {
      const dirDu = FileSystem.du(path)
      items.push({
<<<<<<< HEAD
        icon: 'Info',
=======
        icon: "ℹ️",
>>>>>>> origin/main
        icon: icon('info'),
        label: `${dirDu.fileCount} files, ${this.formatSize(dirDu.totalSize)}`,
        action: () => {},
        action: () => { },
        disabled: true,
      });
      })
    }

    items.push({ type: "separator" });
    items.push({ type: 'separator' })

    // Delete
<<<<<<< HEAD
    items.push({ icon: 'Delete', label: 'Delete', shortcut: 'Del', action: () => this.deleteSelected() })
=======
    items.push({
      icon: "🗑️",
      label: "Delete",
      shortcut: "Del",
      action: () => this.deleteSelected(),
    });
>>>>>>> origin/main
    items.push({ icon: icon('close'), label: 'Delete', shortcut: 'Del', action: () => this.deleteSelected() })

    this.showMenu(x, y, items);
    this.showMenu(x, y, items)
  }

  showGridMenu(x, y) {
    this.closeMenu();
    this.closeMenu()

    const items = [
<<<<<<< HEAD
      { icon: 'file', label: 'New File', action: () => this.createNewFile() },
      { icon: 'folder', label: 'New Folder', action: () => this.createNewFolder() },
      { icon: icon('file'), label: 'New File', action: () => this.createNewFile() },
      { icon: icon('folder'), label: 'New Folder', action: () => this.createNewFolder() },
      { type: 'separator' },
    ]

    if (this.clipboard) {
      items.push({ icon: 'list', label: 'Paste', shortcut: '⌘V', action: () => this.pasteClipboard() })
      items.push({ icon: icon('files'), label: 'Paste', shortcut: '⌘V', action: () => this.pasteClipboard() })
      items.push({ type: 'separator' })
=======
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
>>>>>>> origin/main
    }

    items.push({ icon: "↻", label: "Refresh", action: () => this.render() });
    items.push({ icon: icon('settings'), label: 'Refresh', action: () => this.render() })

    if (this.currentPath !== "/home/root") {
      items.push({
        icon: "⌂",
        label: "Go Home",
        action: () => this.navigate("/home/root"),
      });
    if (this.currentPath !== '/home/root') {
      items.push({ icon: icon('brand'), label: 'Go Home', action: () => this.navigate('/home/root') })
    }

    this.showMenu(x, y, items);
    this.showMenu(x, y, items)
  }

  showMenu(x, y, items) {
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.position = "fixed";
    menu.style.zIndex = "99999";
    const menu = document.createElement('div')
    menu.className = 'context-menu'
    menu.style.position = 'fixed'
    menu.style.zIndex = '99999'

    menu.innerHTML = items
      .map((item) => {
        if (item.type === "separator") {
          return '<div class="ctx-separator"></div>';
        }
        return `
        <div class="ctx-item ${item.disabled ? "disabled" : ""}">
    menu.innerHTML = items.map(item => {
      if (item.type === 'separator') {
        return '<div class="ctx-separator"></div>'
      }
      return `
        <div class="ctx-item ${item.disabled ? 'disabled' : ''}">
          <span class="ctx-item-icon">${item.icon}</span>
          <span class="ctx-item-label">${item.label}</span>
          ${item.shortcut ? `<span class="ctx-item-shortcut">${item.shortcut}</span>` : ""}
          <span class="ctx-item-label">${escapeHtml(item.label)}</span>
          ${item.shortcut ? `<span class="ctx-item-shortcut">${escapeHtml(item.shortcut)}</span>` : ''}
        </div>
      `;
      })
      .join("");
      `
    }).join('')

    // Position — keep within viewport
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    document.body.appendChild(menu)
    const rect = menu.getBoundingClientRect()

    menu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + "px";
    menu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + "px";
    menu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + 'px'
    menu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + 'px'

    // Bind actions
    const actionItems = items.filter(
      (i) => i.type !== "separator" && !i.disabled,
    );
    let actionIndex = 0;
    menu.querySelectorAll(".ctx-item:not(.disabled)").forEach((el) => {
      const action = actionItems[actionIndex]?.action;
      actionIndex++;
    const actionItems = items.filter(i => i.type !== 'separator' && !i.disabled)
    let actionIndex = 0
    menu.querySelectorAll('.ctx-item:not(.disabled)').forEach(el => {
      const action = actionItems[actionIndex]?.action
      actionIndex++
      if (action) {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          action();
          this.closeMenu();
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          action()
          this.closeMenu()
        })
      }
    });
    })

    this._menu = menu;
    this._menu = menu

    // Close on any click outside
    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        this.closeMenu();
        document.removeEventListener("mousedown", closeHandler, true);
        this.closeMenu()
        document.removeEventListener('mousedown', closeHandler, true)
      }
    };
    // Use setTimeout so the current click doesn't immediately close it
    }
    setTimeout(() => {
      document.addEventListener("mousedown", closeHandler, true);
    }, 10);
      document.addEventListener('mousedown', closeHandler, true)
    }, 10)
  }

  closeMenu() {
    if (this._menu) {
      this._menu.remove();
      this._menu = null;
      this._menu.remove()
      this._menu = null
    }
  }

  // ---- HELPERS ----

  formatSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    if (!bytes || bytes === 0) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  onDestroy() {
    this.closeMenu();
    this.selectedItems.clear();
    this.clipboard = null;
    this.closeMenu()
    this.selectedItems.clear()
    this.clipboard = null
    if (this._onFsChange) EventBus.off('fs:change', this._onFsChange)
  }
}
