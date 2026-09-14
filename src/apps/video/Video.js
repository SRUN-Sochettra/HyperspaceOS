import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";
import { safeMediaUrl } from "../../utils/safeDom.js";

export default class Video extends BaseApp {
  async setup() {
    this.container.innerHTML = `
      <div class="video-container">
        <div class="video-toolbar">
          <span style="font-weight: 500;">Videos</span>
          <div style="flex: 1;"></div>
          <button class="glass-btn" id="video-refresh-${this.windowId}">🔄 Refresh</button>
        </div>
        <div class="video-grid" id="video-grid-${this.windowId}">
          <!-- Videos go here -->
        </div>

        <div class="video-player-overlay" id="video-player-overlay-${this.windowId}">
          <div class="player-toolbar">
            <button class="player-close" id="player-close-${this.windowId}">✕</button>
          </div>
          <div class="player-content">
            <video id="video-element-${this.windowId}" controls>
            </video>
          </div>
        </div>
      </div>
    `;

    this.grid = this.$(`#video-grid-${this.windowId}`);
    this.playerOverlay = this.$(`#video-player-overlay-${this.windowId}`);
    this.videoElement = this.$(`#video-element-${this.windowId}`);

    this.$(`#video-refresh-${this.windowId}`).addEventListener("click", () =>
      this.loadVideos(),
    );
    this.$(`#player-close-${this.windowId}`).addEventListener("click", () =>
      this.closePlayer(),
    );

    if (!FileSystem.isDir("/home/root/Videos")) FileSystem.mkdir("/home/root/Videos");
    this.loadVideos();
  }

  loadVideos() {
    this.grid.replaceChildren();
    let count = 0;
    for (const file of FileSystem.readdir("/home/root/Videos") || []) {
      if (file.type !== "file") continue;
      const src = safeMediaUrl(FileSystem.readFile(file.path), "video");
      if (!src) continue;
      count += 1;
      const button = this.createElement("button", "video-item"); button.type = "button";
      button.setAttribute("aria-label", `Play ${file.name}`);
      button.append(this.createElement("span", "video-icon", "Play"), this.createElement("span", "video-label", file.name));
      this.listenTo(button, "click", () => this.openPlayer(src)); this.grid.append(button);
    }
    if (!count) this.grid.append(this.createElement("div", "video-empty-state", "No playable local videos are stored in /home/root/Videos."));
  }

  openPlayer(src) {
    const safe = safeMediaUrl(src, "video");
    if (!safe) return;
    this.videoElement.src = safe;
    this.playerOverlay.classList.add("active");
    this.videoElement.play().catch(e => console.warn("Auto-play prevented", e));
  }

  closePlayer() {
    this.playerOverlay.classList.remove("active");
    this.videoElement.pause();
    this.videoElement.removeAttribute("src");
    this.videoElement.load();
  }
  onDestroy() { if (this.videoElement) { this.videoElement.pause(); this.videoElement.removeAttribute("src"); this.videoElement.load(); } }
}