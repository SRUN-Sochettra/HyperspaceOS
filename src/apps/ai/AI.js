import BaseApp from '../BaseApp.js'
import Store from '../../core/Store.js'
import Registry from '../../core/Registry.js'
import EventBus from '../../core/EventBus.js'
import FileSystem from '../../core/FileSystem.js'

export default class AI extends BaseApp {
    async setup() {
        this.container.innerHTML = `
      <div class="ai-container">
        <div class="ai-chat" id="ai-chat-${this.windowId}"></div>
        <div class="ai-input-row">
          <input type="text" class="ai-input" id="ai-input-${this.windowId}"
            placeholder="Ask me anything or give a command..."
            spellcheck="false" autocomplete="off" />
          <button class="ai-send" id="ai-send-${this.windowId}">→</button>
        </div>
      </div>
    `

        this.chatEl = this.$(`#ai-chat-${this.windowId}`)
        this.inputEl = this.$(`#ai-input-${this.windowId}`)

        this.append('bot', "Hello! I'm the HyperSpace Command Assistant. I can actually control this OS. Try asking me to:")
        this.append('bot', "• Open an app\n• Create a file\n• Change the theme\n• Tile windows\n• Show system info\n• Search for files\n• Tell you a joke")

        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.ask()
        })

        this.$(`#ai-send-${this.windowId}`).addEventListener('click', () => this.ask())
    }

    onFocus() {
        if (this.inputEl) this.inputEl.focus()
    }

    ask() {
        const text = this.inputEl.value.trim()
        if (!text) return

        this.append('user', text)
        this.inputEl.value = ''

        // Show typing indicator
        const typingId = this.showTyping()

        setTimeout(() => {
            this.removeTyping(typingId)
            const reply = this.process(text)
            this.append('bot', reply)
        }, 400 + Math.random() * 600)
    }

    process(input) {
        const q = input.toLowerCase()

        // ---- CREATE FILE (Check before open apps) ----
        if (q.includes('create') && (q.includes('file') || q.includes('document'))) {
            const nameMatch = input.match(/(?:called|named)\s+["']?([^"'\s]+)["']?/) || input.match(/(?:file|document)\s+["']?([^"'\s]+)["']?/)
            const name = nameMatch?.[1] || `note-${Date.now()}.txt`
            const path = FileSystem.join('/home/root/Desktop', name)
            FileSystem.writeFile(path, `Created by Command Assistant at ${new Date().toLocaleString()}\n`)
            return `Created **${name}** on your Desktop!`
        }

        // ---- CREATE FOLDER ----
        if (q.includes('create') && (q.includes('folder') || q.includes('directory'))) {
            const nameMatch = input.match(/(?:called|named)\s+["']?([^"'\s]+)["']?/) || input.match(/(?:folder|directory)\s+["']?([^"'\s]+)["']?/)
            const name = nameMatch?.[1] || `folder-${Date.now()}`
            const path = FileSystem.join('/home/root/Desktop', name)
            FileSystem.mkdir(path)
            return `Created folder **${name}** on your Desktop!`
        }

        // ---- WRITE TO FILE ----
        if (q.includes('write') && q.includes('to')) {
            const writeMatch = input.match(/write\s+"([^"]+)"\s+to\s+(\S+)/i)
            if (writeMatch) {
                const content = writeMatch[1]
                const name = writeMatch[2]
                const path = FileSystem.join('/home/root/Desktop', name)
                FileSystem.writeFile(path, content + '\n')
                return `Wrote to **${name}** on your Desktop!`
            }
            return 'Use format: write "your text here" to filename.txt'
        }

        // ---- LIST FILES ----
        if (q.includes('list') || q.includes('what files') || q.includes('show files')) {
            const entries = FileSystem.readdir('/home/root') || []
            return `Files in home:\n${entries.map(e => `• ${e.type === 'dir' ? '[DIR]' : '[FILE]'} ${e.name}`).join('\n')}`
        }

        // ---- READ FILE ----
        if (q.includes('read') || q.includes('show me') || q.includes('what does')) {
            const fileMatch = input.match(/(?:read|show|what does)\s+(.+?)(?:\s+say|\s+contain)?$/i)
            if (fileMatch) {
                const name = fileMatch[1].trim()
                const results = FileSystem.find('/', name)
                const file = results.find(r => r.type === 'file')
                if (file) {
                    const content = FileSystem.readFile(file.path)
                    if (content) {
                        const preview = content.slice(0, 300)
                        return `**${file.name}:**\n\`\`\`\n${preview}${content.length > 300 ? '\n...' : ''}\n\`\`\``
                    }
                }
                return `Couldn't find a file matching "${name}".`
            }
        }

        // ---- OPEN APPS ----
        const openMatch = q.match(/open\s+(\w+)/)
        const isLaunch = q.match(/\b(launch|start)\s+(\w+)/)
        if (openMatch || isLaunch) {
            const appName = openMatch?.[1] || isLaunch?.[2] || q.split(/\s+/).pop()
            const apps = Registry.all()
            const match = apps.find(a =>
                a.id.includes(appName) || a.title.toLowerCase().includes(appName)
            )
            if (match) {
                Registry.launch(match.id)
                return `Opened **${match.title}** for you!`
            }
            return `I couldn't find an app called "${appName}". Available apps: ${apps.map(a => a.title).join(', ')}`
        }

        // ---- CHANGE THEME ----
        const themeMatch = q.match(/(?:theme|color)\s+(?:to\s+)?(\w+)/) || q.match(/switch to\s+(\w+)/)
        if (themeMatch || q.includes('theme') || q.includes('dark') || q.includes('light')) {
            const themeName = themeMatch?.[1] || (q.includes('light') ? 'light' : 'cyberpunk')
            const themes = ['cyberpunk', 'synthwave', 'matrix', 'monochrome', 'ember', 'abyss']
            const found = themes.find(t => t.includes(themeName))
            if (found) {
                import('../../core/ThemeEngine.js').then(m => m.default.apply(found))
                return `Switched theme to **${found}**!`
            }
            return `Theme "${themeName}" not found. Available themes: ${themes.join(', ')}`
        }

        // ---- TILE / ARRANGE WINDOWS ----
        if (q.includes('tile') || q.includes('arrange') || q.includes('organize')) {
            EventBus.emit('window:tile')
            return "I've tiled all open windows across your screen!"
        }

        // ---- CLOSE ALL ----
        if (q.includes('close all') || q.includes('minimize all')) {
            if (q.includes('close')) {
                import('../../wm/WindowManager.js').then(m => m.default.closeAll())
                return 'Closed all open windows.'
            }
            import('../../wm/WindowManager.js').then(m => m.default.minimizeAll())
            return 'Minimized all windows to the dock.'
        }

        // ---- SYSTEM STATUS ----
        if (q.includes('status') || q.includes('system') || q.includes('cpu') || q.includes('ram') || q.includes('memory') || q.includes('fps')) {
            const metrics = Store.get('sysmon.metrics')
            const winCount = Store.get('windows.all', []).length
            const uptime = Math.floor((Date.now() - (window.__hs_boot_time || Date.now())) / 1000)
            const mins = Math.floor(uptime / 60)
            const secs = uptime % 60

            let reply = `**System Status:**\n`
            reply += `• Open Windows: **${winCount}**\n`
            reply += `• Uptime: **${mins}m ${secs}s**\n`
            if (metrics) {
                reply += `• Estimated FPS: **${metrics.fps?.toFixed(0) || '--'}**\n`
                reply += `• DOM Nodes: **${metrics.dom || '--'}**\n`
                reply += `• Event Loop Lag: **${metrics.lag?.toFixed(1) || '--'} ms**\n`
            }
            return reply
        }

        // ---- SEARCH FILES ----
        if (q.includes('search') || q.includes('find')) {
            const queryMatch = input.match(/(?:search|find)\s+(?:for\s+)?["']?([^"']+)["']?/)
            const query = queryMatch?.[1] || q.split(/\s+/).pop()
            const results = FileSystem.find('/', query)
            if (results.length > 0) {
                return `Found **${results.length}** results for "${query}":\n` +
                    results.slice(0, 8).map(r => `• ${r.path} (${this.formatBytes(r.size)})`).join('\n')
            }
            return `No files found matching "${query}".`
        }

        // ---- JOKES ----
        if (q.includes('joke') || q.includes('funny') || q.includes('laugh')) {
            const jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs.",
                "I told my compiler a joke. It didn't laugh — it threw an exception.",
                "There are only 10 types of people: those who understand binary... and those who expected this joke to have three options.",
                "A SQL query walks into a bar, approaches two tables, and asks: 'Can I JOIN you?'",
                "My code works perfectly on my machine. We're shipping my machine.",
                "Debugging is like being the detective in a crime movie where you are also the murderer.",
            ]
            return jokes[Math.floor(Math.random() * jokes.length)]
        }

        // ---- HELP ----
        if (q.includes('help') || q.includes('what can you')) {
            return "Here's what I can do:\n• **Open apps:** \"open terminal\"\n• **Create files:** \"create file called notes.txt\"\n• **Change themes:** \"change theme to ember\"\n• **Tile windows:** \"tile all windows\"\n• **System info:** \"show system status\"\n• **Search files:** \"search readme\"\n• **Read files:** \"read README.md\"\n• **Write files:** \"write 'hello' to test.txt\"\n• **Close windows:** \"close all windows\"\n• **Tell jokes:** \"tell me a joke\""
        }

        // ---- WHO ARE YOU ----
        if (q.includes('who are you') || q.includes('what are you')) {
            return "I'm the HyperSpace Command Assistant — a built-in assistant that can control this desktop environment. I can open apps, manage files, change themes, and more. Try me!"
        }

        // ---- GREETING ----
        if (q.match(/^(hi|hello|hey|sup|yo)\b/)) {
            const greetings = [
                "Hey there! How can I help?",
                "Hello! Ready to help you navigate HyperSpace.",
                "Hi! What shall we do today?",
            ]
            return greetings[Math.floor(Math.random() * greetings.length)]
        }

        // ---- THANK YOU ----
        if (q.includes('thank') || q.includes('thanks')) {
            return "You're welcome! Let me know if you need anything else."
        }

        // ---- FALLBACK ----
        const fallbacks = [
            "I'm not sure about that, but I can open apps, manage files, change themes, and more. Try \"help\" to see everything!",
            "Hmm, I don't understand that yet. But ask me to do something — I can actually control this OS!",
            "I didn't catch that. Try asking me to open an app, search for files, or change the theme.",
        ]
        return fallbacks[Math.floor(Math.random() * fallbacks.length)]
    }

    showTyping() {
        const id = `typing-${Date.now()}`
        const el = document.createElement('div')
        el.className = 'ai-msg bot typing'
        el.id = id
        el.innerHTML = '<span class="ai-typing-dots"><span>.</span><span>.</span><span>.</span></span>'
        this.chatEl.appendChild(el)
        this.chatEl.scrollTop = this.chatEl.scrollHeight
        return id
    }

    removeTyping(id) {
        const el = this.chatEl.querySelector(`#${id}`)
        if (el) el.remove()
    }

    append(who, text) {
        const el = document.createElement('div')
        el.className = `ai-msg ${who}`

        // Simple markdown-like rendering
        let html = text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```\n?([\s\S]*?)```/g, '<pre>$1</pre>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '<span style="color:var(--neon-cyan)">•</span> ')

        el.innerHTML = html
        this.chatEl.appendChild(el)
        this.chatEl.scrollTop = this.chatEl.scrollHeight
    }

    formatBytes(bytes) {
        if (!bytes) return '0 B'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    onDestroy() {
        this.chatEl = null
        this.inputEl = null
    }
}
