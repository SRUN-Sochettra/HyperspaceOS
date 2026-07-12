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

                        <button class="games-menu-btn" data-game="flappy">
                            <span class="games-menu-icon">🐦</span>
                            Flappy
                        </button>
                        <button class="games-menu-btn" data-game="tetris">
                            <span class="games-menu-icon">🧩</span>
                            Tetris
                        </button>
                        <button class="games-menu-btn" data-game="2048">
                            <span class="games-menu-icon">🔢</span>
                            2048
                        </button>
                        <button class="games-menu-btn" data-game="minesweeper">
                            <span class="games-menu-icon">💣</span>
                            Minesweeper
                        </button>
                        <button class="games-menu-btn" data-game="tictactoe">
                            <span class="games-menu-icon">❌</span>
                            Tic-Tac-Toe
                        </button>
                        <button class="games-menu-btn" data-game="breakout">
                            <span class="games-menu-icon">🧱</span>
                            Breakout
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


    // Flappy Bird specific state
    this.flappyScore = 0;
    this.flappyHighScore = localStorage.getItem("flappyHighScore") || 0;

    // 2048 specific state
    this.score2048 = 0;
    this.highScore2048 = localStorage.getItem("highScore2048") || 0;
    this.grid2048 = [];
    this.size2048 = 4;
    this.cell2048Size = 65;
    this.cell2048Gap = 8;
    this.bird = { y: 150, velocity: 0, gravity: 0.6, jump: -8, radius: 8 };
    this.pipes = [];
    this.pipeWidth = 40;
    this.pipeGap = 100;
    this.pipeSpeed = 3;
    this.frames = 0;

    // Minesweeper specific state
    this.minesScore = 0;
    this.minesHighScore = localStorage.getItem("minesHighScore") || 0;
    this.minesCols = 10;
    this.minesRows = 10;
    this.minesCount = 10;
    this.minesGrid = [];
    this.minesCellSize = 30;

    // Breakout specific state
    this.breakoutScore = 0;
    this.breakoutHighScore = localStorage.getItem("breakoutHighScore") || 0;
    this.breakoutPaddle = { x: 110, width: 80, height: 10 };
    this.breakoutBall = { x: 150, y: 250, dx: 3, dy: -3, radius: 5 };
    this.breakoutBricks = [];
    this.breakoutKeys = { left: false, right: false };



    // Tic-Tac-Toe specific state
    this.tttBoard = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];
    this.tttCurrentPlayer = 'X';
    this.tttWinner = null;
    this.tttScore = { X: 0, O: 0, Ties: 0 };

    // Tetris specific state
    this.tetrisGrid = [];
    this.tetrisScore = 0;
    this.tetrisHighScore = localStorage.getItem("tetrisHighScore") || 0;
    this.tetrisPiece = null;
    this.tetrisX = 0;
    this.tetrisY = 0;
    this.tetrisDropInterval = 500;
    this.tetrisCols = 10;
    this.tetrisRows = 20;
    this.tetrisBlockSize = this.canvas.width / this.tetrisCols; // 300 / 10 = 30
    this.tetrisShapes = [
      [[1,1,1,1]], // I
      [[1,1],[1,1]], // O
      [[0,1,0],[1,1,1]], // T
      [[1,0,0],[1,1,1]], // L
      [[0,0,1],[1,1,1]], // J
      [[0,1,1],[1,1,0]], // S
      [[1,1,0],[0,1,1]]  // Z
    ];
    this.tetrisColors = [
      '#00ffff', // I - cyan
      '#ffff00', // O - yellow
      '#800080', // T - purple
      '#ffa500', // L - orange
      '#0000ff', // J - blue
      '#00ff00', // S - green
      '#ff0000'  // Z - red
    ];

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

    this.clickHandler = (e) => this.handleMouseClick(e, false);
    this.rightClickHandler = (e) => this.handleMouseClick(e, true);
    this.canvas.addEventListener("click", this.clickHandler);
    this.contextMenuHandler = (e) => {
      if (this.currentGame === 'minesweeper' && this.isPlaying) {
        e.preventDefault();
        this.rightClickHandler(e);
      }
    };
    this.canvas.addEventListener("contextmenu", this.contextMenuHandler);

    this.listen("games:start", (gameName) => {
        this.selectGame(gameName);
    });

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
      } else if (game === 'flappy') {
          this.titleBarEl.textContent = "Flappy Bird";
          this.titleEl.textContent = "Flappy Bird";
          this.startBtn.textContent = "Start Game";
          this.updateScore();
      } else if (game === 'tetris') {
          this.titleBarEl.textContent = "Tetris";
          this.titleEl.textContent = "Tetris";
          this.startBtn.textContent = "Start Game";
          this.updateScore();
      } else if (game === '2048') {
          this.titleBarEl.textContent = "2048";
          this.titleEl.textContent = "2048";
          this.startBtn.textContent = "Start Game";
          this.updateScore();
      } else if (game === 'minesweeper') {
          this.titleBarEl.textContent = "Minesweeper";
          this.titleEl.textContent = "Minesweeper";
          this.startBtn.textContent = "Start Game";
          this.updateScore();
      } else if (game === 'tictactoe') {
          this.titleBarEl.textContent = "Tic Tac Toe";
          this.titleEl.textContent = "Tic Tac Toe";
          this.startBtn.textContent = "Start Game";
          this.updateScore();
      } else if (game === 'breakout') {
          this.titleBarEl.textContent = "Breakout";
          this.titleEl.textContent = "Breakout";
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
      } else if (this.currentGame === 'tictactoe') {
          this.startTicTacToe();
      } else if (this.currentGame === 'breakout') {
          this.startBreakout();
          this.gameLoop = setInterval(() => this.updateBreakout(), 1000/60);
      } else if (this.currentGame === 'pong') {
          this.startPong();
          this.gameLoop = setInterval(() => this.updatePong(), 1000/60);
      } else if (this.currentGame === 'flappy') {
          this.startFlappy();
          this.gameLoop = setInterval(() => this.updateFlappy(), 1000/60);
      } else if (this.currentGame === 'tetris') {
          this.startTetris();
          this.gameLoop = setInterval(() => this.updateTetris(), this.tetrisDropInterval);
      } else if (this.currentGame === '2048') {
          this.start2048();
      } else if (this.currentGame === 'minesweeper') {
          this.startMinesweeper();
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
    } else if (this.currentGame === 'flappy' && this.flappyScore > this.flappyHighScore) {
      this.flappyHighScore = this.flappyScore;
      localStorage.setItem("flappyHighScore", this.flappyHighScore);
    } else if (this.currentGame === '2048' && this.score2048 > this.highScore2048) {
      this.highScore2048 = this.score2048;
      localStorage.setItem("highScore2048", this.highScore2048);
    } else if (this.currentGame === 'tetris' && this.tetrisScore > this.tetrisHighScore) {
      this.tetrisHighScore = this.tetrisScore;
      localStorage.setItem("tetrisHighScore", this.tetrisHighScore);
    } else if (this.currentGame === 'breakout' && this.breakoutScore > this.breakoutHighScore) {
      this.breakoutHighScore = this.breakoutScore;
      localStorage.setItem("breakoutHighScore", this.breakoutHighScore);
    } else if (this.currentGame === 'minesweeper' && this.minesScore > this.minesHighScore) {
      this.minesHighScore = this.minesScore;
      localStorage.setItem("minesHighScore", this.minesHighScore);
    }
  }


  updateBreakout() {
      // Move paddle
      if (this.breakoutKeys.right && this.breakoutPaddle.x < this.canvas.width - this.breakoutPaddle.width) {
          this.breakoutPaddle.x += 7;
      } else if (this.breakoutKeys.left && this.breakoutPaddle.x > 0) {
          this.breakoutPaddle.x -= 7;
      }

      this.breakoutBall.x += this.breakoutBall.dx;
      this.breakoutBall.y += this.breakoutBall.dy;

      // Wall collision
      if (this.breakoutBall.x + this.breakoutBall.dx > this.canvas.width - this.breakoutBall.radius || this.breakoutBall.x + this.breakoutBall.dx < this.breakoutBall.radius) {
          this.breakoutBall.dx = -this.breakoutBall.dx;
      }
      if (this.breakoutBall.y + this.breakoutBall.dy < this.breakoutBall.radius) {
          this.breakoutBall.dy = -this.breakoutBall.dy;
      } else if (this.breakoutBall.y + this.breakoutBall.dy > this.canvas.height - this.breakoutBall.radius) {
          if (this.breakoutBall.x > this.breakoutPaddle.x && this.breakoutBall.x < this.breakoutPaddle.x + this.breakoutPaddle.width) {
              this.breakoutBall.dy = -this.breakoutBall.dy;
          } else {
              this.gameOver();
              return;
          }
      }

      // Brick collision
      let win = true;
      for (let c = 0; c < this.breakoutBricks.length; c++) {
          for (let r = 0; r < this.breakoutBricks[c].length; r++) {
              let b = this.breakoutBricks[c][r];
              if (b.status === 1) {
                  win = false;
                  if (this.breakoutBall.x > b.x && this.breakoutBall.x < b.x + 40 && this.breakoutBall.y > b.y && this.breakoutBall.y < b.y + 15) {
                      this.breakoutBall.dy = -this.breakoutBall.dy;
                      b.status = 0;
                      this.breakoutScore++;
                      this.updateScore();
                  }
              }
          }
      }

      if (win) {
          this.gameOver();
      }

      this.drawBreakout();
  }

  drawBreakout() {
      this.ctx.fillStyle = "#1e1e2e";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw bricks
      for (let c = 0; c < this.breakoutBricks.length; c++) {
          for (let r = 0; r < this.breakoutBricks[c].length; r++) {
              if (this.breakoutBricks[c][r].status === 1) {
                  let b = this.breakoutBricks[c][r];
                  this.ctx.fillStyle = ["#ff5f57", "#fab387", "#f9e2af", "#a6e3a1", "#89b4fa"][r];
                  this.ctx.fillRect(b.x, b.y, 40, 15);
              }
          }
      }

      // Draw paddle
      this.ctx.fillStyle = "#00f5ff";
      this.ctx.fillRect(this.breakoutPaddle.x, this.canvas.height - this.breakoutPaddle.height - 10, this.breakoutPaddle.width, this.breakoutPaddle.height);

      // Draw ball
      this.ctx.fillStyle = "#fff";
      this.ctx.beginPath();
      this.ctx.arc(this.breakoutBall.x, this.breakoutBall.y, this.breakoutBall.radius, 0, Math.PI * 2);
      this.ctx.fill();
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


  // ---- TETRIS MECHANICS ----
  start2048() {
      this.score2048 = 0;
      this.grid2048 = Array(this.size2048).fill().map(() => Array(this.size2048).fill(0));
      this.spawnTile2048();
      this.spawnTile2048();
      this.updateScore();
      this.draw2048();
  }

  spawnTile2048() {
      let emptyCells = [];
      for (let r = 0; r < this.size2048; r++) {
          for (let c = 0; c < this.size2048; c++) {
              if (this.grid2048[r][c] === 0) {
                  emptyCells.push({ r, c });
              }
          }
      }
      if (emptyCells.length > 0) {
          let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
          this.grid2048[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
      }
  }

  draw2048() {
      // Clear background
      this.ctx.fillStyle = "#bbada0";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const offset = (this.canvas.width - (this.size2048 * this.cell2048Size + (this.size2048 + 1) * this.cell2048Gap)) / 2;

      for (let r = 0; r < this.size2048; r++) {
          for (let c = 0; c < this.size2048; c++) {
              let val = this.grid2048[r][c];
              let x = offset + this.cell2048Gap + c * (this.cell2048Size + this.cell2048Gap);
              let y = offset + this.cell2048Gap + r * (this.cell2048Size + this.cell2048Gap);

              this.ctx.fillStyle = this.get2048Color(val);
              this.ctx.beginPath();
              this.ctx.roundRect(x, y, this.cell2048Size, this.cell2048Size, 4);
              this.ctx.fill();

              if (val !== 0) {
                  this.ctx.fillStyle = val <= 4 ? "#776e65" : "#f9f6f2";
                  this.ctx.font = "bold " + (val >= 1000 ? "20px" : val >= 100 ? "24px" : "32px") + " Arial";
                  this.ctx.textAlign = "center";
                  this.ctx.textBaseline = "middle";
                  this.ctx.fillText(val, x + this.cell2048Size / 2, y + this.cell2048Size / 2 + 2);
              }
          }
      }
  }

  get2048Color(val) {
      const colors = {
          0: "#cdc1b4",
          2: "#eee4da",
          4: "#ede0c8",
          8: "#f2b179",
          16: "#f59563",
          32: "#f67c5f",
          64: "#f65e3b",
          128: "#edcf72",
          256: "#edcc61",
          512: "#edc850",
          1024: "#edc53f",
          2048: "#edc22e"
      };
      return colors[val] || "#3c3a32";
  }

  move2048(direction) {
      let moved = false;
      let newGrid = JSON.parse(JSON.stringify(this.grid2048));

      const slide = (row) => {
          let arr = row.filter(val => val);
          let missing = this.size2048 - arr.length;
          let zeros = Array(missing).fill(0);
          return arr.concat(zeros);
      };

      const combine = (row) => {
          for (let i = 0; i < this.size2048 - 1; i++) {
              if (row[i] !== 0 && row[i] === row[i + 1]) {
                  row[i] *= 2;
                  this.score2048 += row[i];
                  row[i + 1] = 0;
              }
          }
          return row;
      };

      for (let i = 0; i < this.size2048; i++) {
          let row = [];
          if (direction === 'Left' || direction === 'Right') {
              row = newGrid[i];
          } else {
              for (let j = 0; j < this.size2048; j++) row.push(newGrid[j][i]);
          }

          if (direction === 'Right' || direction === 'Down') row.reverse();

          let slided = slide(row);
          let combined = combine(slided);
          let slidedAgain = slide(combined);

          if (direction === 'Right' || direction === 'Down') slidedAgain.reverse();

          for (let j = 0; j < this.size2048; j++) {
              if (direction === 'Left' || direction === 'Right') {
                  if (newGrid[i][j] !== slidedAgain[j]) moved = true;
                  newGrid[i][j] = slidedAgain[j];
              } else {
                  if (newGrid[j][i] !== slidedAgain[j]) moved = true;
                  newGrid[j][i] = slidedAgain[j];
              }
          }
      }

      if (moved) {
          this.grid2048 = newGrid;
          this.spawnTile2048();
          this.draw2048();
          this.updateScore();
          if (this.check2048GameOver()) {
              this.gameOver();
          }
      }
  }

  check2048GameOver() {
      for (let r = 0; r < this.size2048; r++) {
          for (let c = 0; c < this.size2048; c++) {
              if (this.grid2048[r][c] === 0) return false;
              if (c !== this.size2048 - 1 && this.grid2048[r][c] === this.grid2048[r][c + 1]) return false;
              if (r !== this.size2048 - 1 && this.grid2048[r][c] === this.grid2048[r + 1][c]) return false;
          }
      }
      return true;
  }


  startFlappy() {
      this.flappyScore = 0;
      this.bird.y = 150;
      this.bird.velocity = 0;
      this.pipes = [];
      this.frames = 0;
      this.updateScore();
  }

  startTetris() {
      this.tetrisScore = 0;
      this.tetrisDropInterval = 500;
      this.updateScore();

      // Initialize empty grid
      this.tetrisGrid = Array(this.tetrisRows).fill().map(() => Array(this.tetrisCols).fill(0));

      this.spawnTetrisPiece();
      this.drawTetris();
  }

  spawnTetrisPiece() {
      const typeId = Math.floor(Math.random() * this.tetrisShapes.length);
      const shape = this.tetrisShapes[typeId];
      this.tetrisPiece = {
          shape: shape,
          color: this.tetrisColors[typeId],
          typeId: typeId + 1 // >0 so it's truthy in grid
      };

      // Center piece at top
      this.tetrisX = Math.floor(this.tetrisCols / 2) - Math.floor(shape[0].length / 2);
      this.tetrisY = 0;

      // If collision on spawn, game over
      if (this.checkTetrisCollision(this.tetrisX, this.tetrisY, this.tetrisPiece.shape)) {
          this.gameOver();
      }
  }


  updateFlappy() {
      this.frames++;

      // Bird physics
      this.bird.velocity += this.bird.gravity;
      this.bird.y += this.bird.velocity;

      // Floor collision
      if (this.bird.y + this.bird.radius >= this.canvas.height) {
          this.gameOver();
      }

      // Ceiling collision
      if (this.bird.y - this.bird.radius <= 0) {
          this.bird.y = this.bird.radius;
          this.bird.velocity = 0;
      }

      // Pipes generation
      if (this.frames % 70 === 0) {
          const minHeight = 40;
          const maxHeight = this.canvas.height - this.pipeGap - minHeight;
          const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);

          this.pipes.push({
              x: this.canvas.width,
              top: topHeight,
              bottom: this.canvas.height - (topHeight + this.pipeGap),
              passed: false
          });
      }

      // Update pipes and check collisions
      for (let i = 0; i < this.pipes.length; i++) {
          let p = this.pipes[i];
          p.x -= this.pipeSpeed;

          // Collision detection
          // Bird bounding box approximation
          let birdLeft = 50 - this.bird.radius;
          let birdRight = 50 + this.bird.radius;
          let birdTop = this.bird.y - this.bird.radius;
          let birdBottom = this.bird.y + this.bird.radius;

          if (
              birdRight > p.x &&
              birdLeft < p.x + this.pipeWidth &&
              (birdTop < p.top || birdBottom > this.canvas.height - p.bottom)
          ) {
              this.gameOver();
          }

          // Score update
          if (p.x + this.pipeWidth < birdLeft && !p.passed) {
              this.flappyScore++;
              this.updateScore();
              p.passed = true;
          }

          // Remove off-screen pipes
          if (p.x + this.pipeWidth < 0) {
              this.pipes.shift();
              i--;
          }
      }

      this.drawFlappy();
  }

  drawFlappy() {
      // Clear background
      this.ctx.fillStyle = "#70c5ce"; // Sky blue
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw pipes
      this.ctx.fillStyle = "#73bf2e"; // Pipe green
      for (let i = 0; i < this.pipes.length; i++) {
          let p = this.pipes[i];
          // Top pipe
          this.ctx.fillRect(p.x, 0, this.pipeWidth, p.top);
          // Bottom pipe
          this.ctx.fillRect(p.x, this.canvas.height - p.bottom, this.pipeWidth, p.bottom);
      }

      // Draw bird
      this.ctx.fillStyle = "#f2b705"; // Bird yellow
      this.ctx.beginPath();
      this.ctx.arc(50, this.bird.y, this.bird.radius, 0, Math.PI * 2);
      this.ctx.fill();
  }


  // ---- MINESWEEPER MECHANICS ----
  startMinesweeper() {
      this.minesScore = 0;
      this.minesGrid = [];
      for (let y = 0; y < this.minesRows; y++) {
          this.minesGrid[y] = [];
          for (let x = 0; x < this.minesCols; x++) {
              this.minesGrid[y][x] = {
                  isMine: false,
                  isRevealed: false,
                  isFlagged: false,
                  neighborMines: 0
              };
          }
      }
      let minesPlaced = 0;
      while (minesPlaced < this.minesCount) {
          const rx = Math.floor(Math.random() * this.minesCols);
          const ry = Math.floor(Math.random() * this.minesRows);
          if (!this.minesGrid[ry][rx].isMine) {
              this.minesGrid[ry][rx].isMine = true;
              minesPlaced++;
          }
      }
      for (let y = 0; y < this.minesRows; y++) {
          for (let x = 0; x < this.minesCols; x++) {
              if (!this.minesGrid[y][x].isMine) {
                  let count = 0;
                  for (let dy = -1; dy <= 1; dy++) {
                      for (let dx = -1; dx <= 1; dx++) {
                          if (dy === 0 && dx === 0) continue;
                          const ny = y + dy;
                          const nx = x + dx;
                          if (ny >= 0 && ny < this.minesRows && nx >= 0 && nx < this.minesCols) {
                              if (this.minesGrid[ny][nx].isMine) count++;
                          }
                      }
                  }
                  this.minesGrid[y][x].neighborMines = count;
              }
          }
      }
      this.updateScore();
      this.drawMinesweeper();
  }

  startBreakout() {
      this.breakoutScore = 0;
      this.breakoutPaddle.x = (this.canvas.width - this.breakoutPaddle.width) / 2;
      this.breakoutBall.x = this.canvas.width / 2;
      this.breakoutBall.y = this.canvas.height - 30;
      this.breakoutBall.dx = 3;
      this.breakoutBall.dy = -3;
      this.breakoutKeys = { left: false, right: false };

      this.breakoutBricks = [];
      const brickRowCount = 5;
      const brickColumnCount = 6;
      const brickWidth = 40;
      const brickHeight = 15;
      const brickPadding = 5;
      const brickOffsetTop = 30;
      const brickOffsetLeft = 18;

      for(let c = 0; c < brickColumnCount; c++) {
          this.breakoutBricks[c] = [];
          for(let r = 0; r < brickRowCount; r++) {
              this.breakoutBricks[c][r] = { x: 0, y: 0, status: 1 };
              const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
              const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
              this.breakoutBricks[c][r].x = brickX;
              this.breakoutBricks[c][r].y = brickY;
          }
      }
      this.updateScore();
  }


  handleMouseClick(e, isRightClick) {
      if (!this.isPlaying || (this.currentGame !== 'minesweeper' && this.currentGame !== 'tictactoe')) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / this.minesCellSize);
      const row = Math.floor(y / this.minesCellSize);
      if (row < 0 || row >= this.minesRows || col < 0 || col >= this.minesCols) return;

      if (this.currentGame === 'tictactoe') {
          this.handleTicTacToeClick(x, y);
          return;
      }

      const cell = this.minesGrid[row][col];
      if (isRightClick) {
          if (!cell.isRevealed) {
              cell.isFlagged = !cell.isFlagged;
              this.drawMinesweeper();
          }
      } else {
          if (!cell.isFlagged && !cell.isRevealed) {
              if (cell.isMine) {
                  cell.isRevealed = true;
                  this.drawMinesweeper();
                  this.gameOver();
              } else {
                  this.revealMinesweeper(row, col);
                  this.drawMinesweeper();
                  this.checkMinesweeperWin();
              }
          }
      }
  }

  revealMinesweeper(row, col) {
      if (row < 0 || row >= this.minesRows || col < 0 || col >= this.minesCols) return;
      const cell = this.minesGrid[row][col];
      if (cell.isRevealed || cell.isFlagged) return;
      cell.isRevealed = true;
      this.minesScore += 10;
      this.updateScore();
      if (cell.neighborMines === 0) {
          for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                  if (dy !== 0 || dx !== 0) this.revealMinesweeper(row + dy, col + dx);
              }
          }
      }
  }

  checkMinesweeperWin() {
      let win = true;
      for (let y = 0; y < this.minesRows; y++) {
          for (let x = 0; x < this.minesCols; x++) {
              if (!this.minesGrid[y][x].isMine && !this.minesGrid[y][x].isRevealed) win = false;
          }
      }
      if (win) this.gameOver();
  }

  drawMinesweeper() {
      this.ctx.fillStyle = "#1e1e2e";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      for (let y = 0; y < this.minesRows; y++) {
          for (let x = 0; x < this.minesCols; x++) {
              const cell = this.minesGrid[y][x];
              const px = x * this.minesCellSize;
              const py = y * this.minesCellSize;
              if (!cell.isRevealed) {
                  this.ctx.fillStyle = "#313244";
                  this.ctx.fillRect(px, py, this.minesCellSize - 1, this.minesCellSize - 1);
                  if (cell.isFlagged) {
                      this.ctx.fillStyle = "#ff5f57";
                      this.ctx.font = "16px Arial";
                      this.ctx.fillText("🚩", px + 4, py + 22);
                  }
              } else {
                  this.ctx.fillStyle = "#181825";
                  this.ctx.fillRect(px, py, this.minesCellSize - 1, this.minesCellSize - 1);
                  if (cell.isMine) {
                      this.ctx.fillStyle = "#ff5f57";
                      this.ctx.font = "16px Arial";
                      this.ctx.fillText("💣", px + 4, py + 22);
                  } else if (cell.neighborMines > 0) {
                      this.ctx.fillStyle = ["#89b4fa", "#a6e3a1", "#f9e2af", "#fab387", "#f38ba8", "#cba6f7", "#f5c2e7", "#b4befe"][cell.neighborMines - 1];
                      this.ctx.font = "bold 18px Arial";
                      this.ctx.fillText(cell.neighborMines, px + 10, py + 22);
                  }
              }
          }
      }
  }

  updateTetris() {
      // Move down automatically
      if (!this.checkTetrisCollision(this.tetrisX, this.tetrisY + 1, this.tetrisPiece.shape)) {
          this.tetrisY++;
      } else {
          // Lock piece
          this.lockTetrisPiece();
          this.clearTetrisLines();
          if (this.isPlaying) {
              this.spawnTetrisPiece();
          }
      }
      this.drawTetris();
  }

  lockTetrisPiece() {
      const shape = this.tetrisPiece.shape;
      for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
              if (shape[y][x]) {
                  this.tetrisGrid[this.tetrisY + y][this.tetrisX + x] = this.tetrisPiece.typeId;
              }
          }
      }
  }

  clearTetrisLines() {
      let linesCleared = 0;

      for (let y = this.tetrisRows - 1; y >= 0; y--) {
          let isFull = true;
          for (let x = 0; x < this.tetrisCols; x++) {
              if (this.tetrisGrid[y][x] === 0) {
                  isFull = false;
                  break;
              }
          }

          if (isFull) {
              // Remove line
              this.tetrisGrid.splice(y, 1);
              // Add empty line at top
              this.tetrisGrid.unshift(Array(this.tetrisCols).fill(0));
              linesCleared++;
              y++; // check same row index again since everything shifted down
          }
      }

      if (linesCleared > 0) {
          // Increase score based on lines cleared (100, 300, 500, 800)
          const scores = [0, 100, 300, 500, 800];
          this.tetrisScore += scores[linesCleared];

          // Speed up slightly
          if (this.tetrisDropInterval > 100) {
              this.tetrisDropInterval -= 10 * linesCleared;
              clearInterval(this.gameLoop);
              this.gameLoop = setInterval(() => this.updateTetris(), this.tetrisDropInterval);
          }

          this.updateScore();
      }
  }

  checkTetrisCollision(newX, newY, shape) {
      for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
              if (shape[y][x]) {
                  const targetX = newX + x;
                  const targetY = newY + y;

                  // Out of bounds horizontally
                  if (targetX < 0 || targetX >= this.tetrisCols) return true;
                  // Out of bounds vertically (bottom)
                  if (targetY >= this.tetrisRows) return true;
                  // Collision with existing blocks
                  if (targetY >= 0 && this.tetrisGrid[targetY][targetX] !== 0) return true;
              }
          }
      }
      return false;
  }

  rotateTetrisPiece() {
      if (!this.tetrisPiece) return;

      const shape = this.tetrisPiece.shape;
      // Transpose & reverse rows for 90deg clockwise rotation
      const newShape = shape[0].map((val, index) => shape.map(row => row[index]).reverse());

      // If rotated piece collides, try wall kicking or cancel rotation
      let kickX = 0;
      if (this.checkTetrisCollision(this.tetrisX, this.tetrisY, newShape)) {
          // Simple wall kick: try moving left or right by 1
          if (!this.checkTetrisCollision(this.tetrisX + 1, this.tetrisY, newShape)) kickX = 1;
          else if (!this.checkTetrisCollision(this.tetrisX - 1, this.tetrisY, newShape)) kickX = -1;
          else return; // Cannot rotate
      }

      this.tetrisX += kickX;
      this.tetrisPiece.shape = newShape;
      this.drawTetris();
  }

  moveTetrisPiece(dx, dy) {
      if (!this.checkTetrisCollision(this.tetrisX + dx, this.tetrisY + dy, this.tetrisPiece.shape)) {
          this.tetrisX += dx;
          this.tetrisY += dy;
          this.drawTetris();
          return true;
      }
      return false;
  }

  drawTetris() {
      // Clear background
      this.ctx.fillStyle = "#1e1e2e";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw Grid (existing locked pieces)
      for (let y = 0; y < this.tetrisRows; y++) {
          for (let x = 0; x < this.tetrisCols; x++) {
              const typeId = this.tetrisGrid[y][x];
              if (typeId !== 0) {
                  this.drawTetrisBlock(x, y, this.tetrisColors[typeId - 1]);
              }
          }
      }

      // Draw falling piece
      if (this.tetrisPiece) {
          const shape = this.tetrisPiece.shape;
          for (let y = 0; y < shape.length; y++) {
              for (let x = 0; x < shape[y].length; x++) {
                  if (shape[y][x]) {
                      this.drawTetrisBlock(this.tetrisX + x, this.tetrisY + y, this.tetrisPiece.color);
                  }
              }
          }
      }
  }

  drawTetrisBlock(x, y, color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x * this.tetrisBlockSize + 1, y * this.tetrisBlockSize + 1, this.tetrisBlockSize - 2, this.tetrisBlockSize - 2);
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
      } else if (this.currentGame === 'tetris') {
        this.scoreEl.textContent = `Score: ${this.tetrisScore} | High: ${this.tetrisHighScore}`;
      } else if (this.currentGame === '2048') {
        this.scoreEl.textContent = `Score: ${this.score2048} | High: ${this.highScore2048}`;
      } else if (this.currentGame === 'flappy') {
        this.scoreEl.textContent = `Score: ${this.flappyScore} | High: ${this.flappyHighScore}`;
      } else if (this.currentGame === 'minesweeper') {
        this.scoreEl.textContent = `Score: ${this.minesScore} | High: ${this.minesHighScore}`;
      } else if (this.currentGame === 'tictactoe') {
        this.scoreEl.textContent = `X: ${this.tttScore.X} | O: ${this.tttScore.O} | Ties: ${this.tttScore.Ties}`;
      } else if (this.currentGame === 'breakout') {
        this.scoreEl.textContent = `Score: ${this.breakoutScore} | High: ${this.breakoutHighScore}`;
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

    } else if (this.currentGame === 'breakout') {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.breakoutKeys.left = isDown;
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.breakoutKeys.right = isDown;
    } else if (this.currentGame === 'pong') {
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") this.keys.up = isDown;
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") this.keys.down = isDown;
    } else if (this.currentGame === 'flappy' && isDown) {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            this.bird.velocity = this.bird.jump;
        }
    } else if (this.currentGame === 'tetris' && isDown) {
        switch (e.key) {
          case "ArrowLeft":
          case "a":
          case "A":
            this.moveTetrisPiece(-1, 0);
            break;
          case "ArrowRight":
          case "d":
          case "D":
            this.moveTetrisPiece(1, 0);
            break;
          case "ArrowDown":
          case "s":
          case "S":
            this.moveTetrisPiece(0, 1);
            break;
          case "ArrowUp":
          case "w":
          case "W":
            this.rotateTetrisPiece();
            break;
          case " ":
            e.preventDefault();
            while (this.moveTetrisPiece(0, 1)) {}
            break;
        }
    } else if (this.currentGame === '2048' && isDown) {
        switch (e.key) {
          case "ArrowLeft":
          case "a":
          case "A":
            this.move2048('Left');
            break;
          case "ArrowRight":
          case "d":
          case "D":
            this.move2048('Right');
            break;
          case "ArrowUp":
          case "w":
          case "W":
            this.move2048('Up');
            break;
          case "ArrowDown":
          case "s":
          case "S":
            this.move2048('Down');
            break;
        }
    }
  }


  // ---- TIC-TAC-TOE MECHANICS ----
  startTicTacToe() {
      this.resetTicTacToe();
  }

  resetTicTacToe() {
      this.tttBoard = [
          ['', '', ''],
          ['', '', ''],
          ['', '', '']
      ];
      this.tttCurrentPlayer = 'X';
      this.tttWinner = null;
      this.drawTicTacToe();
      this.updateScore();
  }

  drawTicTacToe() {
      this.ctx.fillStyle = "#1e1e2e";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const cellSize = this.canvas.width / 3;

      this.ctx.strokeStyle = "#45475a";
      this.ctx.lineWidth = 4;

      // Draw grid lines
      this.ctx.beginPath();
      this.ctx.moveTo(cellSize, 0);
      this.ctx.lineTo(cellSize, this.canvas.height);
      this.ctx.moveTo(cellSize * 2, 0);
      this.ctx.lineTo(cellSize * 2, this.canvas.height);
      this.ctx.moveTo(0, cellSize);
      this.ctx.lineTo(this.canvas.width, cellSize);
      this.ctx.moveTo(0, cellSize * 2);
      this.ctx.lineTo(this.canvas.width, cellSize * 2);
      this.ctx.stroke();

      // Draw X and O
      for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
              const mark = this.tttBoard[row][col];
              if (mark) {
                  this.ctx.font = "bold 60px Arial";
                  this.ctx.textAlign = "center";
                  this.ctx.textBaseline = "middle";
                  this.ctx.fillStyle = mark === 'X' ? "#f38ba8" : "#89b4fa";
                  this.ctx.fillText(mark, col * cellSize + cellSize / 2, row * cellSize + cellSize / 2);
              }
          }
      }

      // Draw winner text if game over
      if (this.tttWinner) {
          this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

          this.ctx.fillStyle = "#a6e3a1";
          this.ctx.font = "bold 40px Arial";
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "middle";

          if (this.tttWinner === 'Tie') {
              this.ctx.fillText("It's a Tie!", this.canvas.width / 2, this.canvas.height / 2);
          } else {
              this.ctx.fillText(this.tttWinner + " Wins!", this.canvas.width / 2, this.canvas.height / 2);
          }
      }
  }

  handleTicTacToeClick(x, y) {
      if (this.tttWinner) {
          this.resetTicTacToe();
          return;
      }

      const cellSize = this.canvas.width / 3;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < 3 && col >= 0 && col < 3) {
          if (this.tttBoard[row][col] === '') {
              this.tttBoard[row][col] = this.tttCurrentPlayer;
              this.checkTicTacToeWin();

              if (!this.tttWinner) {
                  this.tttCurrentPlayer = this.tttCurrentPlayer === 'X' ? 'O' : 'X';
              }
              this.drawTicTacToe();
          }
      }
  }

  checkTicTacToeWin() {
      const b = this.tttBoard;
      const lines = [
          [b[0][0], b[0][1], b[0][2]],
          [b[1][0], b[1][1], b[1][2]],
          [b[2][0], b[2][1], b[2][2]],
          [b[0][0], b[1][0], b[2][0]],
          [b[0][1], b[1][1], b[2][1]],
          [b[0][2], b[1][2], b[2][2]],
          [b[0][0], b[1][1], b[2][2]],
          [b[0][2], b[1][1], b[2][0]]
      ];

      for (let line of lines) {
          if (line[0] !== '' && line[0] === line[1] && line[1] === line[2]) {
              this.tttWinner = line[0];
              this.tttScore[this.tttWinner]++;
              this.updateScore();
              return;
          }
      }

      const isTie = b.every(row => row.every(cell => cell !== ''));
      if (isTie) {
          this.tttWinner = 'Tie';
          this.tttScore.Ties++;
          this.updateScore();
      }
  }

  onDestroy() {
    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.keyHandler) document.removeEventListener("keydown", this.keyHandler);
    if (this.keyUpHandler) document.removeEventListener("keyup", this.keyUpHandler);
    if (this.canvas) {
      this.canvas.removeEventListener("click", this.clickHandler);
      this.canvas.removeEventListener("contextmenu", this.contextMenuHandler);
    }
  }
}
