import BaseApp from '../BaseApp.js'
import FileSystem from '../../core/FileSystem.js'
import EventBus from '../../core/EventBus.js'
import Registry from '../../core/Registry.js'
import { icon } from '../../ui/Icons.js'

export default class Files extends BaseApp {
  async setup() {
    this.currentPath = '/home/root'
    this.history = ['/home/root']
    this.historyIndex = 0
    this.viewMode = 'grid' // 'grid' | 'list'
    this.sortBy = 'name' // 'name' | 'size' | 'time'
    this.sortAsc = true
    this.selectedItems = new Set()
    this.clipboard = null // { op: 'copy'|'cut', paths: [] }

    this.renderShell()
    this.navigate(this.currentPath, false)
    this.bindEvents()
  }

  renderShell() {
    this.container.innerHTML = `
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

          <!-- File Grid / List -->
          <div class="files-content" id="files-content">
            <div class="files-grid" id="files-grid"></div>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="files-statusbar" id="files-status">
          <span id="fs-count">0 items</span>
          <span id="fs-selected"></span>
          <span id="fs-space">Persistent Storage</span>
        </div>
      </div>
    `
  }

  getIcon(entry) {
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

  bindEvents() {
    // Nav buttons
    this.$('#fb-back').addEventListener('click', () => this.goBack())
    this.$('#fb-forward').addEventListener('click', () => this.goForward())
    this.$('#fb-up').addEventListener('click', () => this.goUp())
    this.$('#fb-refresh').addEventListener('click', () => this.render())

    // Actions
    this.$('#fb-newfile').addEventListener('click', () => this.createNewFile())
    this.$('#fb-newfolder').addEventListener('click', () => this.createNewFolder())

    // View toggle
    this.$('#fb-grid').addEventListener('click', () => this.setViewMode('grid'))
    this.$('#fb-list').addEventListener('click', () => this.setViewMode('list'))

    // Sidebar items
    this.container.querySelectorAll('.files-sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const p = item.dataset.path
        if (p) this.navigate(p)
      })
    })

    // Content container click (deselect if clicking background)
    const content = this.$('#files-content')
    content.addEventListener('click', (e) => {
      if (e.target === content || e.target.id === 'files-grid') {
        this.clearSelection()
      }
    })

    // Content context menu (right click background)
    content.addEventListener('contextmenu', (e) => {
      if (e.target === content || e.target.id === 'files-grid') {
        e.preventDefault()
        this.showGridMenu(e.clientX, e.clientY)
      }
    })

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

    // Listen to filesystem events to keep in sync
    this._onFsChange = () => this.render()
    EventBus.on('fs:change', this._onFsChange)
  }

  navigate(path, recordHistory = true) {
    const stat = FileSystem.stat(path)
    if (!stat || stat.type !== 'dir') {
      this.notify('Error', 'Files', `Path not found: ${path}`)
      return
    }

    this.currentPath = path
    this.clearSelection()

    if (recordHistory) {
      this.history = this.history.slice(0, this.historyIndex + 1)
      this.history.push(path)
      this.historyIndex = this.history.length - 1
    }

    this.updateNavButtons()
    this.renderBreadcrumbs()
    this.render()
    this.highlightSidebar()
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.navigate(this.history[this.historyIndex], false)
    }
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.navigate(this.history[this.historyIndex], false)
    }
  }

  goUp() {
    if (this.currentPath === '/') return
    const parent = FileSystem.parentPath(this.currentPath)
    this.navigate(parent)
  }

  updateNavButtons() {
    const back = this.$('#fb-back')
    const forward = this.$('#fb-forward')
    const up = this.$('#fb-up')

    if (back) back.disabled = this.historyIndex <= 0
    if (forward) forward.disabled = this.historyIndex >= this.history.length - 1
    if (up) up.disabled = this.currentPath === '/'
  }

  renderBreadcrumbs() {
    const crumbsEl = this.$('#files-crumbs')
    if (!crumbsEl) return

    const parts = this.currentPath === '/' ? [''] : this.currentPath.split('/')
    let accum = ''
    let html = ''

    parts.forEach((part, i) => {
      accum += (i === 0 ? '' : '/') + part
      const p = accum || '/'
      const label = part || 'root'
      html += `<span class="files-crumb" data-path="${p}">${label}</span>`
      if (i < parts.length - 1) {
        html += '<span class="files-crumb-sep">/</span>'
      }
    })

    crumbsEl.innerHTML = html

    crumbsEl.querySelectorAll('.files-crumb').forEach(el => {
      el.addEventListener('click', () => {
        this.navigate(el.dataset.path)
      })
    })
  }

  highlightSidebar() {
    this.container.querySelectorAll('.files-sidebar-item').forEach(item => {
      if (item.dataset.path === this.currentPath) {
        item.classList.add('active')
      } else {
        item.classList.remove('active')
      }
    })
  }

  render() {
    const grid = this.$('#files-grid')
    if (!grid) return

    let entries = FileSystem.readdir(this.currentPath) || []

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
    }

    if (this.viewMode === 'grid') {
      grid.className = 'files-grid'
      grid.innerHTML = entries.map(e => `
        <div class="files-item ${this.selectedItems.has(e.path) ? 'selected' : ''}" data-path="${e.path}" data-type="${e.type}" data-name="${e.name}">
          <div class="files-item-icon">${this.getIcon(e)}</div>
          <div class="files-item-name" title="${e.name}">${e.name}</div>
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
          <div class="files-list-row ${this.selectedItems.has(e.path) ? 'selected' : ''}" data-path="${e.path}" data-type="${e.type}" data-name="${e.name}">
            <div class="flr-name">
              <span class="flr-icon">${this.getIcon(e)}</span>
              <span class="flr-label" title="${e.name}">${e.name}</span>
            </div>
            <div class="flr-size">${e.type === 'dir' ? '--' : this.formatSize(e.size)}</div>
            <div class="flr-time">${new Date(e.mtime).toLocaleDateString()}</div>
          </div>
        `).join('')}
      `
    }

    this.bindItemEvents()
  }

  bindItemEvents() {
    const items = this.container.querySelectorAll('.files-item, .files-list-row')

    items.forEach(el => {
      const path = el.dataset.path
      const type = el.dataset.type
      const name = el.dataset.name

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

      // Double-click: open / enter
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation()
        if (type === 'dir') {
          this.navigate(path)
        } else {
          this.openFile(path, name)
        }
      })

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

      // Drag and Drop support
      el.setAttribute('draggable', 'true')
      el.addEventListener('dragstart', (e) => {
        const dragPaths = this.selectedItems.has(path) ? Array.from(this.selectedItems) : [path]
        e.dataTransfer.setData('text/plain', JSON.stringify({ paths: dragPaths, sourcePath: this.currentPath }))
        e.dataTransfer.effectAllowed = 'move'
      })

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
    })
  }

  openFile(path, name) {
    const ext = name.split('.').pop()?.toLowerCase()
    const content = FileSystem.readFile(path)

    const textExtensions = [
      'txt', 'md', 'js', 'json', 'css', 'html', 'log', 'py', 'sh',
      'ts', 'jsx', 'tsx', 'yml', 'yaml', 'xml', 'svg', 'ini', 'conf', 'env',
      'gitignore', 'dockerignore', 'sql', 'graphql'
    ]

    const isText = !ext || textExtensions.includes(ext) || name.startsWith('.')

    if (ext === 'md') {
      EventBus.emit('markdown:queueFile', { path })
      EventBus.emit('markdown:openFile', { path })
      Registry.launch('markdown', { path })
      return
    }

    if (isText) {
      EventBus.emit('editor:queueFile', { path, content })
      EventBus.emit('editor:openFile', { path, content })
      Registry.launch('editor')
      return
    }

    if (['mp3', 'wav', 'ogg'].includes(ext)) {
      Registry.launch('music')
      return
    }

    if (['mp4', 'webm'].includes(ext)) {
      Registry.launch('video')
      return
    }

    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
      Registry.launch('photos')
      return
    }

    this.notify('Notice', 'Files', `Cannot preview binary file: ${name}`)
  }

  clearSelection() {
    this.selectedItems.clear()
    this.container.querySelectorAll('.files-item.selected, .files-list-row.selected').forEach(el => {
      el.classList.remove('selected')
    })
    this.updateStatusSelection()
  }

  selectAll() {
    this.selectedItems.clear()
    this.container.querySelectorAll('.files-item, .files-list-row').forEach(el => {
      this.selectedItems.add(el.dataset.path)
      el.classList.add('selected')
    })
    this.updateStatusSelection()
  }

  selectRange(fromPath, toPath) {
    const items = Array.from(this.container.querySelectorAll('.files-item, .files-list-row'))
    const paths = items.map(el => el.dataset.path)
    const idxA = paths.indexOf(fromPath)
    const idxB = paths.indexOf(toPath)
    if (idxA === -1 || idxB === -1) return

    const [start, end] = [Math.min(idxA, idxB), Math.max(idxA, idxB)]
    this.clearSelection()
    for (let i = start; i <= end; i++) {
      this.selectedItems.add(paths[i])
      items[i].classList.add('selected')
    }
    this.updateStatusSelection()
  }

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
      this.render()
    }
  }

  createNewFolder() {
    const name = prompt('Enter new folder name:', 'New Folder')
    if (!name) return
    const path = FileSystem.join(this.currentPath, name)
    const res = FileSystem.mkdir(path)
    if (res.error) {
      this.notify('Error', 'Files', res.error)
    } else {
      this.render()
    }
  }

  renameSelected() {
    if (this.selectedItems.size !== 1) return
    const path = Array.from(this.selectedItems)[0]
    this.renameItem(path)
  }

  renameItem(path) {
    const oldName = FileSystem.basename(path)
    const newName = prompt('Rename item to:', oldName)
    if (!newName || newName === oldName) return

    const res = FileSystem.rename(path, newName)
    if (res.error) {
      this.notify('Error', 'Files', res.error)
    } else {
      this.render()
    }
  }

  deleteSelected() {
    const count = this.selectedItems.size
    if (count === 0) return
    if (!confirm(`Delete ${count} item${count === 1 ? '' : 's'}?`)) return

    this.selectedItems.forEach(p => {
      FileSystem.delete(p)
    })
    this.clearSelection()
    this.render()
  }

  copySelected() {
    if (this.selectedItems.size === 0) return
    this.clipboard = {
      op: 'copy',
      paths: Array.from(this.selectedItems),
    }
    this.notify('Info', 'Clipboard', `Copied ${this.selectedItems.size} item(s)`)
  }

  cutSelected() {
    if (this.selectedItems.size === 0) return
    this.clipboard = {
      op: 'cut',
      paths: Array.from(this.selectedItems),
    }
    this.notify('Info', 'Clipboard', `Cut ${this.selectedItems.size} item(s)`)
  }

  pasteClipboard() {
    if (!this.clipboard || !this.clipboard.paths.length) return

    this.clipboard.paths.forEach(srcPath => {
      const name = FileSystem.basename(srcPath)
      const destPath = FileSystem.join(this.currentPath, name)

      if (this.clipboard.op === 'copy') {
        FileSystem.copy(srcPath, destPath)
      } else if (this.clipboard.op === 'cut') {
        FileSystem.move(srcPath, destPath)
      }
    })

    if (this.clipboard.op === 'cut') {
      this.clipboard = null
    }

    this.render()
  }

  moveItems(paths, destDir) {
    paths.forEach(p => {
      const name = FileSystem.basename(p)
      const dest = FileSystem.join(destDir, name)
      FileSystem.move(p, dest)
    })
    this.render()
  }

  // ---- CONTEXT MENUS ----

  showItemMenu(x, y, path, type, name) {
    this.closeMenu()

    const items = []

    if (type === 'dir') {
      items.push({ icon: icon('folder'), label: 'Open Folder', action: () => this.navigate(path) })
    } else {
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

    items.push({ type: 'separator' })

    // Edit operations
    items.push({ icon: icon('editor'), label: 'Rename', shortcut: 'F2', action: () => this.renameItem(path) })
    items.push({ icon: icon('files'), label: 'Copy', shortcut: '⌘C', action: () => this.copySelected() })
    items.push({ icon: icon('close'), label: 'Cut', shortcut: '⌘X', action: () => this.cutSelected() })

    if (this.clipboard) {
      items.push({ icon: icon('file'), label: 'Paste', shortcut: '⌘V', action: () => this.pasteClipboard() })
    }

    items.push({ type: 'separator' })

    // File info
    const stat = FileSystem.stat(path)
    if (stat && stat.type === 'file') {
      items.push({
        icon: icon('info'),
        label: `${this.formatSize(stat.size)}`,
        action: () => { },
        disabled: true,
      })
    }

    if (stat && stat.type === 'dir') {
      const dirDu = FileSystem.du(path)
      items.push({
        icon: icon('info'),
        label: `${dirDu.fileCount} files, ${this.formatSize(dirDu.totalSize)}`,
        action: () => { },
        disabled: true,
      })
    }

    items.push({ type: 'separator' })

    // Delete
    items.push({ icon: icon('close'), label: 'Delete', shortcut: 'Del', action: () => this.deleteSelected() })

    this.showMenu(x, y, items)
  }

  showGridMenu(x, y) {
    this.closeMenu()

    const items = [
      { icon: icon('file'), label: 'New File', action: () => this.createNewFile() },
      { icon: icon('folder'), label: 'New Folder', action: () => this.createNewFolder() },
      { type: 'separator' },
    ]

    if (this.clipboard) {
      items.push({ icon: icon('files'), label: 'Paste', shortcut: '⌘V', action: () => this.pasteClipboard() })
      items.push({ type: 'separator' })
    }

    items.push({ icon: icon('settings'), label: 'Refresh', action: () => this.render() })

    if (this.currentPath !== '/home/root') {
      items.push({ icon: icon('brand'), label: 'Go Home', action: () => this.navigate('/home/root') })
    }

    this.showMenu(x, y, items)
  }

  showMenu(x, y, items) {
    const menu = document.createElement('div')
    menu.className = 'context-menu'
    menu.style.position = 'fixed'
    menu.style.zIndex = '99999'

    menu.innerHTML = items.map(item => {
      if (item.type === 'separator') {
        return '<div class="ctx-separator"></div>'
      }
      return `
        <div class="ctx-item ${item.disabled ? 'disabled' : ''}">
          <span class="ctx-item-icon">${item.icon}</span>
          <span class="ctx-item-label">${item.label}</span>
          ${item.shortcut ? `<span class="ctx-item-shortcut">${item.shortcut}</span>` : ''}
        </div>
      `
    }).join('')

    document.body.appendChild(menu)
    const rect = menu.getBoundingClientRect()

    menu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + 'px'
    menu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + 'px'

    const actionItems = items.filter(i => i.type !== 'separator' && !i.disabled)
    let actionIndex = 0
    menu.querySelectorAll('.ctx-item:not(.disabled)').forEach(el => {
      const action = actionItems[actionIndex]?.action
      actionIndex++
      if (action) {
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          action()
          this.closeMenu()
        })
      }
    })

    this._menu = menu

    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        this.closeMenu()
        document.removeEventListener('mousedown', closeHandler, true)
      }
    }
    setTimeout(() => {
      document.addEventListener('mousedown', closeHandler, true)
    }, 10)
  }

  closeMenu() {
    if (this._menu) {
      this._menu.remove()
      this._menu = null
    }
  }

  formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  onDestroy() {
    this.closeMenu()
    this.selectedItems.clear()
    this.clipboard = null
    if (this._onFsChange) EventBus.off('fs:change', this._onFsChange)
  }
}
