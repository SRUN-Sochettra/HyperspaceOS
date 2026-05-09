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

        this.append('bot', "Hello! I'm the HyperSpace AI. I can actually control this OS. Try asking me to:")
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

        // ---- OPEN APPS ----
        const openMatch = q.match(/open\s+(\w+)/)
        if (openMatch || q.includes('launch') || q.includes('start')) {
            const appName = openMatch?.[1] || q.split(/\s+/).pop()
            const apps = Registry.all()
            const match = apps.find(a =>
                a.id.includes(appName) ||
                a.title.toLowerCase().includes(appName)
            )
            if (match) {
                Registry.launch(match.id)
                return `Opened **${match.title}** for you! ${match.icon}`
            }
            return `I couldn't find an app called "${appName}". Available apps: ${apps.map(a => a.title).join(', ')}`
        }

        // ---- CREATE FILE ----
        if (q.includes('create') && (q.includes('file') || q.includes('document'))) {
            const nameMatch = input.match(/(?:called|named|file)\s+["']?([^"'\s]+)["']?/)
            const name = nameMatch?.[1] || `note-${Date.now()}.txt`
            const path = FileSystem.join('/home/root/Desktop', name)
            FileSystem.writeFile(path, `Created by AI Assistant at ${new Date().toLocaleString()}\n`)
            return `Created **${name}** on your Desktop! 📄`
        }

        // ---- CREATE FOLDER ----
        if (q.includes('create') && (q.includes('folder') || q.includes('directory'))) {
            const nameMatch = input.match(/(?:called|named|folder|directory)\s+["']?([^"'\s]+)["']?/)
            const name = nameMatch?.[1] || `folder-${Date.now()}`
            const path = FileSystem.join('/home/root/Desktop', name)
            FileSystem.mkdir(path)
            return `Created folder **${name}** on your Desktop! 📁`
        }

        // ---- CHANGE THEME ----
        if (q.includes('theme') || q.includes('color') || q.includes('accent')) {
            const themes = {
                midnight: '#00f5ff', aurora: '#00f5a0', ember: '#ff6b35',
                sakura: '#ff69b4', frost: '#88ccff', void: '#b400ff',
                terminal: '#33ff33',
            }
            const match = Object.keys(themes).find(t => q.includes(t))
            if (match) {
                import('../../core/ThemeEngine.js').then(({ default: TE }) => TE.apply(match))
                return `Theme changed to **${match}**! 🎨`
            }
            if (q.includes('dark') || q.includes('night')) {
                import('../../core/ThemeEngine.js').then(({ default: TE }) => TE.apply('midnight'))
                return "Set to Midnight theme! 🌙"
            }
            if (q.includes('green') || q.includes('matrix')) {
                import('../../core/ThemeEngine.js').then(({ default: TE }) => TE.apply('terminal'))
                return "Terminal theme activated! 💻"
            }
            if (q.includes('pink') || q.includes('rose')) {
                import('../../core/ThemeEngine.js').then(({ default: TE }) => TE.apply('sakura'))
                return "Sakura theme activated! 🌸"
            }
            return `Available themes: ${Object.keys(themes).join(', ')}. Just say "change theme to ember" for example.`
        }

        // ---- TILE WINDOWS ----
        if (q.includes('tile') || q.includes('arrange') || q.includes('organize')) {
            EventBus.emit('window:tile')
            return "I've tiled all your windows! ⊞"
        }

        // ---- CLOSE WINDOWS ----
        if (q.includes('close all') || q.includes('close everything')) {
            const windows = Store.get('windows.all') || []
            const myId = this.windowId
            let closed = 0
            for (const win of windows) {
                if (win.id !== myId) {
                    EventBus.emit('window:close', { id: win.id })
                    closed++
                }
            }
            return `Closed ${closed} window${closed !== 1 ? 's' : ''}. I kept myself alive though. 😏`
        }

        // ---- SYSTEM INFO ----
        if (q.includes('system') || q.includes('info') || q.includes('stats') || q.includes('status')) {
            const fps = Store.get('system.fps') || '—'
            const wins = Store.get('windows.all')?.length || 0
            const du = FileSystem.du('/')
            return `**System Status:**\n• FPS: ${fps}\n• Open windows: ${wins}\n• Files: ${du.fileCount}\n• Total size: ${this.formatBytes(du.totalSize)}\n• Platform: ${navigator.platform}\n• Cores: ${navigator.hardwareConcurrency || '?'}`
        }

        // ---- TIME ----
        if (q.includes('time') || q.includes('date') || q.includes('clock')) {
            return `It's **${new Date().toLocaleString()}** 🕐`
        }

        // ---- SEARCH FILES ----
        if (q.includes('search') || q.includes('find file')) {
            const term = input.replace(/^.*?(search|find)\s*(for|file)?\s*/i, '').trim()
            if (!term) return "What should I search for? Try: search readme"
            const results = FileSystem.find('/', term)
            if (results.length === 0) return `No files matching "${term}" found.`
            const list = results.slice(0, 8).map(r => `• ${r.path}`).join('\n')
            return `Found **${results.length}** result${results.length !== 1 ? 's' : ''}:\n${list}`
        }

        // ---- LIST FILES ----
        if (q.includes('list') || q.includes('what files') || q.includes('show files')) {
            const entries = FileSystem.readdir('/home/root') || []
            return `Files in home:\n${entries.map(e => `• ${e.type === 'dir' ? '📁' : '📄'} ${e.name}`).join('\n')}`
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

        // ---- WRITE TO FILE ----
        if (q.includes('write') && q.includes('to')) {
            const writeMatch = input.match(/write\s+"([^"]+)"\s+to\s+(\S+)/i)
            if (writeMatch) {
                const content = writeMatch[1]
                const name = writeMatch[2]
                const path = FileSystem.join('/home/root/Desktop', name)
                FileSystem.writeFile(path, content + '\n')
                return `Wrote to **${name}** on your Desktop! ✅`
            }
            return 'Use format: write "your text here" to filename.txt'
        }

        // ---- JOKES ----
        if (q.includes('joke') || q.includes('funny') || q.includes('laugh')) {
            const jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs. 🐛",
                "I told my compiler a joke. It didn't laugh — it threw an exception. 💥",
                "There are only 10 types of people: those who understand binary... and those who expected this joke to have three options.",
                "A SQL query walks into a bar, approaches two tables, and asks: 'Can I JOIN you?'",
                "My code works perfectly on my machine. We're shipping my machine. 🖥️📦",
                "Debugging is like being the detective in a crime movie where you are also the murderer. 🔍",
            ]
            return jokes[Math.floor(Math.random() * jokes.length)]
        }

        // ---- HELP ----
        if (q.includes('help') || q.includes('what can you')) {
            return "Here's what I can do:\n• **Open apps:** \"open terminal\"\n• **Create files:** \"create file called notes.txt\"\n• **Change themes:** \"change theme to ember\"\n• **Tile windows:** \"tile all windows\"\n• **System info:** \"show system status\"\n• **Search files:** \"search readme\"\n• **Read files:** \"read README.md\"\n• **Write files:** \"write 'hello' to test.txt\"\n• **Close windows:** \"close all windows\"\n• **Tell jokes:** \"tell me a joke\""
        }

        // ---- WHO ARE YOU ----
        if (q.includes('who are you') || q.includes('what are you')) {
            return "I'm the HyperSpace AI — an integrated assistant that can actually control this OS. I can open apps, manage files, change themes, and more. Everything I do has real effects. Try me! 🤖"
        }

        // ---- GREETING ----
        if (q.match(/^(hi|hello|hey|sup|yo)\b/)) {
            const greetings = [
                "Hey there! How can I help? 👋",
                "Hello! Ready to help you navigate HyperSpace. 🚀",
                "Hi! What shall we do today?",
            ]
            return greetings[Math.floor(Math.random() * greetings.length)]
        }

        // ---- THANK YOU ----
        if (q.includes('thank') || q.includes('thanks')) {
            return "You're welcome! Let me know if you need anything else. 😊"
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