import EventBus from '../core/EventBus.js'
import Store from '../core/Store.js'
import Registry from '../core/Registry.js'
import SpringPhysics from './SpringPhysics.js'

export default class Window {

    constructor({ id, appId, x, y, zIndex }) {
        this.id = id
        this.appId = appId
        this.x = x
        this.y = y
        this.width = 0
        this.height = 0
        this.minWidth = 300
        this.minHeight = 200
        this.zIndex = zIndex
        this.maximized = false
        this.minimized = false
        this.preMaxBounds = null
        this.snapped = false           // ← MUST EXIST
        this.preSnapBounds = null      // ← MUST EXIST
        this.element = null
        this.bodyElement = null
        this.app = null
        this.destroyed = false
        this.spring = new SpringPhysics()  // ← MUST EXIST

        const def = Registry.get(appId)
        if (def) {
            this.width = def.width
            this.height = def.height
            this.minWidth = def.minWidth
            this.minHeight = def.minHeight
        }
    }

    // ... keep render(), loadApp(), applyPosition(), setPosition(), 
    // setSize(), setZIndex(), focus(), blur() exactly as before ...

    render() {
        const def = Registry.get(this.appId)

        this.element = document.createElement('div')
        this.element.className = 'hyper-window'
        this.element.id = `window-${this.id}`
        this.element.dataset.windowId = this.id

        // Start invisible for spring animation
        this.element.style.opacity = '0'
        this.element.style.transform = 'scale(0.85) translateY(20px)'

        this.applyPosition()

        this.element.innerHTML = `
      <div class="window-titlebar" data-window-id="${this.id}">
        <div class="window-traffic">
          <button class="traffic-btn close" data-action="close" data-window-id="${this.id}"></button>
          <button class="traffic-btn minimize" data-action="minimize" data-window-id="${this.id}"></button>
          <button class="traffic-btn maximize" data-action="maximize" data-window-id="${this.id}"></button>
        </div>
        <div class="window-title">
          <span class="window-title-icon">${def?.icon || 'file'}</span>
          <span class="window-title-text">${def?.title || 'Untitled'}</span>
        </div>
        <div class="window-titlebar-spacer"></div>
      </div>
      <div class="window-body" id="window-body-${this.id}"></div>
      <div class="window-resize-handle" data-window-id="${this.id}"></div>
    `

        this.bodyElement = this.element.querySelector('.window-body')

        // Traffic buttons
        this.element.querySelector('.window-traffic').addEventListener('click', (e) => {
            const btn = e.target.closest('.traffic-btn')
            if (!btn) return
            e.stopPropagation()
            const action = btn.dataset.action
            const winId = parseInt(btn.dataset.windowId)
            if (action === 'close') EventBus.emit('window:close', { id: winId })
            if (action === 'minimize') EventBus.emit('window:minimize', { id: winId })
            if (action === 'maximize') EventBus.emit('window:maximize', { id: winId })
        })

        // Focus on click
        this.element.addEventListener('mousedown', (e) => {
            if (e.target.closest('.traffic-btn')) return
            EventBus.emit('window:focus', { id: this.id })
        })

        // Spring spawn animation
        requestAnimationFrame(() => {
            this.spring.animate(`spawn-${this.id}`, this.element, {
                scale: { from: 0.85, to: 1 },
                opacity: { from: 0, to: 1 },
            }, {
                ...SpringPhysics.SPAWN,
                onUpdate: (el, vals) => {
                    el.style.transform = `scale(${vals.scale}) translateY(${(1 - vals.scale) * 40}px)`
                    el.style.opacity = vals.opacity
                },
                onComplete: () => {
                    this.element.style.transform = ''
                    this.element.style.opacity = ''
                },
            })
        })

        return this.element
    }

    async loadApp() {
        const def = Registry.get(this.appId)
        if (!def || !def.component) {
            this.bodyElement.innerHTML = `
        <div style="padding:20px;color:var(--text-secondary)">
          App "${this.appId}" has no component defined
        </div>
      `
            return
        }

        try {
            const module = await def.component()
            const AppClass = module.default
            this.app = new AppClass({ windowId: this.id, container: this.bodyElement })
            if (typeof this.app.mount === 'function') await this.app.mount()
            if (typeof def.onOpen === 'function') def.onOpen(this)
        } catch (err) {
            console.error(`[Window] Failed to load "${this.appId}":`, err)
            this.bodyElement.innerHTML = `
        <div style="padding:20px;color:#ff5f57">
          Failed to load ${this.appId}<br>
          <span style="font-size:12px;color:var(--text-secondary)">${err.message}</span>
        </div>
      `
        }
    }

    applyPosition() {
        if (!this.element) return
        this.element.style.left = `${this.x}px`
        this.element.style.top = `${this.y}px`
        this.element.style.width = `${this.width}px`
        this.element.style.height = `${this.height}px`
        this.element.style.zIndex = this.zIndex
    }

