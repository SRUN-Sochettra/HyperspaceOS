// ============================================================
//  Workspaces.js — Virtual desktops
//  Switch between workspaces with Ctrl+1/2/3/4
//  Each workspace remembers which windows are on it
// ============================================================

import EventBus from '../core/EventBus.js'
import Store from '../core/Store.js'

const Workspaces = (() => {

    let current = 0
    const MAX = 4
    // Map: workspaceIndex → Set of windowIds
    const assignments = new Map()

    function init() {
        for (let i = 0; i < MAX; i++) {
            assignments.set(i, new Set())
        }

        // Keyboard shortcuts: Ctrl+1 through Ctrl+4
        document.addEventListener('keydown', (e) => {
            if (!e.ctrlKey && !e.metaKey) return
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

            const num = parseInt(e.key)
            if (num >= 1 && num <= MAX) {
                e.preventDefault()
                switchTo(num - 1)
            }
        })

        // Assign new windows to current workspace
        EventBus.on('window:opened', ({ id }) => {
            assignments.get(current).add(id)
        })

        // Remove closed windows
        EventBus.on('window:closed', ({ id }) => {
            for (const [, set] of assignments) {
                set.delete(id)
            }
            updateIndicator()
        })

        // Build workspace indicator in dock
        buildIndicator()

        console.log('[Workspaces] Initialized (Ctrl+1-4 to switch)')
    }

    function switchTo(index) {
        if (index === current || index < 0 || index >= MAX) return

        const prevIndex = current
        current = index

        // Hide windows from previous workspace
        const prevWindows = assignments.get(prevIndex)
        for (const winId of prevWindows) {
            const el = document.getElementById(`window-${winId}`)
            if (el) {
                el.style.display = 'none'
                el.style.pointerEvents = 'none'
            }
        }

        // Show windows from current workspace
        const currWindows = assignments.get(current)
        for (const winId of currWindows) {
            const el = document.getElementById(`window-${winId}`)
            if (el) {
                el.style.display = 'flex'
                el.style.pointerEvents = 'auto'
            }
        }

        // Focus topmost window in new workspace
        if (currWindows.size > 0) {
            const topId = [...currWindows].pop()
            EventBus.emit('window:focus', { id: topId })
        } else {
            EventBus.emit('window:none-active')
        }

        updateIndicator()

        EventBus.emit('notification:show', {
            icon: '🖥️',
            title: `Desktop ${current + 1}`,
            body: `${currWindows.size} window${currWindows.size !== 1 ? 's' : ''}`,
            duration: 1500,
        })
    }

    function buildIndicator() {
        // Wait for dock to exist
        EventBus.on('os:boot:complete', () => {
            const dock = document.getElementById('dock')
            if (!dock) return

            // Insert workspace indicator before dock items
            const indicator = document.createElement('div')
            indicator.className = 'workspace-indicator'
            indicator.id = 'workspace-indicator'

            indicator.innerHTML = Array.from({ length: MAX }, (_, i) => `
        <button class="workspace-dot ${i === current ? 'active' : ''}"
                data-ws="${i}" title="Desktop ${i + 1}">
          ${i + 1}
        </button>
      `).join('')

            // Add separator after indicator
            const sep = document.createElement('div')
            sep.className = 'dock-separator'

            dock.prepend(sep)
            dock.prepend(indicator)

            // Click to switch
            indicator.querySelectorAll('.workspace-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    switchTo(parseInt(dot.dataset.ws))
                })
            })
        })
    }

    function updateIndicator() {
        const indicator = document.getElementById('workspace-indicator')
        if (!indicator) return

        indicator.querySelectorAll('.workspace-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === current)
            const count = assignments.get(i)?.size || 0
            dot.classList.toggle('has-windows', count > 0)
        })
    }

    function getCurrent() { return current }

    function destroy() {
        assignments.clear()
    }

    return { init, switchTo, getCurrent, destroy }

})()

export default Workspaces