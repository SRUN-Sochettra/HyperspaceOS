// ============================================================
//  StatusBar.js — Top bar showing OS name, active app,
//  connection status, FPS counter, clock.
//  Updates reactively from Store and EventBus.
// ============================================================

import Store from '../core/Store.js'
import EventBus from '../core/EventBus.js'

const StatusBar = (() => {

    let container = null
    let appNameEl = null
    let fpsEl = null
    let clockEl = null
    let clockInterval = null
    let fpsInterval = null
    let fpsFrames = 0
    let fpsLast = performance.now()

    function init() {
        container = document.getElementById('statusbar')
        if (!container) return

        container.innerHTML = `
      <div class="status-left">
        <span class="status-brand">⬡ HYPERSPACE</span>
        <span class="status-separator">│</span>
        <span class="status-app" id="status-app-name">Desktop</span>
      </div>
      <div class="status-right">
        <div class="status-indicator">
          <div class="status-dot"></div>
          <span>Connected</span>
        </div>
        <span class="status-separator">│</span>
        <span class="status-fps" id="status-fps">60 FPS</span>
        <span class="status-separator">│</span>
        <span class="status-clock" id="status-clock">00:00:00</span>
      </div>
    `

        appNameEl = document.getElementById('status-app-name')
        fpsEl = document.getElementById('status-fps')
        clockEl = document.getElementById('status-clock')

        // Show after boot
        EventBus.on('os:boot:complete', () => {
            container.classList.add('visible')
        })

        // Listen for active app changes
        EventBus.on('statusbar:app', ({ name }) => {
            if (appNameEl) appNameEl.textContent = name
        })

        EventBus.on('window:none-active', () => {
            if (appNameEl) appNameEl.textContent = 'Desktop'
        })

        // Start clock
        updateClock()
        clockInterval = setInterval(updateClock, 1000)

        // Start FPS counter
        startFPSCounter()
    }

    function updateClock() {
        if (!clockEl) return
        const now = new Date()
        const h = String(now.getHours()).padStart(2, '0')
        const m = String(now.getMinutes()).padStart(2, '0')
        const s = String(now.getSeconds()).padStart(2, '0')
        clockEl.textContent = `${h}:${m}:${s}`
    }

    function startFPSCounter() {
        let frameCount = 0
        let lastTime = performance.now()

        function countFrame() {
            frameCount++
            requestAnimationFrame(countFrame)
        }
        requestAnimationFrame(countFrame)

        // Calculate every second — don't reset inside rAF
        fpsInterval = setInterval(() => {
            const now = performance.now()
            const elapsed = now - lastTime

            // Only update if enough time has passed (avoid division by tiny numbers)
            if (elapsed < 500) return

            const fps = Math.round((frameCount * 1000) / elapsed)
            frameCount = 0
            lastTime = now

            Store.set('system.fps', fps)

            if (fpsEl) {
                fpsEl.textContent = `${fps} FPS`
                fpsEl.classList.remove('fps-good', 'fps-mid', 'fps-bad')
                if (fps >= 50) fpsEl.classList.add('fps-good')
                else if (fps >= 30) fpsEl.classList.add('fps-mid')
                else fpsEl.classList.add('fps-bad')
            }
        }, 1000)
    }

    function destroy() {
        if (clockInterval) clearInterval(clockInterval)
        if (fpsInterval) clearInterval(fpsInterval)
    }

    return { init, destroy }

})()

export default StatusBar