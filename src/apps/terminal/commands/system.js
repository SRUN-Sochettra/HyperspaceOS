import Store from '../../../core/Store.js'
import FileSystem from '../../../core/FileSystem.js'

export const systemCommands = {

    help: {
        description: 'Show available commands',
        execute({ terminal }) {
            import('./index.js').then(({ COMMANDS }) => {
                terminal.writeLine('info', '┌──────────────────────────────────────────┐')
                terminal.writeLine('info', '│           Available Commands             │')
                terminal.writeLine('info', '└──────────────────────────────────────────┘')
                terminal.writeLine('output', '')
                const names = Object.keys(COMMANDS)
                const maxLen = Math.max(...names.map(n => n.length))
                for (const [name, cmd] of Object.entries(COMMANDS)) {
                    terminal.writeLine('output', `  ${name.padEnd(maxLen + 2)} — ${cmd.description || ''}`)
                }
                terminal.writeLine('output', '')
                terminal.writeLine('info', '  Tab: autocomplete  |  ↑↓: history  |  Ctrl+L: clear')
            })
        }
    },

    clear: {
        description: 'Clear the terminal',
        execute({ terminal }) { terminal.clear() }
    },

    echo: {
        description: 'Echo text (use > to write to file)',
        execute({ args, raw, terminal }) {
            // Support echo "text" > filename
            const redirectIndex = args.indexOf('>')
            if (redirectIndex !== -1) {
                const text = args.slice(0, redirectIndex).join(' ')
                const file = args[redirectIndex + 1]
                if (!file) {
                    terminal.writeLine('error', 'echo: missing filename after >')
                    return
                }
                const path = terminal.resolvePath(file)
                const result = FileSystem.writeFile(path, text + '\n')
                if (result.error) terminal.writeLine('error', result.error)
                else terminal.writeLine('success', `Wrote to ${path}`)
                return
            }

            // Support echo "text" >> filename (append)
            const appendIndex = args.indexOf('>>')
            if (appendIndex !== -1) {
                const text = args.slice(0, appendIndex).join(' ')
                const file = args[appendIndex + 1]
                if (!file) {
                    terminal.writeLine('error', 'echo: missing filename after >>')
                    return
                }
                const path = terminal.resolvePath(file)
                const existing = FileSystem.readFile(path) || ''
                const result = FileSystem.writeFile(path, existing + text + '\n')
                if (result.error) terminal.writeLine('error', result.error)
                else terminal.writeLine('success', `Appended to ${path}`)
                return
            }

            terminal.writeLine('output', args.join(' '))
        }
    },

    pwd: {
        description: 'Print working directory',
        execute({ terminal }) {
            terminal.writeLine('output', terminal.cwd)
        }
    },

    cd: {
        description: 'Change directory',
        execute({ args, terminal }) {
            const target = args[0] || '/home/root'

            let newPath
            if (target === '~') newPath = '/home/root'
            else if (target === '-') newPath = terminal.prevCwd || terminal.cwd
            else if (target === '..') newPath = FileSystem.parentPath(terminal.cwd)
            else if (target.startsWith('/')) newPath = target
            else newPath = FileSystem.join(terminal.cwd, target)

            newPath = FileSystem.normalize(newPath)

            if (!FileSystem.isDir(newPath)) {
                terminal.writeLine('error', `cd: not a directory: ${newPath}`)
                return
            }

            terminal.prevCwd = terminal.cwd
            terminal.cwd = newPath
            terminal.updatePrompt()
        }
    },

    ls: {
        description: 'List directory contents',
        execute({ args, terminal }) {
            const flags = args.filter(a => a.startsWith('-')).join('')
            const target = args.find(a => !a.startsWith('-'))
            const path = target ? terminal.resolvePath(target) : terminal.cwd
            const long = flags.includes('l')
            const all = flags.includes('a')

            const entries = FileSystem.readdir(path)
            if (!entries) {
                terminal.writeLine('error', `ls: cannot access '${path}': No such directory`)
                return
            }

            const filtered = all ? entries : entries.filter(e => !e.name.startsWith('.'))

            if (filtered.length === 0) {
                terminal.writeLine('output', '  (empty)')
                return
            }

            if (long) {
                terminal.writeLine('output', `total ${filtered.length}`)
                for (const entry of filtered) {
                    const perms = entry.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'
                    const size = String(entry.size || 0).padStart(6)
                    const date = new Date(entry.modified || entry.created).toLocaleDateString('en', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                    terminal.writeLine(entry.type === 'dir' ? 'info' : 'output',
                        `${perms}  root  ${size}  ${date}  ${entry.name}`)
                }
            } else {
                const maxLen = Math.max(...filtered.map(e => e.name.length)) + 2
                const cols = Math.max(1, Math.floor(60 / maxLen))
                for (let i = 0; i < filtered.length; i += cols) {
                    const row = filtered.slice(i, i + cols)
                    terminal.writeLine('output', row.map(e => e.name.padEnd(maxLen)).join(''))
                }
            }
        }
    },

    cat: {
        description: 'Display file contents',
        execute({ args, terminal }) {
            if (!args[0]) { terminal.writeLine('error', 'cat: missing operand'); return }
            const path = terminal.resolvePath(args[0])
            const content = FileSystem.readFile(path)
            if (content === null) {
                terminal.writeLine('error', `cat: ${args[0]}: No such file`)
                return
            }
            content.split('\n').forEach(line => terminal.writeLine('output', line))
        }
    },

    touch: {
        description: 'Create an empty file',
        execute({ args, terminal }) {
            if (!args[0]) { terminal.writeLine('error', 'touch: missing operand'); return }
            const path = terminal.resolvePath(args[0])
            if (FileSystem.exists(path)) {
                // Just update modified time
                terminal.writeLine('output', `Updated: ${path}`)
                return
            }
            const result = FileSystem.writeFile(path, '')
            if (result.error) terminal.writeLine('error', result.error)
            else terminal.writeLine('success', `Created: ${path}`)
        }
    },

    mkdir: {
        description: 'Create a directory',
        execute({ args, terminal }) {
            if (!args[0]) { terminal.writeLine('error', 'mkdir: missing operand'); return }
            const path = terminal.resolvePath(args[0])
            const result = FileSystem.mkdir(path)
            if (result.error) terminal.writeLine('error', `mkdir: ${result.error}`)
            else terminal.writeLine('success', `Created directory: ${path}`)
        }
    },

    rm: {
        description: 'Remove files or directories',
        execute({ args, terminal }) {
            const flags = args.filter(a => a.startsWith('-')).join('')
            const targets = args.filter(a => !a.startsWith('-'))
            const recursive = flags.includes('r') || flags.includes('R')

            if (targets.length === 0) { terminal.writeLine('error', 'rm: missing operand'); return }

            for (const target of targets) {
                const path = terminal.resolvePath(target)
                const result = FileSystem.rm(path, recursive)
                if (result.error) terminal.writeLine('error', `rm: ${result.error}`)
                else terminal.writeLine('success', `Removed: ${path}`)
            }
        }
    },

    mv: {
        description: 'Move or rename a file/directory',
        execute({ args, terminal }) {
            if (args.length < 2) { terminal.writeLine('error', 'mv: need source and destination'); return }
            const from = terminal.resolvePath(args[0])
            const to = terminal.resolvePath(args[1])
            const result = FileSystem.mv(from, to)
            if (result.error) terminal.writeLine('error', `mv: ${result.error}`)
            else terminal.writeLine('success', `Moved ${from} → ${to}`)
        }
    },

    cp: {
        description: 'Copy a file or directory',
        execute({ args, terminal }) {
            if (args.length < 2) { terminal.writeLine('error', 'cp: need source and destination'); return }
            const from = terminal.resolvePath(args[0])
            const to = terminal.resolvePath(args[1])
            const result = FileSystem.cp(from, to)
            if (result.error) terminal.writeLine('error', `cp: ${result.error}`)
            else terminal.writeLine('success', `Copied ${from} → ${to}`)
        }
    },

    find: {
        description: 'Search for files by name',
        execute({ args, terminal }) {
            const pattern = args[0] || '.'
            const results = FileSystem.find(terminal.cwd, pattern)
            if (results.length === 0) {
                terminal.writeLine('output', 'No matches found')
                return
            }
            for (const r of results) {
                terminal.writeLine(r.type === 'dir' ? 'info' : 'output', r.path)
            }
            terminal.writeLine('output', `\n${results.length} result(s)`)
        }
    },

    du: {
        description: 'Show disk usage',
        execute({ args, terminal }) {
            const path = args[0] ? terminal.resolvePath(args[0]) : terminal.cwd
            const usage = FileSystem.du(path)
            terminal.writeLine('output', `Path: ${path}`)
            terminal.writeLine('output', `Files: ${usage.fileCount}`)
            terminal.writeLine('output', `Directories: ${usage.dirCount}`)
            terminal.writeLine('output', `Total size: ${formatBytes(usage.totalSize)}`)
        }
    },

    head: {
        description: 'Display first N lines of a file',
        execute({ args, terminal }) {
            const nFlag = args.indexOf('-n')
            let lines = 10
            let file = args[0]
            if (nFlag !== -1) {
                lines = parseInt(args[nFlag + 1]) || 10
                file = args.find((a, i) => i !== nFlag && i !== nFlag + 1 && !a.startsWith('-'))
            }
            if (!file) { terminal.writeLine('error', 'head: missing file'); return }
            const content = FileSystem.readFile(terminal.resolvePath(file))
            if (content === null) { terminal.writeLine('error', `head: ${file}: not found`); return }
            content.split('\n').slice(0, lines).forEach(l => terminal.writeLine('output', l))
        }
    },

    tail: {
        description: 'Display last N lines of a file',
        execute({ args, terminal }) {
            const nFlag = args.indexOf('-n')
            let lines = 10
            let file = args[0]
            if (nFlag !== -1) {
                lines = parseInt(args[nFlag + 1]) || 10
                file = args.find((a, i) => i !== nFlag && i !== nFlag + 1 && !a.startsWith('-'))
            }
            if (!file) { terminal.writeLine('error', 'tail: missing file'); return }
            const content = FileSystem.readFile(terminal.resolvePath(file))
            if (content === null) { terminal.writeLine('error', `tail: ${file}: not found`); return }
            const allLines = content.split('\n')
            allLines.slice(Math.max(0, allLines.length - lines)).forEach(l => terminal.writeLine('output', l))
        }
    },

    wc: {
        description: 'Count lines, words, characters',
        execute({ args, terminal }) {
            if (!args[0]) { terminal.writeLine('error', 'wc: missing file'); return }
            const content = FileSystem.readFile(terminal.resolvePath(args[0]))
            if (content === null) { terminal.writeLine('error', `wc: ${args[0]}: not found`); return }
            const lines = content.split('\n').length
            const words = content.split(/\s+/).filter(Boolean).length
            const chars = content.length
            terminal.writeLine('output', `  ${lines} lines  ${words} words  ${chars} chars  ${args[0]}`)
        }
    },

    grep: {
        description: 'Search inside file contents',
        execute({ args, terminal }) {
            if (args.length < 2) { terminal.writeLine('error', 'grep: usage: grep pattern file'); return }
            const pattern = args[0]
            const file = terminal.resolvePath(args[1])
            const content = FileSystem.readFile(file)
            if (content === null) { terminal.writeLine('error', `grep: ${args[1]}: not found`); return }
            const regex = new RegExp(pattern, 'gi')
            const matches = content.split('\n').filter(line => regex.test(line))
            if (matches.length === 0) {
                terminal.writeLine('output', 'No matches')
                return
            }
            matches.forEach(line => {
                // Highlight match
                const highlighted = line.replace(regex, match => `【${match}】`)
                terminal.writeLine('success', highlighted)
            })
            terminal.writeLine('output', `\n${matches.length} matching line(s)`)
        }
    },

    date: {
        description: 'Show current date and time',
        execute({ terminal }) { terminal.writeLine('output', new Date().toString()) }
    },

    uptime: {
        description: 'Show system uptime',
        execute({ terminal }) {
            const s = Math.floor(performance.now() / 1000)
            terminal.writeLine('output', `up ${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`)
        }
    },

    uname: {
        description: 'System information',
        execute({ args, terminal }) {
            const v = Store.get('os.version')
            if (args.includes('-a')) {
                terminal.writeLine('output', `HyperSpace OS v${v} — Build ${Store.get('os.buildDate')}`)
                terminal.writeLine('output', `Platform: ${navigator.platform} | Cores: ${navigator.hardwareConcurrency || '?'}`)
            } else {
                terminal.writeLine('output', `HyperSpace OS v${v}`)
            }
        }
    },

    whoami: { description: 'Show current user', execute({ terminal }) { terminal.writeLine('output', 'root@hyperspace') } },
    hostname: { description: 'Show hostname', execute({ terminal }) { terminal.writeLine('output', FileSystem.readFile('/etc/hostname') || 'hyperspace') } },

    neofetch: {
        description: 'Show system summary',
        execute({ terminal }) {
            const fps = Store.get('system.fps') || 60
            const wins = Store.get('windows.all')?.length || 0
            const ver = Store.get('os.version')
            const du = FileSystem.du('/')

            terminal.writeLine('info', '       ⬡⬡⬡         root@hyperspace')
            terminal.writeLine('info', '     ⬡⬡⬡⬡⬡        ─────────────────────')
            terminal.writeLine('output', '    ⬡⬡   ⬡⬡       OS: HyperSpace v' + ver)
            terminal.writeLine('output', '   ⬡⬡⬡⬡⬡⬡⬡⬡      Kernel: Canvas + WebGL')
            terminal.writeLine('output', '    ⬡⬡   ⬡⬡       Shell: hyper-bash 5.1')
            terminal.writeLine('output', '     ⬡⬡⬡⬡⬡        WM: HyperWM (Glass)')
            terminal.writeLine('output', '       ⬡⬡⬡         Res: ' + window.innerWidth + 'x' + window.innerHeight)
            terminal.writeLine('output', `                   FPS: ${fps}`)
            terminal.writeLine('output', `                   Windows: ${wins}`)
            terminal.writeLine('output', `                   Files: ${du.fileCount} (${formatBytes(du.totalSize)})`)
            terminal.writeLine('output', `                   Dirs: ${du.dirCount}`)
        }
    },

    env: {
        description: 'Show environment variables',
        execute({ terminal }) {
            const vars = { USER: 'root', HOME: '/home/root', SHELL: '/bin/hyper-bash', TERM: 'hyperspace-256color', LANG: navigator.language, CWD: terminal.cwd, VERSION: Store.get('os.version'), EDITOR: 'vim', PATH: '/usr/local/bin:/usr/bin:/bin' }
            for (const [k, v] of Object.entries(vars)) terminal.writeLine('output', `${k}=${v}`)
        }
    },

    ps: {
        description: 'Show running processes',
        execute({ terminal }) {
            const windows = Store.get('windows.all') || []
            terminal.writeLine('info', '  PID   APP              STATUS      SIZE')
            terminal.writeLine('info', '─────────────────────────────────────────────')
            if (windows.length === 0) { terminal.writeLine('output', '  (no windows)'); return }
            for (const w of windows) {
                terminal.writeLine('output', `  ${String(w.id).padStart(4)}   ${w.appId.padEnd(16)} ${(w.minimized ? 'minimized' : w.maximized ? 'maximized' : 'running').padEnd(11)} ${w.width}x${w.height}`)
            }
        }
    },

    kill: {
        description: 'Close a window by PID',
        execute({ args, terminal }) {
            const pid = parseInt(args[0])
            if (isNaN(pid)) { terminal.writeLine('error', 'kill: usage: kill [pid]'); return }
            import('../../../core/EventBus.js').then(({ default: EB }) => {
                const wins = Store.get('windows.all') || []
                const w = wins.find(w => w.id === pid)
                if (w) { EB.emit('window:close', { id: pid }); terminal.writeLine('success', `Killed ${pid} (${w.appId})`) }
                else terminal.writeLine('error', `kill: (${pid}) — No such process`)
            })
        }
    },

    calc: {
        description: 'Evaluate math expression',
        execute({ raw, terminal }) {
            const expr = raw.slice(raw.indexOf(' ') + 1).trim()
            if (!expr || expr === 'calc') { terminal.writeLine('error', 'calc: usage: calc [expr]'); return }
            try { terminal.writeLine('success', `= ${Function('"use strict"; return (' + expr + ')')()}`) }
            catch { terminal.writeLine('error', 'Invalid expression') }
        }
    },

    history: {
        description: 'Show command history',
        execute({ terminal }) {
            if (terminal.history.length === 0) { terminal.writeLine('output', '(empty)'); return }
            terminal.history.forEach((cmd, i) => terminal.writeLine('output', `  ${String(i + 1).padStart(4)}  ${cmd}`))
        }
    },

    free: {
        description: 'Show memory usage',
        execute({ terminal }) {
            const mem = navigator.deviceMemory || 8
            const used = (mem * 0.4 + Math.random() * 0.5).toFixed(1)
            terminal.writeLine('info', '               total     used     free')
            terminal.writeLine('output', `Mem:         ${mem}GB    ${used}GB   ${(mem - parseFloat(used)).toFixed(1)}GB`)
        }
    },

    export: {
        description: 'Export file system as JSON',
        execute({ terminal }) {
            FileSystem.debug()
            terminal.writeLine('success', 'File system tree logged to console')
        }
    },

    fsreset: {
        description: 'Reset file system to defaults',
        execute({ terminal }) {
            FileSystem.reset()
            terminal.cwd = '/home/root'
            terminal.updatePrompt()
            terminal.writeLine('success', 'File system reset to defaults')
        }
    },
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}