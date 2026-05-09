import Registry from '../../../core/Registry.js'
import EventBus from '../../../core/EventBus.js'
import FileSystem from '../../../core/FileSystem.js'

export const appCommands = {

    open: {
        description: 'Open an application',
        execute({ args, terminal }) {
            const name = args[0]
            if (!name) {
                terminal.writeLine('error', 'open: usage: open [app-name]')
                terminal.writeLine('output', 'Available: ' + Registry.all().map(a => a.id).join(', '))
                return
            }
            if (Registry.has(name)) {
                Registry.launch(name)
                terminal.writeLine('success', `Launched ${name}`)
            } else {
                terminal.writeLine('error', `open: unknown app "${name}"`)
                terminal.writeLine('output', 'Available: ' + Registry.all().map(a => a.id).join(', '))
            }
        }
    },

    edit: {
        description: 'Open a file in the code editor',
        execute({ args, terminal }) {
            if (!args[0]) {
                terminal.writeLine('error', 'edit: usage: edit [filename]')
                return
            }

            const path = terminal.resolvePath(args[0])

            // Create file if it doesn't exist
            if (!FileSystem.exists(path)) {
                FileSystem.writeFile(path, '')
                terminal.writeLine('info', `Created: ${path}`)
            }

            if (!FileSystem.isFile(path)) {
                terminal.writeLine('error', `edit: not a file: ${path}`)
                return
            }

            const content = FileSystem.readFile(path)

            // Queue for editor (works even if editor isn't open yet)
            EventBus.emit('editor:queueFile', { path, content })

            // Also direct event for already-mounted editor
            EventBus.emit('editor:openFile', { path, content })

            // Launch editor
            Registry.launch('editor')

            terminal.writeLine('success', `Opening ${path} in editor`)
        }
    },

    apps: {
        description: 'List all registered apps',
        execute({ terminal }) {
            const list = Registry.all()
            terminal.writeLine('info', '  ICON  ID               CATEGORY')
            terminal.writeLine('info', '──────────────────────────────────────')
            for (const app of list) {
                terminal.writeLine('output', `  ${app.icon}    ${app.id.padEnd(16)} ${app.category}`)
            }
        }
    },

    tile: {
        description: 'Tile all open windows',
        execute({ terminal }) {
            EventBus.emit('window:tile')
            terminal.writeLine('success', 'Windows tiled')
        }
    },

    closeall: {
        description: 'Close all windows except this terminal',
        execute({ terminal }) {
            Promise.all([
                import('../../../core/Store.js'),
                import('../../../core/EventBus.js'),
            ]).then(([{ default: Store }, { default: EventBus }]) => {
                const windows = Store.get('windows.all') || []
                let closed = 0
                for (const win of windows) {
                    if (win.id !== terminal.windowId) {
                        EventBus.emit('window:close', { id: win.id })
                        closed++
                    }
                }
                terminal.writeLine('success', `Closed ${closed} window(s)`)
            })
        }
    },

    theme: {
        description: 'Change accent color',
        execute({ args, terminal }) {
            const themes = {
                cyan: '#00f5ff', magenta: '#ff00e5', green: '#28c840',
                orange: '#ff8c00', purple: '#b400ff', blue: '#0066ff',
                red: '#ff5f57', gold: '#ffd700',
            }
            const name = args[0]?.toLowerCase()
            if (!name || !themes[name]) {
                terminal.writeLine('error', `theme: options: ${Object.keys(themes).join(', ')}`)
                return
            }
            document.documentElement.style.setProperty('--neon-cyan', themes[name])
            import('../../../core/Store.js').then(({ default: Store }) => {
                Store.set('settings.accentColor', themes[name])
            })
            terminal.writeLine('success', `Theme → ${name}`)
            EventBus.emit('notification:show', { icon: '🎨', title: 'Theme', body: `Accent → ${name}` })
        }
    },
}