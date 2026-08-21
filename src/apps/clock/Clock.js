import BaseApp from "../BaseApp.js";

export default class Clock extends BaseApp {
  async setup() {
    this.currentTab = "world";

    // World Clock state
    this.clockInterval = null;

    // Stopwatch state
    this.swInterval = null;
    this.swStartTime = 0;
    this.swElapsedTime = 0;
    this.swRunning = false;
    this.swLaps = [];

    // Timer state
    this.tmInterval = null;
    this.tmDuration = 0;
    this.tmRemaining = 0;
    this.tmRunning = false;

    this.container.innerHTML = `
      <div class="clock-app">
        <div class="clock-tabs">
          <div class="clock-tab active" data-tab="world" id="tab-world-${this.windowId}">World Clock</div>
          <div class="clock-tab" data-tab="stopwatch" id="tab-stopwatch-${this.windowId}">Stopwatch</div>
          <div class="clock-tab" data-tab="timer" id="tab-timer-${this.windowId}">Timer</div>
        </div>

        <div class="clock-content">
          <!-- World Clock Pane -->
          <div class="clock-pane active" id="pane-world-${this.windowId}">
            <div class="clock-display" id="clock-time-${this.windowId}">00:00:00</div>
            <div class="clock-date" id="clock-date-${this.windowId}">Loading...</div>
            <div class="clock-timezone" id="clock-tz-${this.windowId}">Local Time</div>
          </div>

          <!-- Stopwatch Pane -->
          <div class="clock-pane" id="pane-stopwatch-${this.windowId}">
            <div class="time-display" id="sw-display-${this.windowId}">00:00.00</div>
            <div class="clock-controls">
              <button class="clock-btn" id="sw-btn-left-${this.windowId}">Lap</button>
              <button class="clock-btn start" id="sw-btn-right-${this.windowId}">Start</button>
            </div>
            <div class="laps-container" id="sw-laps-${this.windowId}"></div>
          </div>

          <!-- Timer Pane -->
          <div class="clock-pane" id="pane-timer-${this.windowId}">
            <div id="tm-setup-${this.windowId}">
              <div class="timer-input">
                <div class="timer-field">
                  <input type="number" id="tm-input-h-${this.windowId}" min="0" max="99" value="0">
                  <label>Hours</label>
                </div>
                <div class="timer-colon">:</div>
                <div class="timer-field">
                  <input type="number" id="tm-input-m-${this.windowId}" min="0" max="59" value="5">
                  <label>Minutes</label>
                </div>
                <div class="timer-colon">:</div>
                <div class="timer-field">
                  <input type="number" id="tm-input-s-${this.windowId}" min="0" max="59" value="0">
                  <label>Seconds</label>
                </div>
              </div>
            </div>

            <div id="tm-running-view-${this.windowId}" style="display: none;">
              <div class="time-display" id="tm-display-${this.windowId}">00:00:00</div>
            </div>

            <div class="clock-controls">
              <button class="clock-btn" id="tm-btn-left-${this.windowId}">Cancel</button>
              <button class="clock-btn start" id="tm-btn-right-${this.windowId}">Start</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.startClock();
    this.updateStopwatchDisplay();
  }

  bindEvents() {
    // Tabs
    this.$$(".clock-tab").forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });

    // Stopwatch Controls
    this.$(`#sw-btn-left-${this.windowId}`).addEventListener("click", () => {
      if (this.swRunning) {
        this.addLap();
      } else {
        this.resetStopwatch();
      }
    });

    this.$(`#sw-btn-right-${this.windowId}`).addEventListener("click", () => {
      if (this.swRunning) {
        this.stopStopwatch();
      } else {
        this.startStopwatch();
      }
    });

    // Timer Controls
    this.$(`#tm-btn-left-${this.windowId}`).addEventListener("click", () => {
      this.resetTimer();
    });

    this.$(`#tm-btn-right-${this.windowId}`).addEventListener("click", () => {
      if (this.tmRunning) {
        this.pauseTimer();
      } else {
        this.startTimer();
      }
    });

    // Input validation
    const validateInput = (el, max) => {
      el.addEventListener("change", () => {
        let val = parseInt(el.value) || 0;
        if (val < 0) val = 0;
        if (val > max) val = max;
        el.value = val;
      });
    };

    validateInput(this.$(`#tm-input-h-${this.windowId}`), 99);
    validateInput(this.$(`#tm-input-m-${this.windowId}`), 59);
    validateInput(this.$(`#tm-input-s-${this.windowId}`), 59);
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    this.$$(".clock-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    this.$$(".clock-pane").forEach((pane) => {
      pane.classList.remove("active");
    });

    this.$(`#pane-${tabName}-${this.windowId}`).classList.add("active");
  }

  // --- World Clock ---
  startClock() {
    const updateTime = () => {
      const now = new Date();

      const timeStr = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const dateStr = now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const tzName =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Time";

      const timeEl = this.$(`#clock-time-${this.windowId}`);
      if (timeEl) timeEl.textContent = timeStr;

      const dateEl = this.$(`#clock-date-${this.windowId}`);
      if (dateEl) dateEl.textContent = dateStr;

      const tzEl = this.$(`#clock-tz-${this.windowId}`);
      if (tzEl) tzEl.textContent = tzName.replace(/_/g, " ");
    };

    updateTime();
    this.clockInterval = setInterval(updateTime, 1000);
  }

  // --- Stopwatch ---
  formatStopwatch(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  }

  updateStopwatchDisplay() {
    const display = this.$(`#sw-display-${this.windowId}`);
    if (display) {
      display.textContent = this.formatStopwatch(this.swElapsedTime);
    }
  }

  startStopwatch() {
    if (this.swRunning) return;

    this.swRunning = true;
    this.swStartTime = Date.now() - this.swElapsedTime;

    const rightBtn = this.$(`#sw-btn-right-${this.windowId}`);
    rightBtn.textContent = "Stop";
    rightBtn.className = "clock-btn stop";

    const leftBtn = this.$(`#sw-btn-left-${this.windowId}`);
    leftBtn.textContent = "Lap";

    this.swInterval = setInterval(() => {
      this.swElapsedTime = Date.now() - this.swStartTime;
      this.updateStopwatchDisplay();
    }, 10);
  }

  stopStopwatch() {
    if (!this.swRunning) return;

    this.swRunning = false;
    clearInterval(this.swInterval);

    const rightBtn = this.$(`#sw-btn-right-${this.windowId}`);
    rightBtn.textContent = "Start";
    rightBtn.className = "clock-btn start";

    const leftBtn = this.$(`#sw-btn-left-${this.windowId}`);
    leftBtn.textContent = "Reset";
  }

  resetStopwatch() {
    this.swElapsedTime = 0;
    this.swLaps = [];
    this.updateStopwatchDisplay();
    this.renderLaps();

    const leftBtn = this.$(`#sw-btn-left-${this.windowId}`);
    leftBtn.textContent = "Lap";
  }

  addLap() {
    const currentLapTime = this.swElapsedTime;
    const previousLapTime = this.swLaps.length > 0 ? this.swLaps[0].total : 0;
    const lapDuration = currentLapTime - previousLapTime;

    this.swLaps.unshift({
      id: this.swLaps.length + 1,
      total: currentLapTime,
      duration: lapDuration,
    });

    this.renderLaps();
  }

  renderLaps() {
    const container = this.$(`#sw-laps-${this.windowId}`);
    if (!container) return;

    if (this.swLaps.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = this.swLaps
      .map(
        (lap) => `
      <div class="lap-item">
        <span>Lap ${lap.id}</span>
        <span>${this.formatStopwatch(lap.duration)}</span>
        <span style="color: var(--text-primary)">${this.formatStopwatch(lap.total)}</span>
      </div>
    `,
      )
      .join("");
  }

  // --- Timer ---
  formatTimer(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  startTimer() {
    const setupView = this.$(`#tm-setup-${this.windowId}`);
    const runningView = this.$(`#tm-running-view-${this.windowId}`);

    if (!this.tmDuration && !this.tmRemaining) {
      // First start
      const h = parseInt(this.$(`#tm-input-h-${this.windowId}`).value) || 0;
      const m = parseInt(this.$(`#tm-input-m-${this.windowId}`).value) || 0;
      const s = parseInt(this.$(`#tm-input-s-${this.windowId}`).value) || 0;

      this.tmDuration = h * 3600 + m * 60 + s;
      this.tmRemaining = this.tmDuration;

      if (this.tmDuration === 0) return;
    }

    setupView.style.display = "none";
    runningView.style.display = "block";

    this.updateTimerDisplay();

    this.tmRunning = true;

    const rightBtn = this.$(`#tm-btn-right-${this.windowId}`);
    rightBtn.textContent = "Pause";
    rightBtn.className = "clock-btn stop";

    this.tmInterval = setInterval(() => {
      this.tmRemaining -= 1;
      this.updateTimerDisplay();

      if (this.tmRemaining <= 0) {
        this.timerComplete();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const display = this.$(`#tm-display-${this.windowId}`);
    if (display) {
      display.textContent = this.formatTimer(this.tmRemaining);
    }
  }

  pauseTimer() {
    this.tmRunning = false;
    clearInterval(this.tmInterval);

    const rightBtn = this.$(`#tm-btn-right-${this.windowId}`);
    rightBtn.textContent = "Resume";
    rightBtn.className = "clock-btn start";
  }

  resetTimer() {
    this.tmRunning = false;
    clearInterval(this.tmInterval);

    this.tmDuration = 0;
    this.tmRemaining = 0;

    const setupView = this.$(`#tm-setup-${this.windowId}`);
    const runningView = this.$(`#tm-running-view-${this.windowId}`);

    if (setupView && runningView) {
      setupView.style.display = "block";
      runningView.style.display = "none";
    }

    const rightBtn = this.$(`#tm-btn-right-${this.windowId}`);
    if (rightBtn) {
      rightBtn.textContent = "Start";
      rightBtn.className = "clock-btn start";
    }
  }

  timerComplete() {
    this.resetTimer();
    // Play a sound or show notification
    if (window.HyperOS && window.HyperOS.EventBus) {
      window.HyperOS.EventBus.emit("notification:show", {
        icon: "⏰",
        title: "Timer Complete",
        body: "Your timer has finished.",
      });
    }
  }

  onDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.swInterval) clearInterval(this.swInterval);
    if (this.tmInterval) clearInterval(this.tmInterval);
  }
}
