// ============================================================
//  Visualizer.js — Real-time audio visualizer
//  Now uses actual Web Audio API frequency data
//  Draws bars + waveform using canvas for smooth rendering
// ============================================================

export default class Visualizer {

    constructor(container, audioEngine) {
        this.container = container
        this.audioEngine = audioEngine
        this.canvas = null
        this.ctx = null
        this.animationId = null
        this.mode = 'bars' // 'bars' | 'wave' | 'circle'

        this.build()
    }

    build() {
        this.canvas = document.createElement('canvas')
        this.canvas.className = 'viz-canvas'
        this.container.innerHTML = ''
        this.container.appendChild(this.canvas)
        this.ctx = this.canvas.getContext('2d')
        this.resize()
    }

    resize() {
        const rect = this.container.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio, 2)
        this.canvas.width = rect.width * dpr
        this.canvas.height = rect.height * dpr
        this.canvas.style.width = rect.width + 'px'
        this.canvas.style.height = rect.height + 'px'
        this.ctx.scale(dpr, dpr)
        this.width = rect.width
        this.height = rect.height
    }

    start() {
        if (this.animationId) return
        this.animate()
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }
        // Clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height)
        }
    }

    animate() {
        const { ctx, width, height } = this
        if (!ctx) return

        ctx.clearRect(0, 0, width, height)

        const data = this.audioEngine.getFrequencyData()
        if (!data) {
            this.animationId = requestAnimationFrame(() => this.animate())
            return
        }

        if (this.mode === 'bars') {
            this.drawBars(data)
        } else if (this.mode === 'wave') {
            this.drawWave()
        } else if (this.mode === 'circle') {
            this.drawCircle(data)
        }

        this.animationId = requestAnimationFrame(() => this.animate())
    }

    drawBars(data) {
        const { ctx, width, height } = this
        const barCount = 48
        const gap = 2
        const barWidth = (width - gap * barCount) / barCount
        const step = Math.floor(data.length / barCount)

        // Get accent color from CSS variable
        const style = getComputedStyle(document.documentElement)
        const accentColor = style.getPropertyValue('--neon-cyan').trim() || '#00f5ff'

        for (let i = 0; i < barCount; i++) {
            const value = data[i * step] / 255
            const barHeight = Math.max(2, value * height * 0.9)

            // Gradient for each bar
            const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
            gradient.addColorStop(0, accentColor)
            gradient.addColorStop(1, '#b400ff')

            ctx.fillStyle = gradient
            ctx.fillRect(
                i * (barWidth + gap),
                height - barHeight,
                barWidth,
                barHeight
            )

            // Subtle glow
            ctx.shadowColor = accentColor
            ctx.shadowBlur = value * 8
        }
        ctx.shadowBlur = 0
    }

    drawWave() {
        const { ctx, width, height } = this
        const data = this.audioEngine.getTimeData()
        if (!data) return

        ctx.beginPath()
        ctx.strokeStyle = '#00f5ff'
        ctx.lineWidth = 2

        const sliceWidth = width / data.length
        let x = 0

        for (let i = 0; i < data.length; i++) {
            const v = data[i] / 128.0
            const y = (v * height) / 2

            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)

            x += sliceWidth
        }

        ctx.stroke()

        // Mirror with lower opacity
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        ctx.strokeStyle = '#b400ff'
        x = 0
        for (let i = 0; i < data.length; i++) {
            const v = data[i] / 128.0
            const y = height - (v * height) / 2

            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)

            x += sliceWidth
        }
        ctx.stroke()
        ctx.globalAlpha = 1
    }

    drawCircle(data) {
        const { ctx, width, height } = this
        const cx = width / 2
        const cy = height / 2
        const baseRadius = Math.min(width, height) * 0.25
        const barCount = 64
        const step = Math.floor(data.length / barCount)

        for (let i = 0; i < barCount; i++) {
            const value = data[i * step] / 255
            const angle = (i / barCount) * Math.PI * 2
            const barLen = value * baseRadius * 0.8 + 2

            const x1 = cx + Math.cos(angle) * baseRadius
            const y1 = cy + Math.sin(angle) * baseRadius
            const x2 = cx + Math.cos(angle) * (baseRadius + barLen)
            const y2 = cy + Math.sin(angle) * (baseRadius + barLen)

            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.strokeStyle = `hsl(${180 + i * 3}, 100%, ${50 + value * 30}%)`
            ctx.lineWidth = 2
            ctx.stroke()
        }
    }

    setMode(mode) {
        this.mode = mode
    }

    destroy() {
        this.stop()
        this.canvas = null
        this.ctx = null
    }
}