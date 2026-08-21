import BaseApp from '../BaseApp.js'

export default class Whiteboard extends BaseApp {

    async setup() {
        this.tool = 'pencil'
        this.color = '#00f5ff'
        this.lineWidth = 3
        this.drawing = false
        this.startX = 0
        this.startY = 0

        // Save canvas state for shape preview (undo during drag)
        this.savedImageData = null

        this.container.innerHTML = `
      <div class="wb-container">
        <div class="wb-toolbar">
          <button class="wb-tool active" data-tool="pencil" title="Pencil">Pencil</button>
          <button class="wb-tool" data-tool="line" title="Line">╱</button>
          <button class="wb-tool" data-tool="rect" title="Rectangle">▭</button>
          <button class="wb-tool" data-tool="circle" title="Circle">○</button>
          <button class="wb-tool" data-tool="eraser" title="Eraser">Eraser</button>
          <div class="wb-sep"></div>
          <input type="color" class="wb-color-input" id="wb-color-${this.windowId}" value="${this.color}" title="Color">
          <div class="wb-size-group">
            <span class="wb-size-label" id="wb-size-label-${this.windowId}">3px</span>
            <input type="range" class="wb-size-input" id="wb-size-${this.windowId}" min="1" max="30" value="3">
          </div>
          <div style="flex:1"></div>
          <button class="wb-action" id="wb-undo-${this.windowId}" title="Undo">↩</button>
          <button class="wb-action" id="wb-clear-${this.windowId}" title="Clear">Delete</button>
          <button class="wb-action primary" id="wb-export-${this.windowId}" title="Export PNG">Export</button>
        </div>
        <div class="wb-canvas-wrapper">
          <canvas id="wb-canvas-${this.windowId}"></canvas>
        </div>
      </div>
    `

        this.canvas = this.$(`#wb-canvas-${this.windowId}`)
        this.ctx = this.canvas.getContext('2d')

        // Undo history
        this.undoStack = []

        this.resizeCanvas()
        this.bindEvents()
    }

    resizeCanvas() {
        const wrapper = this.container.querySelector('.wb-canvas-wrapper')
        if (!wrapper) return
        const rect = wrapper.getBoundingClientRect()
        this.canvas.width = rect.width
        this.canvas.height = rect.height

        // Fill with dark background
        this.ctx.fillStyle = '#0a0a1a'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    bindEvents() {
        const wid = this.windowId

        // Tool selection
        this.$$('.wb-tool').forEach(btn => {
            btn.addEventListener('click', () => {
                this.$$('.wb-tool').forEach(b => b.classList.remove('active'))
                btn.classList.add('active')
                this.tool = btn.dataset.tool
                this.canvas.style.cursor = this.tool === 'eraser' ? 'cell' : 'crosshair'
            })
        })

        // Color
        this.$(`#wb-color-${wid}`).addEventListener('input', (e) => {
            this.color = e.target.value
        })

        // Size
        this.$(`#wb-size-${wid}`).addEventListener('input', (e) => {
            this.lineWidth = parseInt(e.target.value)
            this.$(`#wb-size-label-${wid}`).textContent = this.lineWidth + 'px'
        })

        // Canvas drawing
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e))
        this.moveHandler = (e) => this.onMouseMove(e)
        this.upHandler = () => this.onMouseUp()
        window.addEventListener('mousemove', this.moveHandler)
        window.addEventListener('mouseup', this.upHandler)

        // Buttons
        this.$(`#wb-undo-${wid}`)?.addEventListener('click', () => this.undo())
        this.$(`#wb-clear-${wid}`)?.addEventListener('click', () => this.clearCanvas())
        this.$(`#wb-export-${wid}`)?.addEventListener('click', () => this.exportPNG())
    }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    saveState() {
        this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height))
        if (this.undoStack.length > 30) this.undoStack.shift()
    }

    onMouseDown(e) {
        this.drawing = true
        const pos = this.getCanvasPos(e)
        this.startX = pos.x
        this.startY = pos.y

        this.saveState()

        // Save current canvas for shape preview
        this.savedImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)

        if (this.tool === 'pencil' || this.tool === 'eraser') {
            this.ctx.beginPath()
            this.ctx.moveTo(pos.x, pos.y)
            this.ctx.strokeStyle = this.color
            this.ctx.lineWidth = this.tool === 'eraser' ? this.lineWidth * 3 : this.lineWidth
            this.ctx.lineCap = 'round'
            this.ctx.lineJoin = 'round'
            this.ctx.globalCompositeOperation = this.tool === 'eraser' ? 'destination-out' : 'source-over'
        }
    }

    onMouseMove(e) {
        if (!this.drawing) return

        const pos = this.getCanvasPos(e)

        if (this.tool === 'pencil' || this.tool === 'eraser') {
            this.ctx.lineTo(pos.x, pos.y)
            this.ctx.stroke()
            return
        }

        // For shapes — restore saved state and draw preview
        if (this.savedImageData) {
            this.ctx.putImageData(this.savedImageData, 0, 0)
        }

        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.strokeStyle = this.color
        this.ctx.lineWidth = this.lineWidth
        this.ctx.lineCap = 'round'

        const dx = pos.x - this.startX
        const dy = pos.y - this.startY

        if (this.tool === 'line') {
            this.ctx.beginPath()
            this.ctx.moveTo(this.startX, this.startY)
            this.ctx.lineTo(pos.x, pos.y)
            this.ctx.stroke()
        }

        if (this.tool === 'rect') {
            this.ctx.beginPath()
            this.ctx.strokeRect(this.startX, this.startY, dx, dy)
        }

        if (this.tool === 'circle') {
            const radius = Math.sqrt(dx * dx + dy * dy)
            this.ctx.beginPath()
            this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2)
            this.ctx.stroke()
        }
    }

    onMouseUp() {
        if (!this.drawing) return
        this.drawing = false
        this.ctx.globalCompositeOperation = 'source-over'
        this.savedImageData = null
    }

    undo() {
        if (this.undoStack.length === 0) return
        const imageData = this.undoStack.pop()
        this.ctx.putImageData(imageData, 0, 0)
    }

    clearCanvas() {
        this.saveState()
        this.ctx.fillStyle = '#0a0a1a'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    exportPNG() {
        const link = document.createElement('a')
        link.download = `whiteboard-${Date.now()}.png`
        link.href = this.canvas.toDataURL('image/png')
        link.click()

        this.notify('Export', 'Exported', 'Drawing saved as PNG')
    }

    onDestroy() {
        window.removeEventListener('mousemove', this.moveHandler)
        window.removeEventListener('mouseup', this.upHandler)
        this.undoStack = []
    }
}