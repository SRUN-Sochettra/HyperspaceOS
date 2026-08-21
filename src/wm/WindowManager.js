// ============================================================
//  WindowManager.js — The orchestrator
//  Manages all windows: creation, focus order, z-indexing,
//  minimize/maximize/close lifecycle, and tiling.
//
//  Listens to EventBus for all window actions.
//  Never imported by apps directly — they use Registry.launch()
//  which emits 'app:launch' and this picks it up.
// ============================================================

import EventBus from '../core/EventBus.js'
import Store from '../core/Store.js'
import Registry from '../core/Registry.js'
import Window from './Window.js'
import DragController from './DragController.js'
import ResizeController from './ResizeController.js'

const WindowManager = (() => {

    // Live window instances keyed by ID
    const windows = new Map()

    // Monotonically increasing counters
    let nextId = 1
    let nextZIndex = 100

    // DOM container
    let container = null

    // ---- INIT ----
    function init() {
        container = document.getElementById('window-layer')
        if (!container) {
            throw new Error('[WindowManager] #window-layer not found in DOM')
        }

        // Initialize sub-controllers
        DragController.init(getWindow)
        ResizeController.init(getWindow)

        // ---- EVENT LISTENERS ----

        // App launch request (from Registry.launch, dock, terminal, etc.)
        EventBus.on('app:launch', ({ id, options }) => {
            open(id, options)
        })

        // Window actions
        EventBus.on('window:close', ({ id }) => close(id))
        EventBus.on('window:minimize', ({ id }) => minimize(id))
        EventBus.on('window:maximize', ({ id }) => toggleMaximize(id))
        EventBus.on('window:focus', ({ id }) => focus(id))

        // Tile command
        EventBus.on('window:tile', () => tileAll())

        // Keyboard shortcuts
        document.addEventListener('keydown', onKeyDown)

        console.log('[WindowManager] Initialized')
    }

    // ---- OPEN WINDOW ----
    async function open(appId, options = {}) {
        const def = Registry.get(appId)
        if (!def) {
            console.error(`[WindowManager] Unknown app: "${appId}"`)
            return null
        }

        if (def.singleton) {
            const existing = findByAppId(appId)
            if (existing) {
                focus(existing.id)
                return existing
            }
        }

        const offset = windows.size % 8
        const x = options.x ?? (80 + offset * 28)
        const y = options.y ?? (60 + offset * 28)

        const id = nextId++
        const zIndex = nextZIndex++

        const win = new Window({ id, appId, x, y, zIndex })

        // Apply restored size if provided
        if (options.width) win.width = options.width
        if (options.height) win.height = options.height

        const element = win.render()
        container.appendChild(element)

        windows.set(id, win)
        EventBus.emit('window:opened', { id, appId })
        await win.loadApp()
        focus(id)
        syncStore()

        return win
    }

    // ---- CLOSE ----
    async function close(id) {
        const win = windows.get(id)
        if (!win) return

        await win.close()
        windows.delete(id)

        // If we closed the active window, focus the topmost remaining
        const activeId = Store.get('windows.active')
        if (activeId === id) {
            const topmost = getTopmost()
            if (topmost) {
                focus(topmost.id)
            } else {
                Store.set('windows.active', null)
                EventBus.emit('window:none-active')
            }
        }

        syncStore()

        EventBus.emit('window:closed', { id, appId: win.appId })
    }

    // ---- MINIMIZE ----
    function minimize(id) {
        const win = windows.get(id)
        if (!win) return

        win.minimize()

        // Focus next visible window
        const activeId = Store.get('windows.active')
        if (activeId === id) {
            const next = getTopmostVisible(id)
            if (next) {
                focus(next.id)
            } else {
                Store.set('windows.active', null)
                EventBus.emit('window:none-active')
            }
        }

        syncStore()

        EventBus.emit('window:minimized', { id })
    }

    // ---- TOGGLE MAXIMIZE ----
    function toggleMaximize(id) {
        const win = windows.get(id)
        if (!win) return

        win.toggleMaximize()
        focus(id)

        EventBus.emit('window:maximized', { id, maximized: win.maximized })
    }

    // ---- FOCUS ----
    function focus(id) {
        const win = windows.get(id)
        if (!win) return

        // Blur all others
        for (const [wId, w] of windows) {
            if (wId !== id) w.blur()
        }

        // Bring to top
        const z = nextZIndex++
        win.setZIndex(z)
        win.focus()

        Store.set('windows.active', id)

        // Update status bar app name
        const def = Registry.get(win.appId)
        EventBus.emit('statusbar:app', { name: def?.title || 'Desktop' })
    }

    // ---- TILE ALL WINDOWS ----
    function tileAll() {
        const visible = getVisibleWindows()
        if (visible.length === 0) return

        const cols = Math.ceil(Math.sqrt(visible.length))
        const rows = Math.ceil(visible.length / cols)

        const areaTop = 40
        const areaBottom = 76
        const areaWidth = window.innerWidth
        const areaHeight = window.innerHeight - areaTop - areaBottom

        const cellW = areaWidth / cols
        const cellH = areaHeight / rows
        const pad = 8

        visible.forEach((win, i) => {
            const col = i % cols
            const row = Math.floor(i / cols)

            // Unmaximize if needed
            if (win.maximized) {
                win.maximized = false
                win.preMaxBounds = null
                win.element.style.borderRadius = ''
            }

            win.setPosition(
                col * cellW + pad,
                areaTop + row * cellH + pad
            )
            win.setSize(
                cellW - pad * 2,
                cellH - pad * 2
            )
        })

        EventBus.emit('window:tiled')
    }

    // ---- CLOSE ALL ----
    async function closeAll() {
        const ids = [...windows.keys()]
        await Promise.all(ids.map(id => close(id)))
        windows.clear()
        if (container) {
            container.innerHTML = ''
        }
    }

    // ---- QUERY HELPERS ----

    function getWindow(id) {
        return windows.get(id) ?? windows.get(Number(id)) ?? windows.get(String(id)) ?? null
    }

    function findByAppId(appId) {
        for (const win of windows.values()) {
            if (win.appId === appId && !win.destroyed) return win
        }
        return null
    }

    function getAllWindows() {
        return [...windows.values()]
    }

    function getVisibleWindows() {
        return [...windows.values()].filter(w => !w.minimized && !w.destroyed)
    }

    function getTopmost() {
        let top = null
        let maxZ = -1
        for (const win of windows.values()) {
            if (!win.destroyed && win.zIndex > maxZ) {
                maxZ = win.zIndex
                top = win
            }
        }
        return top
    }

    function getTopmostVisible(excludeId = null) {
        let top = null
        let maxZ = -1
        for (const win of windows.values()) {
            if (win.destroyed || win.minimized) continue
            if (win.id === excludeId) continue
            if (win.zIndex > maxZ) {
                maxZ = win.zIndex
                top = win
            }
        }
        return top
    }

    // ---- SYNC STORE ----
    function syncStore() {
        Store.set('windows.all', [...windows.values()].map(w => w.toJSON()))
        Store.set('apps.open', [...new Set(
            [...windows.values()]
                .filter(w => !w.destroyed)
                .map(w => w.appId)
        )])
    }

    // ---- KEYBOARD SHORTCUTS ----
    function onKeyDown(e) {
        const ctrl = e.ctrlKey || e.metaKey

        // Ctrl/Cmd + Q → close active window
        if (ctrl && e.key === 'q') {
            e.preventDefault()
            const activeId = Store.get('windows.active')
            if (activeId) close(activeId)
        }

        // Ctrl/Cmd + T → new terminal
        if (ctrl && e.key === 't') {
            // Only if not typing in an input
            if (isTyping(e)) return
            e.preventDefault()
            Registry.launch('terminal')
        }

        // Ctrl/Cmd + M → minimize active
        if (ctrl && e.key === 'm') {
            e.preventDefault()
            const activeId = Store.get('windows.active')
            if (activeId) minimize(activeId)
        }

        // Ctrl/Cmd + Shift + T → tile all
        if (ctrl && e.shiftKey && e.key === 'T') {
            e.preventDefault()
            tileAll()
        }
    }

    function isTyping(e) {
        const tag = e.target.tagName
        return tag === 'INPUT' || tag === 'TEXTAREA' || e.target.contentEditable === 'true'
    }

    // ---- CLEANUP ----
    function destroy() {
        DragController.destroy()
        ResizeController.destroy()
        document.removeEventListener('keydown', onKeyDown)
        windows.clear()
        console.log('[WindowManager] Destroyed')
    }

    return {
        init,
        open,
        close,
        minimize,
        toggleMaximize,
        focus,
        tileAll,
        closeAll,
        getWindow,
        findByAppId,
        getAllWindows,
        getVisibleWindows,
        destroy,
    }

})()

export default WindowManager