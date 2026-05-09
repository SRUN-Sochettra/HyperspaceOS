// ============================================================
//  Spotlight.js — Universal search
//  Searches apps, files, commands, and settings.
//  Activated by Ctrl+Space or Cmd+Space.
// ============================================================

import Registry from '../core/Registry.js'
import FileSystem from '../core/FileSystem.js'
import EventBus from '../core/EventBus.js'

const Spotlight = (() => {

    let overlay = null
    let input = null
    let results = null
    let isOpen = false
    let selectedIndex = 0
    let currentResults = []

    function init() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                e.preventDefault()
                toggle()
            }
            if (e.key === 'Escape' && isOpen) {
                close()
            }
        })

        console.log('[Spotlight] Initialized (Ctrl+Space to open)')
    }

    function toggle() {
        if (isOpen) close()
        else open()
    }

    function open() {
        if (isOpen) return
        isOpen = true
        selectedIndex = 0

        overlay = document.createElement('div')
        overlay.className = 'spotlight-overlay'

        overlay.innerHTML = `
      <div class="spotlight-container">
        <div class="spotlight-input-row">
          <span class="spotlight-icon">🔍</span>
          <input
            type="text"
            class="spotlight-input"
            placeholder="Search apps, files, commands..."
            spellcheck="false"
            autocomplete="off"
          />
          <span class="spotlight-shortcut">ESC</span>
        </div>
        <div class="spotlight-results"></div>
      </div>
    `

        document.body.appendChild(overlay)

        input = overlay.querySelector('.spotlight-input')
        results = overlay.querySelector('.spotlight-results')

        // Focus input
        requestAnimationFrame(() => input.focus())

        // Type to search
        input.addEventListener('input', () => {
            search(input.value)
        })

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1)
                updateSelection()
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                selectedIndex = Math.max(selectedIndex - 1, 0)
                updateSelection()
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                executeResult(selectedIndex)
            }
            if (e.key === 'Escape') {
                close()
            }
        })

        // Click overlay to close
        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) close()
        })

        // Show default results
        search('')
    }

    function close() {
        if (!isOpen) return
        isOpen = false

        if (overlay) {
            overlay.classList.add('closing')
            setTimeout(() => {
                if (overlay && overlay.parentNode) overlay.remove()
                overlay = null
                input = null
                results = null
            }, 150)
        }
    }

    function search(query) {
        currentResults = []
        selectedIndex = 0

        const q = query.trim().toLowerCase()

        // Category 1: Apps
        const apps = Registry.all()
            .filter(app => {
                if (!q) return true
                return app.title.toLowerCase().includes(q)
                    || app.id.toLowerCase().includes(q)
                    || app.category.toLowerCase().includes(q)
            })
            .slice(0, 5)
            .map(app => ({
                type: 'app',
                icon: app.icon,
                title: app.title,
                subtitle: `Open ${app.title}`,
                action: () => Registry.launch(app.id),
            }))

        currentResults.push(...apps)

        // Category 2: Files (only if query has content)
        if (q.length >= 1) {
            const files = FileSystem.find('/', q)
                .slice(0, 8)
                .map(f => ({
                    type: 'file',
                    icon: f.type === 'dir' ? '📁' : '📄',
                    title: f.name,
                    subtitle: f.path,
                    action: () => {
                        if (f.type === 'dir') {
                            // Open Files app navigated to this dir
                            Registry.launch('files')
                        } else {
                            EventBus.emit('editor:queueFile', {
                                path: f.path,
                                content: FileSystem.readFile(f.path),
                            })
                            EventBus.emit('editor:openFile', {
                                path: f.path,
                                content: FileSystem.readFile(f.path),
                            })
                            Registry.launch('editor')
                        }
                    },
                }))

            if (files.length > 0) {
                currentResults.push({ type: 'divider', label: 'Files' })
                currentResults.push(...files)
            }
        }

        // Category 3: Quick actions
        if (q.length >= 1) {
            const actions = [
                { match: ['tile', 'arrange', 'windows'], icon: '⊞', title: 'Tile All Windows', action: () => EventBus.emit('window:tile') },
                { match: ['theme', 'color', 'accent'], icon: '🎨', title: 'Change Theme', action: () => Registry.launch('settings') },
                { match: ['terminal', 'command', 'shell', 'bash'], icon: '⌨️', title: 'New Terminal', action: () => Registry.launch('terminal') },
                { match: ['reload', 'restart', 'reboot'], icon: '🔄', title: 'Restart OS', action: () => location.reload() },
                {
                    match: ['clear', 'reset', 'wipe'], icon: '🗑️', title: 'Clear All Data', action: () => {
                        if (confirm('Clear all saved data?')) {
                            localStorage.clear()
                            location.reload()
                        }
                    }
                },
            ]
                .filter(a => a.match.some(m => m.includes(q) || q.includes(m)))
                .map(a => ({
                    type: 'action',
                    icon: a.icon,
                    title: a.title,
                    subtitle: 'Quick Action',
                    action: a.action,
                }))

            if (actions.length > 0) {
                currentResults.push({ type: 'divider', label: 'Actions' })
                currentResults.push(...actions)
            }
        }

        // Empty state
        if (currentResults.length === 0 && q.length > 0) {
            currentResults.push({
                type: 'empty',
                icon: '🔍',
                title: 'No results found',
                subtitle: `Nothing matches "${q}"`,
            })
        }

        renderResults()
    }

    function renderResults() {
        if (!results) return

        results.innerHTML = currentResults.map((item, i) => {
            if (item.type === 'divider') {
                return `<div class="spotlight-divider">${item.label}</div>`
            }

            const isSelected = i === selectedIndex
            const isClickable = item.type !== 'empty'

            return `
        <div class="spotlight-result ${isSelected ? 'selected' : ''} ${isClickable ? '' : 'disabled'}"
             data-index="${i}">
          <span class="spotlight-result-icon">${item.icon}</span>
          <div class="spotlight-result-text">
            <div class="spotlight-result-title">${item.title}</div>
            <div class="spotlight-result-subtitle">${item.subtitle || ''}</div>
          </div>
          ${item.type === 'app' ? '<span class="spotlight-result-badge">App</span>' : ''}
          ${item.type === 'file' ? '<span class="spotlight-result-badge file">File</span>' : ''}
          ${item.type === 'action' ? '<span class="spotlight-result-badge action">Action</span>' : ''}
        </div>
      `
        }).join('')

        // Click handlers
        results.querySelectorAll('.spotlight-result:not(.disabled)').forEach(el => {
            el.addEventListener('click', () => {
                executeResult(parseInt(el.dataset.index))
            })
            el.addEventListener('mouseenter', () => {
                selectedIndex = parseInt(el.dataset.index)
                updateSelection()
            })
        })
    }

    function updateSelection() {
        if (!results) return
        results.querySelectorAll('.spotlight-result').forEach((el, i) => {
            el.classList.toggle('selected', i === selectedIndex)
        })

        // Scroll into view
        const selected = results.querySelector('.spotlight-result.selected')
        if (selected) selected.scrollIntoView({ block: 'nearest' })
    }

    function executeResult(index) {
        const item = currentResults[index]
        if (!item || !item.action) return

        close()
        // Small delay so close animation plays
        setTimeout(() => item.action(), 160)
    }

    return { init, open, close, toggle }

})()

export default Spotlight