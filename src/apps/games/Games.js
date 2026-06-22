import BaseApp from '../BaseApp.js'

export default class Games extends BaseApp {
    async setup() {
        this.container.innerHTML = `
            <div class="games-container">
                <div class="games-header">
                    <span>Snake</span>
                    <span class="games-score">Score: 0</span>
                </div>
                <div class="games-canvas-wrapper">
                    <canvas class="games-canvas" width="300" height="300"></canvas>
                </div>
                <div class="games-overlay" id="games-overlay-${this.windowId}">
                    <h2 id="games-title-${this.windowId}">Snake</h2>
                    <button class="games-btn" id="games-start-${this.windowId}">Start Game</button>
                </div>
            </div>
        `

        this.canvas = this.$('.games-canvas')
        this.ctx = this.canvas.getContext('2d')
        this.scoreEl = this.$('.games-score')
        this.overlay = this.$(`#games-overlay-${this.windowId}`)
        this.titleEl = this.$(`#games-title-${this.windowId}`)
        this.startBtn = this.$(`#games-start-${this.windowId}`)

        this.gridSize = 15
        this.tileCount = 20 // 300 / 15
        this.score = 0
        this.highScore = localStorage.getItem('snakeHighScore') || 0

        this.snake = []
        this.apple = { x: 15, y: 15 }
        this.velocity = { x: 0, y: 0 }

        this.gameLoop = null
        this.isPlaying = false

        this.startBtn.addEventListener('click', () => this.startGame())

        this.keyHandler = (e) => this.handleKey(e)
        document.addEventListener('keydown', this.keyHandler)

        this.drawInitial()
    }

    drawInitial() {
        this.ctx.fillStyle = '#1e1e2e'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    startGame() {
        this.snake = [
            { x: 10, y: 10 },
            { x: 10, y: 11 },
            { x: 10, y: 12 }
        ]
        this.velocity = { x: 0, y: -1 } // Start moving up
        this.score = 0
        this.updateScore()
        this.placeApple()
        this.overlay.style.display = 'none'
        this.isPlaying = true

        if (this.gameLoop) clearInterval(this.gameLoop)
        this.gameLoop = setInterval(() => this.update(), 100)
    }

    gameOver() {
        this.isPlaying = false
        clearInterval(this.gameLoop)
        this.titleEl.textContent = 'Game Over!'
        this.startBtn.textContent = 'Play Again'
        this.overlay.style.display = 'flex'

        if (this.score > this.highScore) {
            this.highScore = this.score
            localStorage.setItem('snakeHighScore', this.highScore)
        }
    }

    update() {
        // Move snake
        let headX = this.snake[0].x + this.velocity.x
        let headY = this.snake[0].y + this.velocity.y

        // Wall collision
        if (headX < 0 || headX >= this.tileCount || headY < 0 || headY >= this.tileCount) {
            return this.gameOver()
        }

        // Self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (this.snake[i].x === headX && this.snake[i].y === headY) {
                return this.gameOver()
            }
        }

        this.snake.unshift({ x: headX, y: headY })

        // Apple collision
        if (headX === this.apple.x && headY === this.apple.y) {
            this.score += 10
            this.updateScore()
            this.placeApple()
        } else {
            this.snake.pop()
        }

        this.draw()
    }

    draw() {
        // Clear background
        this.ctx.fillStyle = '#1e1e2e'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        // Draw apple
        this.ctx.fillStyle = '#ff5f57' // Red apple
        this.ctx.beginPath()
        this.ctx.arc(
            this.apple.x * this.gridSize + this.gridSize / 2,
            this.apple.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2.5,
            0,
            Math.PI * 2
        )
        this.ctx.fill()

        // Draw snake
        this.ctx.fillStyle = '#28c840' // Green snake
        for (let i = 0; i < this.snake.length; i++) {
            const part = this.snake[i]
            // Draw head slightly differently if desired, here we just use solid rects
            this.ctx.fillRect(
                part.x * this.gridSize + 1,
                part.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            )
        }
    }

    placeApple() {
        let newX, newY, isOnSnake
        do {
            newX = Math.floor(Math.random() * this.tileCount)
            newY = Math.floor(Math.random() * this.tileCount)
            isOnSnake = this.snake.some(part => part.x === newX && part.y === newY)
        } while (isOnSnake)

        this.apple = { x: newX, y: newY }
    }

    updateScore() {
        this.scoreEl.textContent = `Score: ${this.score} | High: ${this.highScore}`
    }

    handleKey(e) {
        // Only respond if our window is focused
        const activeWin = document.querySelector('.hyper-window.active')
        if (!activeWin || activeWin.id !== `window-${this.windowId}`) return

        if (!this.isPlaying) {
            if (e.key === 'Enter') this.startGame()
            return
        }

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (this.velocity.y !== 1) this.velocity = { x: 0, y: -1 }
                break
            case 'ArrowDown':
            case 's':
            case 'S':
                if (this.velocity.y !== -1) this.velocity = { x: 0, y: 1 }
                break
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.velocity.x !== 1) this.velocity = { x: -1, y: 0 }
                break
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.velocity.x !== -1) this.velocity = { x: 1, y: 0 }
                break
        }
    }

    onDestroy() {
        if (this.gameLoop) clearInterval(this.gameLoop)
        if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler)
    }
}
