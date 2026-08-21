import BaseApp from '../BaseApp.js'
import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import Registry from '../../core/Registry.js'
import { icon } from '../../ui/Icons.js'

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

        this.subscribe('windows.all', () => this.update())
        this.subscribe('windows.active', () => this.update())

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
          <span style="flex:0.4">ID</span>
          <span style="flex:1">Application</span>
          <span style="flex:0.7">State</span>
          <span style="flex:0.6">Size</span>
          <span style="flex:0.4">Action</span>
        </div>
        ${windows.length === 0
                ? '<div class="taskman-empty">No windows currently open</div>'
                : windows.map(win => {
                    const app = Registry.get(win.appId)
                    const isActive = win.id === activeId
                    const status = win.minimized ? 'Minimized' : win.maximized ? 'Maximized' : 'Running'
                    return `
                <div class="taskman-row ${isActive ? 'active' : ''}" data-id="${win.id}">
                  <span style="flex:0.4;font-family:var(--font-mono);font-size:var(--fs-xs)">${win.id}</span>
                  <span style="flex:1;display:flex;align-items:center;gap:6px">
                    <span style="font-size:14px">${app?.icon || icon('file')}</span>
                    ${app?.title || win.appId}
                  </span>
                  <span style="flex:0.7">
                    <span class="badge ${status === 'Running' ? 'green' : 'yellow'}">${status}</span>
                  </span>
                  <span style="flex:0.6;font-family:var(--font-mono);font-size:var(--fs-xs)">${win.width}×${win.height}</span>
                  <span style="flex:0.4;display:flex;gap:4px">
                    <button class="taskman-action-btn focus-btn" data-id="${win.id}" title="Focus">View</button>
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
      <span>Browser frame rate: ${Store.get('system.fps') || '—'}</span>
    `

        body.querySelectorAll('.focus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation()
                const winId = btn.dataset.id
                import('../../wm/WindowManager.js').then(m => m.default.focus(winId))
            })
        })

        body.querySelectorAll('.kill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation()
                const winId = btn.dataset.id
                import('../../wm/WindowManager.js').then(m => m.default.close(winId))
            })
        })

        body.querySelectorAll('.taskman-row').forEach(row => {
            row.addEventListener('click', () => {
                const winId = row.dataset.id
                if (winId) import('../../wm/WindowManager.js').then(m => m.default.focus(winId))
            })
        })
    }

    renderPerformance(body, footer) {
        const metrics = Store.get('sysmon.metrics') || {}
        const fps = Store.get('system.fps') || 0
        const cpuSim = Store.get('system.cpu') || 0
        const memSim = Store.get('system.mem') || 0

        let heapMB = '--'
        if (performance.memory) {
            heapMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
        }

        const domCount = document.querySelectorAll('*').length

        body.innerHTML = `
      <div class="taskman-perf">
        <div class="taskman-metric-card">
          <div class="metric-title">Event Loop Load</div>
          <div class="metric-val" style="color:#00f5ff">${cpuSim}%</div>
          <div class="metric-bar"><div class="metric-bar-fill" style="width:${cpuSim}%;background:#00f5ff"></div></div>
        </div>
        <div class="taskman-metric-card">
          <div class="metric-title">JS Memory Pressure</div>
          <div class="metric-val" style="color:#ff00e5">${memSim}%</div>
          <div class="metric-bar"><div class="metric-bar-fill" style="width:${memSim}%;background:#ff00e5"></div></div>
        </div>
        <div class="taskman-metric-card">
          <div class="metric-title">Frame Rate</div>
          <div class="metric-val" style="color:#28c840">${fps} fps</div>
          <div class="metric-bar"><div class="metric-bar-fill" style="width:${Math.min(100, (fps / 144) * 100)}%;background:#28c840"></div></div>
        </div>
        <div class="taskman-metric-card">
          <div class="metric-title">DOM Elements</div>
          <div class="metric-val" style="color:#b400ff">${domCount}</div>
          <div class="metric-bar"><div class="metric-bar-fill" style="width:${Math.min(100, (domCount / 3000) * 100)}%;background:#b400ff"></div></div>
        </div>
      </div>
    `

        footer.innerHTML = `
      <span>DOM: ${domCount} nodes</span>
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
        <div class="taskman-system-row"><span>Online</span><span>${navigator.onLine ? 'Yes' : 'No'}</span></div>
        <div class="taskman-system-row"><span>Cookies</span><span>${navigator.cookieEnabled ? 'Enabled' : 'Disabled'}</span></div>
        <div class="taskman-system-row"><span>Touch</span><span>${'ontouchstart' in window ? 'Supported' : 'Not supported'}</span></div>
      </div>
    `

        footer.innerHTML = '<span>System Information</span>'
    }
}
