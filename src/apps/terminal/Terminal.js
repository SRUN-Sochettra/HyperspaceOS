import BaseApp from '../BaseApp.js'
import { COMMANDS } from './commands/index.js'
import FileSystem from '../../core/FileSystem.js'

export default class Terminal extends BaseApp {

    async setup() {
        this.history = []
        this.historyIndex = -1
        this.outputLines = []
        this.cwd = '/home/root'
        this.prevCwd = '/home/root'

        this.container.innerHTML = `
      <div class="terminal-container">
        <div class="terminal-output"></div>
        <div class="terminal-input-row">
          <span class="terminal-prompt" id="term-prompt-${this.windowId}">~$</span>
          <input type="text" class="terminal-input" spellcheck="false" autocomplete="off" placeholder="type a command..." />
        </div>
      </div>
    `

        this.outputEl = this.$('.terminal-output')
        this.inputEl = this.$('.terminal-input')
        this.promptEl = this.$(`#term-prompt-${this.windowId}`)

        this.updatePrompt()

        // Show MOTD from file system
        const motd = FileSystem.readFile('/etc/motd')
        if (motd) {
            motd.split('\n').forEach(line => this.writeLine('info', line))
        } else {
            this.writeLine('info', ' HyperSpace Terminal v2.0')
            this.writeLine('info', 'Type "help" for available commands')
        }
        this.writeLine('output', '')

        this.inputEl.addEventListener('keydown', (e) => this.onKeyDown(e))
        this.container.addEventListener('click', () => this.inputEl.focus())
        this.addTimeout(() => this.inputEl.focus(), 100)

        // Log terminal open to system log
        FileSystem.appendLog('Terminal opened')
    }

    // ---- RESOLVE PATH relative to cwd ----
    resolvePath(input) {
        if (!input) return this.cwd
        if (input === '~') return '/home/root'
        if (input.startsWith('~/')) return FileSystem.join('/home/root', input.slice(2))
        if (input.startsWith('/')) return FileSystem.normalize(input)

        // Handle .. and .
        const parts = this.cwd.split('/').filter(Boolean)
        const inputParts = input.split('/').filter(Boolean)

        for (const part of inputParts) {
            if (part === '..') parts.pop()
            else if (part !== '.') parts.push(part)
        }

        return '/' + parts.join('/')
    }

    updatePrompt() {
        if (!this.promptEl) return
        let display = this.cwd
        if (display.startsWith('/home/root')) {
            display = '~' + display.slice('/home/root'.length)
        }
        if (!display) display = '~'
        this.promptEl.textContent = `${display}$`
    }

    onFocus() { if (this.inputEl) this.inputEl.focus() }

    onKeyDown(e) {
        switch (e.key) {
            case 'Enter': this.executeCommand(); break
            case 'ArrowUp': e.preventDefault(); this.navigateHistory(-1); break
            case 'ArrowDown': e.preventDefault(); this.navigateHistory(1); break
            case 'Tab': e.preventDefault(); this.autocomplete(); break
            case 'l': if (e.ctrlKey) { e.preventDefault(); this.clear() } break
            case 'c': if (e.ctrlKey) { e.preventDefault(); this.writeLine('error', '^C'); this.inputEl.value = '' } break
        }
    }

    executeCommand() {
        const raw = this.inputEl.value.trim()
        if (!raw) return

        this.writeLine('command', `${this.promptEl.textContent} ${raw}`)
        this.history.push(raw)
        this.historyIndex = this.history.length

        const args = this.parseArgs(raw)
        const cmdName = args[0].toLowerCase()
        const cmdArgs = args.slice(1)

        const command = COMMANDS[cmdName]
        if (command) {
            try { command.execute({ args: cmdArgs, raw, terminal: this }) }
            catch (err) { this.writeLine('error', `Error: ${err.message}`) }
        } else {
            // Try to run as a file path
            const path = this.resolvePath(cmdName)
            if (FileSystem.isFile(path)) {
                const content = FileSystem.readFile(path)
                this.writeLine('output', `(contents of ${path}):`)
                content.split('\n').forEach(l => this.writeLine('output', l))
            } else {
                this.writeLine('error', `command not found: ${cmdName}`)
            }
        }

        this.inputEl.value = ''
        this.outputEl.scrollTop = this.outputEl.scrollHeight
    }

    parseArgs(input) {
        const args = []
        let current = ''
        let inQuote = false
        let quoteChar = ''
        for (let i = 0; i < input.length; i++) {
            const ch = input[i]
            if (inQuote) {
                if (ch === quoteChar) inQuote = false
                else current += ch
            } else if (ch === '"' || ch === "'") { inQuote = true; quoteChar = ch }
            else if (ch === ' ') { if (current) { args.push(current); current = '' } }
            else current += ch
        }
        if (current) args.push(current)
        return args
    }

    navigateHistory(dir) {
        if (this.history.length === 0) return
        this.historyIndex += dir
        if (this.historyIndex < 0) { this.historyIndex = 0; return }
        if (this.historyIndex >= this.history.length) { this.historyIndex = this.history.length; this.inputEl.value = ''; return }
        this.inputEl.value = this.history[this.historyIndex]
    }

    autocomplete() {
        const input = this.inputEl.value
        const parts = input.split(' ')

        if (parts.length <= 1) {
            // Command autocomplete
            const matches = Object.keys(COMMANDS).filter(c => c.startsWith(input.toLowerCase()))
            if (matches.length === 1) this.inputEl.value = matches[0] + ' '
            else if (matches.length > 1) this.writeLine('output', matches.join('  '))
            return
        }

        // Path autocomplete
        const partial = parts[parts.length - 1]
        const dir = partial.includes('/') ? this.resolvePath(FileSystem.parentPath(partial)) : this.cwd
        const prefix = partial.includes('/') ? FileSystem.basename(partial) : partial
        const entries = FileSystem.readdir(dir)

        if (!entries) return

        const matches = entries.filter(e => e.name.startsWith(prefix))
        if (matches.length === 1) {
            const match = matches[0]
            parts[parts.length - 1] = (partial.includes('/') ? FileSystem.parentPath(partial) + '/' : '') + match.name + (match.type === 'dir' ? '/' : '')
            this.inputEl.value = parts.join(' ')
        } else if (matches.length > 1) {
            this.writeLine('output', matches.map(m => m.name).join('  '))
        }
    }

    writeLine(type, text) {
        const line = document.createElement('div')
        line.className = `terminal-line ${type}`
        line.textContent = text
        this.outputEl.appendChild(line)
        this.outputLines.push(line)
    }

    writeHTML(html) {
        const line = document.createElement('div')
        line.className = 'terminal-line output'
        line.innerHTML = html
        this.outputEl.appendChild(line)
    }

    clear() { this.outputEl.innerHTML = ''; this.outputLines = [] }
    onDestroy() {
        this.outputLines = []
        this.history = []
        this.outputEl = null
        this.inputEl = null
        this.promptEl = null
    }
}