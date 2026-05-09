// ============================================================
//  ClipboardManager.js — Clipboard history
//  Tracks everything copied in the OS.
//  Open with Ctrl+Shift+V to paste from history.
// ============================================================

import EventBus from '../core/EventBus.js'

const ClipboardManager = (() => {

    const history = []
    const MAX_ITEMS = 20
    let overlay = null
    let isOpen = false

    function init() {
        // Track copies
        document.addEventListener('copy', (e) => {
            const text = window.getSelection()?.toString()
            if (text && text.trim()) {
                addToHistory(text.trim())
            }
        })

        // Listen for file copies from Files app
        EventBus.on('clipboard:add', ({ text, type }) => {
            addToHistory(text, type)
        })

        // Ctrl+Shift+V to open clipboard history
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
                e.preventDefault()
                toggle()
            }
            if (e.key === 'Escape' && isOpen) {
                close()
            }
        })

        console.log('[ClipboardManager] Initialized (Ctrl+Shift+V to open)')
    }

    function addToHistory(text, type = 'text') {
        // Don't add duplicates at the top
        if (history.length > 0 && history[0].text === text) return

        history.unshift({
            text,
            type,
            time: Date.now(),
        })

        // Trim to max
        while (history.length > MAX_ITEMS) history.pop()
    }

    function toggle() {
        if (isOpen) close()
        else open()
    }

    function open() {
        if (isOpen) return
        isOpen = true

        overlay = document.createElement('div')
        overlay.className = 'clipboard-overlay'

        overlay.innerHTML = `
      <div class="clipboard-panel">
        <div class="clipboard-header">
          <span class="clipboard-title">📋 Clipboard History</span>
          <button class="clipboard-clear" id="cb-clear">Clear All</button>
        </div>
        <div class="clipboard-list" id="cb-list">
          ${history.length === 0
                ? '<div class="clipboard-empty">No clipboard history yet</div>'
                : history.map((item, i) => `
                <div class="clipboard-item" data-index="${i}">
                  <div class="clipboard-item-text">${escapeHtml(item.text)}</div>
                  <div class="clipboard-item-meta">${timeAgo(item.time)}</div>
                </div>
              `).join('')
            }
        </div>
      </div>
    `

        document.body.appendChild(overlay)

        // Click item to copy
        overlay.querySelectorAll('.clipboard-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index)
                const item = history[idx]
                if (item) {
                    navigator.clipboard.writeText(item.text).then(() => {
                        EventBus.emit('notification:show', {
                            icon: '📋',
                            title: 'Copied',
                            body: item.text.slice(0, 60) + (item.text.length > 60 ? '...' : ''),
                            duration: 2000,
                        })
                    }).catch(() => {
                        // Fallback for insecure contexts
                        const ta = document.createElement('textarea')
                        ta.value = item.text
                        document.body.appendChild(ta)
                        ta.select()
                        document.execCommand('copy')
                        ta.remove()
                    })
                    close()
                }
            })
        })

        // Clear button
        overlay.querySelector('#cb-clear')?.addEventListener('click', () => {
            history.length = 0
            close()
            EventBus.emit('notification:show', {
                icon: '🗑️',
                title: 'Clipboard',
                body: 'History cleared',
                duration: 2000,
            })
        })

        // Click outside to close
        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) close()
        })
    }

    function close() {
        if (!isOpen) return
        isOpen = false
        if (overlay) {
            overlay.classList.add('closing')
            setTimeout(() => {
                if (overlay?.parentNode) overlay.remove()
                overlay = null
            }, 150)
        }
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .slice(0, 200)
    }

    function timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000)
        if (seconds < 60) return 'just now'
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago'
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago'
        return Math.floor(seconds / 86400) + 'd ago'
    }

    return { init, open, close, addToHistory }

})()

export default ClipboardManager