import BaseApp from "../BaseApp.js";

export default class Calculator extends BaseApp {
  async setup() {
    this.current = "0";
    this.expression = "";
    this.newNumber = true;
    this.lastResult = null;

    const buttons = [
      { label: "AC", type: "function", action: "clear" },
      { label: "±", type: "function", action: "negate" },
      { label: "%", type: "function", action: "percent" },
      { label: "÷", type: "operator", action: "op", value: "/" },
      { label: "7", type: "number", action: "num", value: "7" },
      { label: "8", type: "number", action: "num", value: "8" },
      { label: "9", type: "number", action: "num", value: "9" },
      { label: "×", type: "operator", action: "op", value: "*" },
      { label: "4", type: "number", action: "num", value: "4" },
      { label: "5", type: "number", action: "num", value: "5" },
      { label: "6", type: "number", action: "num", value: "6" },
      { label: "−", type: "operator", action: "op", value: "-" },
      { label: "1", type: "number", action: "num", value: "1" },
      { label: "2", type: "number", action: "num", value: "2" },
      { label: "3", type: "number", action: "num", value: "3" },
      { label: "+", type: "operator", action: "op", value: "+" },
      { label: "0", type: "number", action: "num", value: "0", span: 2 },
      { label: ".", type: "number", action: "num", value: "." },
      { label: "=", type: "equals", action: "equals" },
    ];

    this.container.innerHTML = `
      <div class="calc-container">
        <div class="calc-display">
          <div class="calc-expression" id="calc-expr-${this.windowId}"></div>
          <div class="calc-result" id="calc-result-${this.windowId}">0</div>
        </div>
        <div class="calc-grid">
          ${buttons
            .map(
              (btn) => `
            <button
              class="calc-btn ${btn.type}"
              data-action="${btn.action}"
              data-value="${btn.value || ""}"
              ${btn.span ? `style="grid-column:span ${btn.span}"` : ""}
            >${btn.label}</button>
          `,
            )
            .join("")}
        </div>
      </div>
    `;

    this.displayEl = this.$(`#calc-result-${this.windowId}`);
    this.exprEl = this.$(`#calc-expr-${this.windowId}`);

    // Bind button clicks
    this.$$(".calc-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.handleButton(btn.dataset.action, btn.dataset.value);
      });
    });

    // Keyboard support
    this.keyHandler = (e) => this.handleKey(e);
    document.addEventListener("keydown", this.keyHandler);
  }

  handleButton(action, value) {
    switch (action) {
      case "num":
        if (this.newNumber) {
          this.current = value === "." ? "0." : value;
          this.newNumber = false;
        } else {
          if (value === "." && this.current.includes(".")) return;
          if (this.current === "0" && value !== ".") {
            this.current = value;
          } else {
            this.current += value;
          }
        }
        this.updateDisplay();
        break;

      case "op":
        this.expression += this.current + ` ${value} `;
        this.exprEl.textContent = this.formatExpression(this.expression);
        this.newNumber = true;
        break;

      case "equals":
        const fullExpr = this.expression + this.current;
        try {
          const result = Function('"use strict"; return (' + fullExpr + ")")();
          const formatted = parseFloat(result.toFixed(10));
          this.displayEl.textContent = this.formatNumber(formatted);
          this.exprEl.textContent = this.formatExpression(fullExpr) + " =";
          this.current = String(formatted);
          this.expression = "";
          this.newNumber = true;
          this.lastResult = formatted;
        } catch {
          this.displayEl.textContent = "Error";
          this.expression = "";
          this.current = "0";
          this.newNumber = true;
        }
        break;

      case "clear":
        this.current = "0";
        this.expression = "";
        this.newNumber = true;
        this.displayEl.textContent = "0";
        this.exprEl.textContent = "";
        break;

      case "negate":
        if (this.current !== "0") {
          this.current = String(-parseFloat(this.current));
          this.updateDisplay();
        }
        break;

      case "percent":
        this.current = String(parseFloat(this.current) / 100);
        this.updateDisplay();
        break;
    }
  }

  handleKey(e) {
    // Only respond if our window is focused
    const activeWin = document.querySelector(".hyper-window.active");
    if (!activeWin || activeWin.id !== `window-${this.windowId}`) return;

    // Don't capture if user is typing in another input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    const key = e.key;
    if (key >= "0" && key <= "9") {
      e.preventDefault();
      this.handleButton("num", key);
    } else if (key === ".") {
      e.preventDefault();
      this.handleButton("num", ".");
    } else if (key === "+") {
      e.preventDefault();
      this.handleButton("op", "+");
    } else if (key === "-") {
      e.preventDefault();
      this.handleButton("op", "-");
    } else if (key === "*") {
      e.preventDefault();
      this.handleButton("op", "*");
    } else if (key === "/") {
      e.preventDefault();
      this.handleButton("op", "/");
    } else if (key === "Enter" || key === "=") {
      e.preventDefault();
      this.handleButton("equals", "");
    } else if (key === "Escape") {
      e.preventDefault();
      this.handleButton("clear", "");
    } else if (key === "Backspace") {
      e.preventDefault();
      if (this.current.length > 1) {
        this.current = this.current.slice(0, -1);
      } else {
        this.current = "0";
        this.newNumber = true;
      }
      this.updateDisplay();
    } else if (key === "%") {
      e.preventDefault();
      this.handleButton("percent", "");
    }
  }

  updateDisplay() {
    this.displayEl.textContent = this.formatNumber(parseFloat(this.current));
  }

  formatNumber(num) {
    if (isNaN(num)) return "Error";
    const str = String(num);
    if (str.length > 12) return num.toExponential(6);
    return str;
  }

  formatExpression(expr) {
    return expr.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−");
  }

  onDestroy() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
  }
}
