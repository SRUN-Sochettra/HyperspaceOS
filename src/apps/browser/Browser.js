import BaseApp from "../BaseApp.js";

export default class Browser extends BaseApp {
  async setup() {
    this.history = [];
    this.historyIndex = -1;
    this.defaultUrl = "https://example.com"; // Many sites block iframes, example.com works

    this.container.innerHTML = `
      <div class="browser-container">
        <div class="browser-toolbar">
          <button class="browser-btn nav-btn" id="browser-back-${this.windowId}" title="Back" disabled>◀</button>
          <button class="browser-btn nav-btn" id="browser-forward-${this.windowId}" title="Forward" disabled>▶</button>
          <button class="browser-btn nav-btn" id="browser-refresh-${this.windowId}" title="Refresh">↻</button>

          <div class="browser-address-bar">
            <span class="browser-secure-icon">🔒</span>
            <input type="text" class="browser-url-input" id="browser-url-${this.windowId}" value="${this.defaultUrl}" placeholder="Enter URL or search...">
          </div>

          <button class="browser-btn menu-btn" id="browser-menu-${this.windowId}" title="Menu">⋮</button>
        </div>

        <div class="browser-content">
          <iframe
            id="browser-frame-${this.windowId}"
            class="browser-iframe"
            src="${this.defaultUrl}"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            title="Browser"
          ></iframe>
        </div>
      </div>
    `;

    this.backBtn = this.$(`#browser-back-${this.windowId}`);
    this.forwardBtn = this.$(`#browser-forward-${this.windowId}`);
    this.refreshBtn = this.$(`#browser-refresh-${this.windowId}`);
    this.urlInput = this.$(`#browser-url-${this.windowId}`);
    this.iframe = this.$(`#browser-frame-${this.windowId}`);

    // Initialize history
    this.navigateTo(this.defaultUrl, true);

    this.bindEvents();
  }

  bindEvents() {
    // Address bar enter
    this.urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        let url = this.urlInput.value.trim();
        if (!url) return;

        // Extremely basic parsing
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          if (url.includes(".")) {
            url = "https://" + url;
          } else {
            // Treat as search (duckduckgo since google blocks iframes)
            url = "https://duckduckgo.com/?q=" + encodeURIComponent(url);
          }
        }

        this.urlInput.value = url;
        this.navigateTo(url);
      }
    });

    // Select all text on click
    this.urlInput.addEventListener("click", () => {
      this.urlInput.select();
    });

    // Navigation buttons
    this.backBtn.addEventListener("click", () => {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        const url = this.history[this.historyIndex];
        this.updateIframe(url);
        this.updateButtons();
      }
    });

    this.forwardBtn.addEventListener("click", () => {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        const url = this.history[this.historyIndex];
        this.updateIframe(url);
        this.updateButtons();
      }
    });

    this.refreshBtn.addEventListener("click", () => {
      const url = this.history[this.historyIndex];
      if (url) {
        // Force refresh iframe by resetting src
        this.iframe.src = "about:blank";
        setTimeout(() => {
          this.iframe.src = url;
        }, 10);
      }
    });

    // Iframe load event to sync URL bar (Note: Cross-origin restriction often prevents accessing contentWindow.location)
    this.iframe.addEventListener("load", () => {
      try {
        // This will fail for cross-origin iframes
        const currentUrl = this.iframe.contentWindow.location.href;
        if (
          currentUrl !== "about:blank" &&
          currentUrl !== this.urlInput.value
        ) {
          this.urlInput.value = currentUrl;
          // Only add to history if it's not the same as current history entry
          if (this.history[this.historyIndex] !== currentUrl) {
            this.addToHistory(currentUrl);
          }
        }
      } catch (e) {
        // Cross-origin blocked, just leave the input as what user typed
        console.debug(
          "[Browser] Cannot access iframe location due to cross-origin policies.",
        );
      }
    });
  }

  navigateTo(url, initial = false) {
    if (!initial && this.history[this.historyIndex] === url) return;

    this.updateIframe(url);
    this.addToHistory(url);
  }

  updateIframe(url) {
    this.urlInput.value = url;
    this.iframe.src = url;
  }

  addToHistory(url) {
    // Truncate future history if we're in the middle and navigated
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(url);
    this.historyIndex = this.history.length - 1;
    this.updateButtons();
  }

  updateButtons() {
    this.backBtn.disabled = this.historyIndex <= 0;
    this.forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
  }
}
