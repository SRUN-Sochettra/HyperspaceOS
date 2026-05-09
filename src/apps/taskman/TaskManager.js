import BaseApp from '../BaseApp.js'
import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import Registry from '../../core/Registry.js'

export default class TaskManager extends BaseApp {

    async setup() {
        this.container.innerHTML = `
      <div class="taskman-container">
        <div class="taskman-header">
          <div class="taskman-tabs">
            <button class="taskman-tab active" data-tab="windows">Windows</button>
            <button class="taskman-tab" data-tab="performance">Performance</button>
            <button class="taskman-tab" data-tab="system">System</button>
          </div>
        </div>
        <div class="taskman-body" id="tm-body-${this.windowId}"></div>
        <div class="taskman-footer" id="tm-footer-${this.windowId}"></div>
      </div>
    `

        this.currentTab = 'windows'

        this.$$('.taskman-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.$$('.taskman-tab').forEach(t => t.classList.remove('active'))
                tab.classList.add('active')
                this.currentTab = tab.dataset.tab
                this.update()
            })
        })

        this.update()
        this.addInterval(() => this.update(), 1500)
    }

    update() {
        const body = this.$(`#tm-body-${this.windowId}`)
        const footer = this.$(`#tm-footer-${this.windowId}`)
        if (!body) return

        switch (this.currentTab) {
            case 'windows': this.renderWindows(body, footer); break
            case 'performance': this.renderPerformance(body, footer); break
            case 'system': this.renderSystem(body, footer); break
        }
    }

    renderWindows(body, footer) {
        const windows = Store.get('windows.all') || []
        const activeId = Store.get('windows.active')

        body.innerHTML = `
      <div class="taskman-list">
        <div class="taskman-list-header">
          <span style="flex:0.4">PID</span>
          <span style="flex:1">App</span>
          <span style="flex:0.7">Status</span>
          <span style="flex:0.6">Size</span>
          <span style="flex:0.4"></span>
        </div>
        ${windows.length === 0
                ? '<div class="taskman-empty">No windows open</div>'
                : windows.map(win => {
                    const app = Registry.get(win.appId)
                    const isActive = win.id === activeId
                    const status = win.minimized ? 'Minimized' : win.maximized ? 'Maximized' : 'Running'
                    return `
                <div class="taskman-row ${isActive ? 'active' : ''}" data-id="${win.id}">
                  <span style="flex:0.4;font-family:var(--font-mono);font-size:var(--fs-xs)">${win.id}</span>
                  <span style="flex:1;display:flex;align-items:center;gap:6px">
                    <span style="font-size:14px">${app?.icon || '📄'}</span>
                    ${app?.title || win.appId}
                  </span>
                  <span style="flex:0.7">
                    <span class="badge ${status === 'Running' ? 'green' : 'yellow'}">${status}</span>
                  </span>
                  <span style="flex:0.6;font-family:var(--font-mono);font-size:var(--fs-xs)">${win.width}×${win.height}</span>
                  <span style="flex:0.4;display:flex;gap:4px">
                    <button class="taskman-action-btn focus-btn" data-id="${win.id}" title="Focus">👁</button>
                    <button class="taskman-action-btn kill-btn" data-id="${win.id}" title="Kill">✕</button>
                  </span>
                </div>
              `
                }).join('')
            }
      </div>
    `

        footer.innerHTML = `
      <span>${windows.length} window${windows.length !== 1 ? 's' : ''}</span>
      <span>FPS: ${Store.get('system.fps') || '—'}</span>
    `

        // Bind actions
        body.querySelectorAll('.focus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation()
                EventBus.emit('window:focus', { id: parseInt(btn.dataset.id) })
            })
        })

        body.querySelectorAll('.kill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation()
                EventBus.emit('window:close', { id: parseInt(btn.dataset.id) })
            })
        })

        // Click row to focus
        body.querySelectorAll('.taskman-row').forEach(row => {
            row.addEventListener('dblclick', () => {
                EventBus.emit('window:focus', { id: parseInt(row.dataset.id) })
            })
        })
    }

    renderPerformance(body, footer) {
        const fps = Store.get('system.fps') || 0
        const cpu = Store.get('system.cpu') || 0
        const mem = Store.get('system.memory') || Store.get('system.mem') || 0
        const gpu = Store.get('system.gpu') || 0

        const heapMB = performance.memory
            ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
            : '—'
        const heapLimit = performance.memory
            ? (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0)
            : '—'

        body.innerHTML = `
      <div class="taskman-perf">
        <div class="taskman-perf-row">
          <div class="taskman-perf-label">FPS</div>
          <div class="taskman-perf-bar-track">
            <div class="taskman-perf-bar" style="width:${Math.min(100, fps / 60 * 100)}%;background:var(--neon-green)"></div>
          </div>
          <div class="taskman-perf-value" style="color:var(--neon-green)">${fps}</div>
        </div>
        <div class="taskman-perf-row">
          <div class="taskman-perf-label">CPU</div>
          <div class="taskman-perf-bar-track">
            <div class="taskman-perf-bar" style="width:${cpu}%;background:var(--neon-cyan)"></div>
          </div>
          <div class="taskman-perf-value" style="color:var(--neon-cyan)">${Math.round(cpu)}%</div>
        </div>
        <div class="taskman-perf-row">
          <div class="taskman-perf-label">Memory</div>
          <div class="taskman-perf-bar-track">
            <div class="taskman-perf-bar" style="width:${mem}%;background:var(--neon-magenta)"></div>
          </div>
          <div class="taskman-perf-value" style="color:var(--neon-magenta)">${Math.round(mem)}%</div>
        </div>
        <div class="taskman-perf-row">
          <div class="taskman-perf-label">GPU</div>
          <div class="taskman-perf-bar-track">
            <div class="taskman-perf-bar" style="width:${gpu}%;background:var(--neon-green)"></div>
          </div>
          <div class="taskman-perf-value" style="color:var(--neon-green)">${Math.round(gpu)}%</div>
        </div>
        <div class="divider"></div>
        <div class="taskman-perf-row">
          <div class="taskman-perf-label">JS Heap</div>
          <div class="taskman-perf-bar-track">
            <div class="taskman-perf-bar" style="width:${performance.memory ? (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100) : 0}%;background:var(--neon-orange)"></div>
          </div>
          <div class="taskman-perf-value">${heapMB} / ${heapLimit} MB</div>
        </div>
        <div class="taskman-perf-row">
          <div class="taskman-perf-label">DOM Nodes</div>
          <div class="taskman-perf-value" style="flex:1;text-align:right">${document.querySelectorAll('*').length}</div>
        </div>
      </div>
    `

        footer.innerHTML = `
      <span>Updated every 1.5s</span>
      <span>Heap: ${heapMB} MB</span>
    `
    }

    renderSystem(body, footer) {
        body.innerHTML = `
      <div class="taskman-system">
        <div class="taskman-system-row"><span>OS</span><span>HyperSpace v${Store.get('os.version')}</span></div>
        <div class="taskman-system-row"><span>Platform</span><span>${navigator.platform}</span></div>
        <div class="taskman-system-row"><span>User Agent</span><span style="font-size:var(--fs-2xs);word-break:break-all">${navigator.userAgent.slice(0, 80)}...</span></div>
        <div class="taskman-system-row"><span>CPU Cores</span><span>${navigator.hardwareConcurrency || '—'}</span></div>
        <div class="taskman-system-row"><span>Device Memory</span><span>${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—'}</span></div>
        <div class="taskman-system-row"><span>Language</span><span>${navigator.language}</span></div>
        <div class="taskman-system-row"><span>Screen</span><span>${screen.width}×${screen.height} @${window.devicePixelRatio}x</span></div>
        <div class="taskman-system-row"><span>Viewport</span><span>${window.innerWidth}×${window.innerHeight}</span></div>
        <div class="taskman-system-row"><span>Color Depth</span><span>${screen.colorDepth}-bit</span></div>
        <div class="taskman-system-row"><span>Online</span><span>${navigator.onLine ? '✅ Yes' : '❌ No'}</span></div>
        <div class="taskman-system-row"><span>Cookies</span><span>${navigator.cookieEnabled ? '✅' : '❌'}</span></div>
        <div class="taskman-system-row"><span>Touch</span><span>${'ontouchstart' in window ? '✅' : '❌'}</span></div>
      </div>
    `

        footer.innerHTML = '<span>System Information</span>'
    }
}