    setPosition(x, y) {
        this.x = x
        this.y = y
        if (this.element) {
            this.element.style.left = `${x}px`
            this.element.style.top = `${y}px`
        }
    }

    setSize(w, h) {
        this.width = Math.max(this.minWidth, w)
        this.height = Math.max(this.minHeight, h)
        if (this.element) {
            this.element.style.width = `${this.width}px`
            this.element.style.height = `${this.height}px`
        }
    }

    setZIndex(z) {
        this.zIndex = z
        if (this.element) this.element.style.zIndex = z
    }

    focus() {
        if (!this.element) return
        if (this.minimized) this.restore()
        this.element.classList.add('active')
        const def = Registry.get(this.appId)
        if (def?.onFocus) def.onFocus(this)
        if (this.app?.onFocus) this.app.onFocus()
    }

    blur() {
        if (!this.element) return
        this.element.classList.remove('active')
        const def = Registry.get(this.appId)
        if (def?.onBlur) def.onBlur(this)
        if (this.app?.onBlur) this.app.onBlur()
    }

    // ---- MINIMIZE (spring) ----
    minimize() {
        if (!this.element || this.minimized) return
        this.minimized = true

        this.spring.animate(`min-${this.id}`, this.element, {
            scale: { from: 1, to: 0.3 },
            opacity: { from: 1, to: 0 },
        }, {
            stiffness: 300,
            damping: 30,
            mass: 0.8,
            onUpdate: (el, vals) => {
                el.style.transform = `scale(${vals.scale}) translateY(${(1 - vals.scale) * 300}px)`
                el.style.opacity = vals.opacity
            },
            onComplete: () => {
                this.element.style.display = 'none'
                this.element.style.transform = ''
                this.element.style.opacity = ''
            },
        })
    }

    // ---- RESTORE (spring) ----
    restore() {
        if (!this.element || !this.minimized) return
        this.minimized = false
        this.element.style.display = 'flex'

        this.spring.animate(`restore-${this.id}`, this.element, {
            scale: { from: 0.3, to: 1 },
            opacity: { from: 0, to: 1 },
        }, {
            ...SpringPhysics.SPAWN,
            onUpdate: (el, vals) => {
                el.style.transform = `scale(${vals.scale}) translateY(${(1 - vals.scale) * 300}px)`
                el.style.opacity = vals.opacity
            },
            onComplete: () => {
                this.element.style.transform = ''
                this.element.style.opacity = ''
            },
        })
    }

    // ---- MAXIMIZE (spring) ----
    toggleMaximize() {
        if (!this.element) return

        if (this.maximized) {
            const b = this.preMaxBounds

            this.spring.animate(`max-${this.id}`, this.element, {
                x: { from: 0, to: b.x },
                y: { from: 32, to: b.y },
                width: { from: window.innerWidth, to: b.width },
                height: { from: window.innerHeight - 108, to: b.height },
            }, {
                ...SpringPhysics.RESIZE,
                onComplete: () => {
                    this.x = b.x
                    this.y = b.y
                    this.width = b.width
                    this.height = b.height
                    this.element.style.borderRadius = ''
                },
            })

            this.maximized = false
            this.preMaxBounds = null
        } else {
            this.preMaxBounds = {
                x: this.x, y: this.y,
                width: this.width, height: this.height,
            }

            this.element.style.borderRadius = '0'

            this.spring.animate(`max-${this.id}`, this.element, {
                x: { from: this.x, to: 0 },
                y: { from: this.y, to: 32 },
                width: { from: this.width, to: window.innerWidth },
                height: { from: this.height, to: window.innerHeight - 108 },
            }, {
                ...SpringPhysics.RESIZE,
                onComplete: () => {
                    this.x = 0
                    this.y = 32
                    this.width = window.innerWidth
                    this.height = window.innerHeight - 108
                },
            })

            this.maximized = true
        }
    }

    // ---- CLOSE (spring) ----
    async close() {
        if (!this.element || this.destroyed) return
        this.destroyed = true

        const def = Registry.get(this.appId)
        if (def?.onClose) def.onClose(this)
        if (this.app?.destroy) this.app.destroy()

        return new Promise(resolve => {
            this.spring.animate(`close-${this.id}`, this.element, {
                scale: { from: 1, to: 0.9 },
                opacity: { from: 1, to: 0 },
            }, {
                stiffness: 400,
                damping: 35,
                mass: 0.6,
                onUpdate: (el, vals) => {
                    el.style.transform = `scale(${vals.scale}) translateY(${(1 - vals.opacity) * 15}px)`
                    el.style.opacity = vals.opacity
                },
                onComplete: () => {
                    if (this.element?.parentNode) this.element.remove()
                    this.element = null
                    this.bodyElement = null
                    this.app = null
                    resolve()
                },
            })
        })
    }

    toJSON() {
        return {
            id: this.id, appId: this.appId,
            x: this.x, y: this.y,
            width: this.width, height: this.height,
            maximized: this.maximized, minimized: this.minimized,
        }
    }
}