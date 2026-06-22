import BaseApp from "../BaseApp.js";
import Store from "../../core/Store.js";
import EventBus from "../../core/EventBus.js";
import FileSystem from "../../core/FileSystem.js";
import ThemeEngine from "../../core/ThemeEngine.js";

export default class Settings extends BaseApp {
  async setup() {
    const themes = ThemeEngine.getAll();
    const currentTheme = ThemeEngine.getCurrent();
    const particlesOn = Store.get("settings.particlesEnabled") !== false;
    const animationsOn = Store.get("settings.animationsEnabled") !== false;
    const soundOn = Store.get("settings.soundEnabled") !== false;
    const du = FileSystem.du("/");

    this.container.innerHTML = `
      <div class="settings-container">
        <h2 class="settings-title">⚙️ Settings</h2>

        <div class="settings-section">
          <div class="section-label">Theme</div>
          <div class="glass-card">
            <div class="settings-theme-grid" id="set-themes-${this.windowId}">
              ${Object.entries(themes)
                .map(
                  ([key, theme]) => `
                <div class="settings-theme-option ${key === currentTheme ? "active" : ""}"
                     data-theme="${key}"
                     style="--preview-color: ${theme.accent}">
                  <div class="settings-theme-preview">
                    <div class="stp-bar" style="background: ${theme.vars["--surface-0"] || "#0a0a1e"}"></div>
                    <div class="stp-body" style="background: ${theme.vars["--surface-base"] || "#020206"}">
                      <div class="stp-dot" style="background: ${theme.accent}"></div>
                    </div>
                  </div>
                  <div class="settings-theme-name">${theme.name}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-label">System</div>
          <div class="glass-card">
            <div class="settings-row">
              <span>Particles</span>
              <label class="toggle">
                <input type="checkbox" id="set-particles" ${particlesOn ? "checked" : ""} />
                <span class="toggle-track"></span>
              </label>
            </div>
            <div class="divider"></div>
            <div class="settings-row">
              <span>Animations</span>
              <label class="toggle">
                <input type="checkbox" id="set-animations" ${animationsOn ? "checked" : ""} />
                <span class="toggle-track"></span>
              </label>
            </div>
            <div class="divider"></div>
            <div class="settings-row">
              <span>Sound Effects</span>
              <label class="toggle">
                <input type="checkbox" id="set-sound" ${soundOn ? "checked" : ""} />
                <span class="toggle-track"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-label">Storage</div>
          <div class="glass-card">
            <div class="settings-row">
              <span>Files</span>
              <span class="badge cyan">${du.fileCount}</span>
            </div>
            <div class="divider"></div>
            <div class="settings-row">
              <span>Total size</span>
              <span>${this.formatSize(du.totalSize)}</span>
            </div>
            <div class="divider"></div>
            <div class="settings-row">
              <span style="color:var(--neon-red)">Reset file system</span>
              <button class="glass-btn" id="set-fs-reset" style="font-size:var(--fs-xs)">Reset</button>
            </div>
            <div class="divider"></div>
            <div class="settings-row">
              <span style="color:var(--neon-red)">Clear all data</span>
              <button class="glass-btn" id="set-clear" style="font-size:var(--fs-xs)">Clear</button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-label">About</div>
          <div class="glass-card settings-about">
            <div class="settings-about-logo">⬡</div>
            <div class="settings-about-info">
              <div class="settings-about-name">HyperSpace OS</div>
              <div class="settings-about-detail">Version ${Store.get("os.version")}</div>
              <div class="settings-about-detail">FPS: <span id="set-fps">${Store.get("system.fps")}</span></div>
              <div class="settings-about-detail">Windows: <span id="set-wins">${Store.get("windows.all")?.length || 0}</span></div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-label">Keyboard Shortcuts</div>
          <div class="glass-card">
            <div class="settings-shortcuts">
              <div class="settings-shortcut"><kbd>Ctrl+Space</kbd><span>Spotlight Search</span></div>
              <div class="settings-shortcut"><kbd>Ctrl+T</kbd><span>New Terminal</span></div>
              <div class="settings-shortcut"><kbd>Ctrl+Q</kbd><span>Close Window</span></div>
              <div class="settings-shortcut"><kbd>Ctrl+M</kbd><span>Minimize</span></div>
              <div class="settings-shortcut"><kbd>Ctrl+Shift+T</kbd><span>Tile Windows</span></div>
              <div class="settings-shortcut"><kbd>Ctrl+Shift+V</kbd><span>Clipboard History</span></div>
              <div class="settings-shortcut"><kbd>Ctrl+1-4</kbd><span>Switch Desktop</span></div>
              <div class="settings-shortcut"><kbd>F2</kbd><span>Rename (in Files)</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Theme picker
    this.$$(".settings-theme-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        ThemeEngine.apply(opt.dataset.theme);
        this.$$(".settings-theme-option").forEach((o) =>
          o.classList.remove("active"),
        );
        opt.classList.add("active");
        this.notify(
          "🎨",
          "Theme Changed",
          ThemeEngine.getTheme(opt.dataset.theme)?.name,
        );
      });
    });

    // Toggles
    this.$("#set-particles").addEventListener("change", (e) => {
      Store.set("settings.particlesEnabled", e.target.checked);
      document
        .querySelectorAll(".particle")
        .forEach((p) => (p.style.display = e.target.checked ? "" : "none"));
    });

    this.$("#set-animations").addEventListener("change", (e) => {
      Store.set("settings.animationsEnabled", e.target.checked);
      document.body.classList.toggle("reduce-motion", !e.target.checked);
    });

    this.$("#set-sound").addEventListener("change", (e) => {
      Store.set("settings.soundEnabled", e.target.checked);
    });

    // Reset buttons
    this.$("#set-fs-reset")?.addEventListener("click", () => {
      if (confirm("Reset file system to defaults?")) {
        FileSystem.reset();
        this.notify("🔄", "Reset", "File system restored to defaults");
      }
    });

    this.$("#set-clear")?.addEventListener("click", () => {
      if (confirm("Clear ALL saved data and reload?")) {
        localStorage.clear();
        location.reload();
      }
    });

    // Live stats
    this.addInterval(() => {
      const f = this.$("#set-fps");
      const w = this.$("#set-wins");
      if (f) f.textContent = Store.get("system.fps");
      if (w) w.textContent = Store.get("windows.all")?.length || 0;
    }, 1000);
  }

  formatSize(b) {
    if (!b) return "0 B";
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    return (b / (1024 * 1024)).toFixed(1) + " MB";
  }
}
