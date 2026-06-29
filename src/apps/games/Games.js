import BaseApp from "../BaseApp.js";

export default class Games extends BaseApp {
  async setup() {
    this.container.innerHTML = `
            <div class="games-container">
                <div class="games-header">
                    <button class="games-back-btn" id="games-back-${this.windowId}" style="display:none;">◀ Back</button>
                    <span id="games-title-bar-${this.windowId}">Arcade</span>
                    <span class="games-score" id="games-score-${this.windowId}"></span>
                </div>

                <div class="games-menu" id="games-menu-${this.windowId}">
                    <h2>Select Game</h2>
                    <div class="games-menu-grid">
                        <button class="games-menu-btn" data-game="snake">
                            <span class="games-menu-icon">🐍</span>
                            Snake
                        </button>
                        <button class="games-menu-btn" data-game="pong">
                            <span class="games-menu-icon">🏓</span>
                            Pong
                        </button>
                    </div>
                </div>

                <div class="games-canvas-wrapper" id="games-wrapper-${this.windowId}" style="display:none;">
                    <canvas class="games-canvas" width="300" height="300"></canvas>
                </div>

                <div class="games-overlay" id="games-overlay-${this.windowId}" style="display:none;">
                    <h2 id="games-title-${this.windowId}">Snake</h2>
                    <button class="games-btn" id="games-start-${this.windowId}">Start Game</button>
                </div>
            </div>
        `;

    this.canvas = this.$(".games-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.scoreEl = this.$(`#games-score-${this.windowId}`);
    this.overlay = this.$(`#games-overlay-${this.windowId}`);
    this.titleEl = this.$(`#games-title-${this.windowId}`);
    this.startBtn = this.$(`#games-start-${this.windowId}`);

    this.menuEl = this.$(`#games-menu-${this.windowId}`);
    this.wrapperEl = this.$(`#games-wrapper-${this.windowId}`);
    this.backBtn = this.$(`#games-back-${this.windowId}`);
    this.titleBarEl = this.$(`#games-title-bar-${this.windowId}`);

    this.currentGame = null;
    this.gameLoop = null;
    this.isPlaying = false;

    // Snake specific state
    this.gridSize = 15;
    this.tileCount = 20; // 300 / 15
    this.snakeScore = 0;
    this.snakeHighScore = localStorage.getItem("snakeHighScore") || 0;
    this.snake = [];
    this.apple = { x: 15, y: 15 };
    this.velocity = { x: 0, y: 0 };

    // Pong specific state
    this.pongScore = { player: 0, ai: 0 };
    this.paddleWidth = 10;
    this.paddleHeight = 60;
    this.playerY = 120;
    this.aiY = 120;
    this.ball = { x: 150, y: 150, dx: 0, dy: 0, radius: 5 };
    this.pongPaddleSpeed = 6; // slightly faster paddle
    // Keystates for Pong
    this.keys = { up: false, down: false };

    this.startBtn.addEventListener("click", () => this.startGame());
    this.backBtn.addEventListener("click", () => this.showMenu());

    this.$$('.games-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            this.selectGame(btn.dataset.game);
        });
    });

    this.keyHandler = (e) => this.handleKey(e, true);
    this.keyUpHandler = (e) => this.handleKey(e, false);

    document.addEventListener("keydown", this.keyHandler);
    document.addEventListener("keyup", this.keyUpHandler);

    this.drawInitial();
  }

  showMenu() {
      this.currentGame = null;
      this.isPlaying = false;
      if (this.gameLoop) clearInterval(this.gameLoop);

      this.menuEl.style.display = "flex";
      this.wrapperEl.style.display = "none";
      this.overlay.style.display = "none";
      this.backBtn.style.display = "none";

      this.titleBarEl.textContent = "Arcade";
      this.scoreEl.textContent = "";
  }

  selectGame(game) {
      this.currentGame = game;
      this.menuEl.style.display = "none";
      this.wrapperEl.style.display = "flex";
      this.backBtn.style.display = "block";

      if (game === 'snake') {
          this.titleBarEl.textContent = "Snake";
          this.titleEl.textContent = "Snake";
          this.startBtn.textContent = "Start Game";
          this.updateScore();
      } else if (game === 'pong') {
          this.titleBarEl.textContent = "Pong";
          this.titleEl.textContent = "Pong";
          this.startBtn.textContent = "Start Game";
          this.updateScore();
      }

      this.drawInitial();
      this.overlay.style.display = "flex";
  }

  drawInitial() {
    this.ctx.fillStyle = "#1e1e2e";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  startGame() {
      this.isPlaying = true;
      this.overlay.style.display = "none";

      if (this.gameLoop) clearInterval(this.gameLoop);

      if (this.currentGame === 'snake') {
          this.startSnake();
          this.gameLoop = setInterval(() => this.updateSnake(), 100);
      } else if (this.currentGame === 'pong') {
          this.startPong();
          // Using requestAnimationFrame is better for Pong, but sticking to interval for consistency with original structure, just faster.
          this.gameLoop = setInterval(() => this.updatePong(), 1000/60);
      }
  }

  startSnake() {
    this.snake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    this.velocity = { x: 0, y: -1 }; // Start moving up
    this.snakeScore = 0;
    this.updateScore();
    this.placeApple();
  }

  startPong() {
      this.pongScore = { player: 0, ai: 0 };
      this.playerY = 120;
      this.aiY = 120;
      this.resetBall();
      this.updateScore();
  }

  resetBall() {
      this.ball.x = this.canvas.width / 2;
      this.ball.y = this.canvas.height / 2;
      this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 3;
      this.ball.dy = (Math.random() * 2 - 1) * 3;
  }

  gameOver() {
    this.isPlaying = false;
    clearInterval(this.gameLoop);
    this.titleEl.textContent = "Game Over!";
    this.startBtn.textContent = "Play Again";
    this.overlay.style.display = "flex";

    if (this.currentGame === 'snake' && this.snakeScore > this.snakeHighScore) {
      this.snakeHighScore = this.snakeScore;
      localStorage.setItem("snakeHighScore", this.snakeHighScore);
    }
  }

  updateSnake() {
    // Move snake
    let headX = this.snake[0].x + this.velocity.x;
    let headY = this.snake[0].y + this.velocity.y;

    // Wall collision
    if (
      headX < 0 ||
      headX >= this.tileCount ||
      headY < 0 ||
      headY >= this.tileCount
    ) {
      return this.gameOver();
    }

    // Self collision
    for (let i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === headX && this.snake[i].y === headY) {
        return this.gameOver();
      }
    }

    this.snake.unshift({ x: headX, y: headY });

    // Apple collision
    if (headX === this.apple.x && headY === this.apple.y) {
      this.snakeScore += 10;
      this.updateScore();
      this.placeApple();
    } else {
      this.snake.pop();
    }

    this.drawSnake();
  }

  updatePong() {
      // Player movement
      if (this.keys.up) this.playerY = Math.max(0, this.playerY - this.pongPaddleSpeed);
      if (this.keys.down) this.playerY = Math.min(this.canvas.height - this.paddleHeight, this.playerY + this.pongPaddleSpeed);

      // AI movement
      const aiCenter = this.aiY + this.paddleHeight / 2;
      if (aiCenter < this.ball.y - 10) {
          this.aiY = Math.min(this.canvas.height - this.paddleHeight, this.aiY + 3);
      } else if (aiCenter > this.ball.y + 10) {
          this.aiY = Math.max(0, this.aiY - 3);
      }

      // Ball movement
      this.ball.x += this.ball.dx;
      this.ball.y += this.ball.dy;

      // Top/bottom collision
      if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.canvas.height) {
          this.ball.dy *= -1;
          // snap back to bounds to prevent sticking
          this.ball.y = this.ball.y - this.ball.radius <= 0 ? this.ball.radius + 1 : this.canvas.height - this.ball.radius - 1;
      }

      // Paddle collision
      if (this.ball.dx < 0) { // Moving left
          if (this.ball.x - this.ball.radius <= this.paddleWidth &&
              this.ball.y >= this.playerY &&
              this.ball.y <= this.playerY + this.paddleHeight) {
              this.ball.dx *= -1.1; // speed up slightly
              this.ball.dy += (this.ball.y - (this.playerY + this.paddleHeight/2)) * 0.1;
              this.ball.x = this.paddleWidth + this.ball.radius + 1; // prevent sticking
          }
      } else { // Moving right
          if (this.ball.x + this.ball.radius >= this.canvas.width - this.paddleWidth &&
              this.ball.y >= this.aiY &&
              this.ball.y <= this.aiY + this.paddleHeight) {
              this.ball.dx *= -1.1;
              this.ball.dy += (this.ball.y - (this.aiY + this.paddleHeight/2)) * 0.1;
              this.ball.x = this.canvas.width - this.paddleWidth - this.ball.radius - 1;
          }
      }

      // Scoring
      if (this.ball.x < 0) {
          this.pongScore.ai++;
          this.updateScore();
          this.checkPongWin();
      } else if (this.ball.x > this.canvas.width) {
          this.pongScore.player++;
          this.updateScore();
          this.checkPongWin();
      }

      this.drawPong();
  }

  checkPongWin() {
      if (this.pongScore.player >= 5 || this.pongScore.ai >= 5) {
          this.gameOver();
          this.titleEl.textContent = this.pongScore.player >= 5 ? "You Win!" : "AI Wins!";
      } else {
          this.resetBall();
      }
  }

  drawSnake() {
    // Clear background
    this.ctx.fillStyle = "#1e1e2e";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw apple
    this.ctx.fillStyle = "#ff5f57"; // Red apple
    this.ctx.beginPath();
    this.ctx.arc(
      this.apple.x * this.gridSize + this.gridSize / 2,
      this.apple.y * this.gridSize + this.gridSize / 2,
      this.gridSize / 2.5,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();

    // Draw snake
    this.ctx.fillStyle = "#28c840"; // Green snake
    for (let i = 0; i < this.snake.length; i++) {
      const part = this.snake[i];
      // Draw head slightly differently if desired, here we just use solid rects
      this.ctx.fillRect(
        part.x * this.gridSize + 1,
        part.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2,
      );
    }
  }

  drawPong() {
      // Clear background
      this.ctx.fillStyle = "#1e1e2e";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw center line
      this.ctx.setLineDash([5, 15]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.canvas.width / 2, 0);
      this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Draw player paddle
      this.ctx.fillStyle = "#00f5ff";
      this.ctx.fillRect(0, this.playerY, this.paddleWidth, this.paddleHeight);

      // Draw AI paddle
      this.ctx.fillStyle = "#ff5f57";
      this.ctx.fillRect(this.canvas.width - this.paddleWidth, this.aiY, this.paddleWidth, this.paddleHeight);

      // Draw ball
      this.ctx.fillStyle = "#fff";
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
  }

  placeApple() {
    let newX, newY, isOnSnake;
    do {
      newX = Math.floor(Math.random() * this.tileCount);
      newY = Math.floor(Math.random() * this.tileCount);
      isOnSnake = this.snake.some((part) => part.x === newX && part.y === newY);
    } while (isOnSnake);

    this.apple = { x: newX, y: newY };
  }

  updateScore() {
      if (this.currentGame === 'snake') {
        this.scoreEl.textContent = `Score: ${this.snakeScore} | High: ${this.snakeHighScore}`;
      } else if (this.currentGame === 'pong') {
        this.scoreEl.textContent = `You: ${this.pongScore.player} | AI: ${this.pongScore.ai}`;
      } else {
        this.scoreEl.textContent = "";
      }
  }

  handleKey(e, isDown) {
    // Only respond if our window is focused
    const activeWin = document.querySelector(".hyper-window.active");
    if (!activeWin || activeWin.id !== `window-${this.windowId}`) return;

    if (!this.isPlaying) {
      if (e.key === "Enter" && isDown && this.currentGame) this.startGame();
      return;
    }

    if (this.currentGame === 'snake' && isDown) {
        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "W":
            if (this.velocity.y !== 1) this.velocity = { x: 0, y: -1 };
            break;
          case "ArrowDown":
          case "s":
          case "S":
            if (this.velocity.y !== -1) this.velocity = { x: 0, y: 1 };
            break;
          case "ArrowLeft":
          case "a":
          case "A":
            if (this.velocity.x !== 1) this.velocity = { x: -1, y: 0 };
            break;
          case "ArrowRight":
          case "d":
          case "D":
            if (this.velocity.x !== -1) this.velocity = { x: 1, y: 0 };
            break;
        }
    } else if (this.currentGame === 'pong') {
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") this.keys.up = isDown;
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") this.keys.down = isDown;
    }
  }

  onDestroy() {
    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.keyHandler) document.removeEventListener("keydown", this.keyHandler);
    if (this.keyUpHandler) document.removeEventListener("keyup", this.keyUpHandler);
  }
}
