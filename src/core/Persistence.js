// ============================================================
//  Persistence.js — Save/restore OS state to LocalStorage
//  Saves: window positions, open apps, settings, notes content
//  Restores on boot if saved state exists
// ============================================================

import Store from './Store.js'
import EventBus from './EventBus.js'
import Registry from './Registry.js'

const STORAGE_KEY = 'hyperspace-os-state'
const SAVE_DEBOUNCE = 2000 // Save at most every 2s

const Persistence = (() => {

    let saveTimer = null

    function init() {
        // Auto-save on relevant store changes
        const watchPaths = [
            'settings',
            'windows.all',
            'apps.open',
        ]

        for (const path of watchPaths) {
            Store.subscribe(path, () => debouncedSave())
        }

        // Save on page unload
        window.addEventListener('beforeunload', () => saveNow())

        // Save on shutdown
        EventBus.on('os:shutdown', () => saveNow())

        console.log('[Persistence] Initialized')
    }

    // ---- SAVE ----
    function saveNow() {
        try {
            const state = {
                version: Store.get('os.version'),
                savedAt: Date.now(),
                settings: Store.get('settings'),
                openApps: Store.get('apps.open') || [],
                windows: (Store.get('windows.all') || []).map(win => ({
                    appId: win.appId,
                    x: win.x,
                    y: win.y,
                    width: win.width,
                    height: win.height,
                    maximized: win.maximized,
                })),
                // Save app-specific data
                notes: getNoteData(),
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

            if (import.meta.env?.DEV) {
                console.log('[Persistence] State saved')
            }
        } catch (err) {
            console.warn('[Persistence] Failed to save:', err.message)
        }
    }

    function debouncedSave() {
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(saveNow, SAVE_DEBOUNCE)
    }

    // ---- RESTORE ----
    function restore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return null

            const state = JSON.parse(raw)

            // Validate version
            if (!state.version) return null

            // Check age — don't restore state older than 7 days
            const age = Date.now() - (state.savedAt || 0)
            if (age > 7 * 24 * 60 * 60 * 1000) {
                console.log('[Persistence] Saved state too old, ignoring')
                return null
            }

            return state
        } catch (err) {
            console.warn('[Persistence] Failed to restore:', err.message)
            return null
        }
    }

    // ---- APPLY RESTORED STATE ----
    async function apply() {
        const state = restore()
        if (!state) return false

        console.log('[Persistence] Restoring saved state...')

        // Restore settings
        if (state.settings) {
            Store.set('settings', state.settings)

            // Apply theme via ThemeEngine if available
            if (state.settings.theme) {
                try {
                    const { default: ThemeEngine } = await import('./ThemeEngine.js')
                    ThemeEngine.apply(state.settings.theme)
                } catch {
                    // ThemeEngine not loaded yet, apply accent manually
                    if (state.settings.accentColor) {
                        document.documentElement.style.setProperty('--neon-cyan', state.settings.accentColor)
                    }
                }
            } else if (state.settings.accentColor) {
                document.documentElement.style.setProperty('--neon-cyan', state.settings.accentColor)
            }

            // Particles
            if (state.settings.particlesEnabled === false) {
                Store.set('settings.particlesEnabled', false)
            }

            // Sound
            if (state.settings.soundEnabled === false) {
                Store.set('settings.soundEnabled', false)
            }
        }

        // Restore windows
        if (state.windows && state.windows.length > 0) {
            for (const win of state.windows) {
                if (Registry.has(win.appId)) {
                    EventBus.emit('app:launch', {
                        id: win.appId,
                        options: {
                            x: win.x,
                            y: win.y,
                            width: win.width,
                            height: win.height,
                        },
                    })
                    await new Promise(r => setTimeout(r, 200))
                }
            }
            return true
        }

        return false
    }

    // ---- CLEAR ----
    function clear() {
        localStorage.removeItem(STORAGE_KEY)
        console.log('[Persistence] State cleared')
    }

    // ---- HELPERS ----
    function getNoteData() {
        // Notes are stored inside the app instance
        // We'll emit an event to request note data
        // and any open Notes app can respond
        return null // Notes save themselves via their own logic
    }

    // ---- DEBUG ----
    function debug() {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
            console.log('[Persistence] No saved state')
            return
        }
        const state = JSON.parse(raw)
        console.group('[Persistence] Saved State')
        console.log('Saved at:', new Date(state.savedAt).toLocaleString())
        console.log('Settings:', state.settings)
        console.log('Open apps:', state.openApps)
        console.log('Windows:', state.windows)
        console.groupEnd()
    }

    return { init, saveNow, restore, apply, clear, debug }

})()

export default Persistence