import BaseApp from '../BaseApp.js'
import Sparkline from './Sparkline.js'
import Store from '../../core/Store.js'
import { icon } from '../../ui/Icons.js'

export default class SysMonitor extends BaseApp {

    async setup() {
        this.metrics = [
            { key: 'fps', label: 'Frame Rate', color: '#28c840', unit: ' fps', icon: icon('sysmon') },
            { key: 'heap', label: 'JS Heap', color: '#ff00e5', unit: ' MB', icon: icon('taskman') },
            { key: 'dom', label: 'DOM Nodes', color: '#00f5ff', unit: '', icon: icon('files') },
            { key: 'lag', label: 'Event Loop Lag', color: '#b400ff', unit: ' ms', icon: icon('settings') },
        ]

        this.loopLag = 0
        this.lagTimeout = null

        this.container.innerHTML = `
      <div class="sysmon">
        <div class="sysmon-grid">
          ${this.metrics.map(m => `
            <div class="sysmon-card" id="smc-${m.key}-${this.windowId}">
              <div class="sysmon-card-top">
                <div class="sysmon-card-icon">${m.icon}</div>
                <div class="sysmon-card-info">
                  <div class="sysmon-card-label">${m.label}</div>
                  <div class="sysmon-card-value" id="smv-${m.key}-${this.windowId}" style="color:${m.color}">—</div>
                </div>
              </div>
              <div class="sysmon-card-chart" id="smc-chart-${m.key}-${this.windowId}"></div>
              <div class="sysmon-card-bar">
                <div class="sysmon-card-bar-fill" id="smb-${m.key}-${this.windowId}" style="background:${m.color}"></div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="sysmon-footer">
          <div class="sysmon-footer-item">
            <span class="sysmon-footer-label">Platform</span>
            <span class="sysmon-footer-value">${navigator.platform}</span>
          </div>
          <div class="sysmon-footer-item">
            <span class="sysmon-footer-label">Cores</span>
            <span class="sysmon-footer-value">${navigator.hardwareConcurrency || '—'}</span>
          </div>
          <div class="sysmon-footer-item">
            <span class="sysmon-footer-label">Memory</span>
            <span class="sysmon-footer-value">${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—'}</span>
          </div>
          <div class="sysmon-footer-item">
            <span class="sysmon-footer-label">Screen</span>
            <span class="sysmon-footer-value">${screen.width}×${screen.height}</span>
          </div>
        </div>
      </div>
    `

        // Create sparklines after DOM is ready
        this.sparklines = {}
        this.addTimeout(() => {
            for (const m of this.metrics) {
                const chartContainer = this.$(`#smc-chart-${m.key}-${this.windowId}`)
                if (chartContainer) {
                    const canvas = document.createElement('canvas')
                    chartContainer.appendChild(canvas)
                    this.sparklines[m.key] = new Sparkline(canvas, m.color)
                }
            }
        }, 50)

        // Start lag tracking
        this.trackLoopLag()

        // Update every second
        this.addInterval(() => this.update(), 1000)

        // Initial update
        this.addTimeout(() => this.update(), 100)
    }

    trackLoopLag() {
        const measure = () => {
            if (this.destroyed) return
            const start = performance.now()
            this.lagTimeout = setTimeout(() => {
                if (this.destroyed) return
                this.loopLag = Math.max(0, performance.now() - start - 100)
                measure()
            }, 100)
        }
        measure()
    }

    update() {
        if (this.destroyed) return

        const fps = Store.get('system.fps') || 0

        let heapMB = 0
        let heapPct = 0
        if (performance.memory) {
            heapMB = performance.memory.usedJSHeapSize / 1024 / 1024
            heapPct = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        }

        const domCount = document.querySelectorAll('*').length
        const lag = this.loopLag

        const data = {
            fps: { display: fps, barPct: Math.min(100, (fps / 144) * 100) },
            heap: { display: heapMB.toFixed(1), barPct: Math.min(100, heapPct) },
            dom: { display: domCount, barPct: Math.min(100, (domCount / 3000) * 100) },
            lag: { display: lag.toFixed(1), barPct: Math.min(100, lag * 3) },
        }

        for (const m of this.metrics) {
            const d = data[m.key]
            if (!d) continue

            const valEl = this.$(`#smv-${m.key}-${this.windowId}`)
            const barEl = this.$(`#smb-${m.key}-${this.windowId}`)

            if (valEl) valEl.textContent = `${d.display}${m.unit}`
            if (barEl) barEl.style.width = `${d.barPct}%`

            if (this.sparklines[m.key]) {
                this.sparklines[m.key].push(d.barPct)
                this.sparklines[m.key].draw()
            }
        }

        Store.set('system.cpu', Math.round(data.lag.barPct))
        Store.set('system.mem', Math.round(data.heap.barPct))
        Store.set('system.gpu', Math.round(data.fps.barPct))
    }

    onDestroy() {
        if (this.lagTimeout) clearTimeout(this.lagTimeout)
        this.sparklines = {}
    }
}