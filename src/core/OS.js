import EventBus from './EventBus.js'
import Store from './Store.js'
import Registry from './Registry.js'

async function registerApps() {
    const modules = await Promise.all([
        import('../apps/terminal/index.js'),
        import('../apps/sysmon/index.js'),
        import('../apps/music/index.js'),
        import('../apps/notes/index.js'),
        import('../apps/weather/index.js'),
        import('../apps/files/index.js'),
        import('../apps/calculator/index.js'),
        import('../apps/browser/index.js'),
        import('../apps/settings/index.js'),
        import('../apps/editor/index.js'),
        import('../apps/taskman/index.js'),
        import('../apps/whiteboard/index.js'),
        import('../apps/ai/index.js'),
    ])
    modules.forEach(mod => mod.default())
}

async function boot() {
    console.log('%c[HyperSpace OS] Booting...', 'color: #00f5ff; font-weight: bold')
    EventBus.emit('os:boot:start')

    try {
        // Boot screen
        const { default: BootScreen } = await import('../ui/BootScreen.js')
        BootScreen.init()
        Store.set('os.bootProgress', 5)
        await delay(100)

        // File system
        const { default: FileSystem } = await import('./FileSystem.js')
        FileSystem.init()
        FileSystem.appendLog('OS booting')
        Store.set('os.bootProgress', 12)
        await delay(80)

        // Register all apps
        await registerApps()
        Store.set('os.bootProgress', 25)
        await delay(80)

        // Window Manager
        const { default: WindowManager } = await import('../wm/WindowManager.js')
        WindowManager.init()
        Store.set('os.bootProgress', 35)
        await delay(80)

        // UI Shell
        const { default: StatusBar } = await import('../ui/StatusBar.js')
        const { default: Dock } = await import('../ui/Dock.js')
        const { default: Notification } = await import('../ui/Notification.js')
        const { default: ContextMenu } = await import('../ui/ContextMenu.js')

        StatusBar.init()
        Dock.init()
        Notification.init()
        ContextMenu.init()
        Store.set('os.bootProgress', 50)
        await delay(80)

        // Enhanced features
        const { default: Spotlight } = await import('../ui/Spotlight.js')
        const { default: ClipboardManager } = await import('../ui/ClipboardManager.js')
        const { default: DragDropController } = await import('../wm/DragDropController.js')
        const { default: Workspaces } = await import('../wm/Workspaces.js')

        Spotlight.init()
        ClipboardManager.init()
        DragDropController.init()
        Workspaces.init()
        Store.set('os.bootProgress', 62)
        await delay(80)

        // Theme + Sound
        const { default: ThemeEngine } = await import('./ThemeEngine.js')
        const { default: Sounds } = await import('./Sounds.js')

        ThemeEngine.init()
        Sounds.init()
        Store.set('os.bootProgress', 72)
        await delay(80)

        // Canvas layer
        const { default: Background } = await import('../canvas/Background.js')
        const { default: Particles } = await import('../canvas/Particles.js')
        const { default: Grid } = await import('../canvas/Grid.js')

        Background.init()
        Particles.init()
        Grid.init()
        Store.set('os.bootProgress', 85)
        await delay(80)

        // Desktop icons
        const { default: Desktop } = await import('../ui/Desktop.js')
        Desktop.init()

        // Persistence
        const { default: Persistence } = await import('./Persistence.js')
        Persistence.init()
        Store.set('os.bootProgress', 92)
        await delay(80)

        // Onboarding
        const { default: Onboarding } = await import('../ui/Onboarding.js')
        Onboarding.init()

        // Complete
        Store.set('os.bootProgress', 100)
        await delay(400)

        Store.set('os.booted', true)
        EventBus.emit('os:boot:complete')
        BootScreen.dismiss()

        FileSystem.appendLog('Boot complete')

        setTimeout(() => {
            EventBus.emit('notification:show', {
                icon: '🚀',
                title: 'HyperSpace OS',
                body: 'System ready. Welcome back.',
            })
        }, 1000)

        // Restore session or open terminal
        setTimeout(async () => {
            const restored = await Persistence.apply()
            if (!restored) {
                Registry.launch('terminal')
            } else {
                EventBus.emit('notification:show', {
                    icon: '💾',
                    title: 'Session Restored',
                    body: 'Your previous workspace is back.',
                })
            }
        }, 1500)

        console.log('%c[HyperSpace OS] Boot complete ✓', 'color: #28c840; font-weight: bold')

    } catch (err) {
        console.error('[OS] Boot failed:', err)
        const bs = document.getElementById('boot-screen')
        if (bs) {
            const el = document.createElement('div')
            el.style.cssText = 'color:#ff5f57;font-size:12px;margin-top:20px;text-align:center;max-width:400px;'
            el.textContent = `Boot failed: ${err.message}`
            bs.appendChild(el)
        }
    }
}

async function shutdown() {
    EventBus.emit('os:shutdown')
    try {
        const { default: Persistence } = await import('./Persistence.js')
        const { default: WindowManager } = await import('../wm/WindowManager.js')
        const { default: Background } = await import('../canvas/Background.js')
        const { default: Particles } = await import('../canvas/Particles.js')
        const { default: Sounds } = await import('./Sounds.js')

        Persistence.saveNow()
        await WindowManager.closeAll()
        Background.destroy()
        Particles.destroy()
        Sounds.destroy()
        WindowManager.destroy()
    } catch (err) {
        console.error('[OS] Shutdown error:', err)
    }
    EventBus.clear()
}

async function restart() {
    await shutdown()
    await delay(800)
    location.reload()
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms))
}

if (typeof window !== 'undefined') {
    window.HyperOS = {
        boot, shutdown, restart,
        EventBus, Store, Registry,
        async clearAll() {
            localStorage.clear()
            console.log('All data cleared. Reloading...')
            location.reload()
        },
        debug() {
            console.group('%c[HyperSpace OS]', 'color:#00f5ff;font-weight:bold')
            console.log('Booted:', Store.get('os.booted'))
            console.log('FPS:', Store.get('system.fps'))
            console.log('Windows:', Store.get('windows.all')?.length || 0)
            console.log('Open Apps:', Store.get('apps.open'))
            Registry.debug()
            import('./FileSystem.js').then(m => m.default.debug())
            console.groupEnd()
        },
        resetOnboarding() {
            import('../ui/Onboarding.js').then(m => m.default.reset())
        }
    }
}

export { boot, shutdown, restart, EventBus, Store, Registry }