// ============================================================
//  Notification.js — Toast notification system
//  Listens for 'notification:show' events.
//  Supports stacking, auto-dismiss, and click-to-dismiss.
//
//  Usage:
//    EventBus.emit('notification:show', {
//      icon: '',
//      title: 'HyperSpace OS',
//      body: 'System ready.',
//      duration: 4000         ← optional, default 4000ms
//    })
// ============================================================

import EventBus from '../core/EventBus.js'

const Notification = (() => {

    let container = null
    const active = []         // Currently visible notifications
    const MAX_VISIBLE = 4     // Stack limit

    function init() {
        container = document.getElementById('notification-container')
        if (!container) return

        EventBus.on('notification:show', show)
    }

    function show({ icon = '', title = '', body = '', duration = 4000 }) {
        // Remove oldest if at limit
        if (active.length >= MAX_VISIBLE) {
            dismiss(active[0])
        }

        const el = document.createElement('div')
        el.className = 'notification'

        el.innerHTML = `
      <span class="notif-icon">${icon}</span>
      <div class="notif-content">
        <div class="notif-title">${title}</div>
        <div class="notif-body">${body}</div>
      </div>
    `

        // Position — stack below existing notifications
        const offset = active.length * 68
        el.style.top = `${44 + offset}px`

        container.appendChild(el)
        active.push(el)

        // Click to dismiss
        el.addEventListener('click', () => dismiss(el))

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => dismiss(el), duration)
        }
    }

    function dismiss(el) {
        if (!el || !el.parentNode) return

        const index = active.indexOf(el)
        if (index === -1) return

        el.classList.add('hiding')

        setTimeout(() => {
            if (el.parentNode) el.remove()
            active.splice(active.indexOf(el), 1)

            // Reposition remaining notifications
            repositionAll()
        }, 300)
    }

    function repositionAll() {
        active.forEach((el, i) => {
            el.style.top = `${44 + i * 68}px`
        })
    }

    function clearAll() {
        [...active].forEach(dismiss)
    }

    return { init, clearAll }

})()

export default Notification