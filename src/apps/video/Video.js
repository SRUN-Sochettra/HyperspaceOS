import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";

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

    if (!FileSystem.isDir("/home/root/Videos")) {
      FileSystem.mkdir("/home/root/Videos");
      // Add a dummy video if it's empty to show functionality.
      // In a real scenario this might be a base64 encoded mp4.
      // But for OS simulation, we can just write an empty dummy file and fallback to a default video url.
      FileSystem.writeFile("/home/root/Videos/sample.mp4", "https://www.w3schools.com/html/mov_bbb.mp4");
    }

    this.loadVideos();
  }

  loadVideos() {
    const items = FileSystem.readdir("/home/root/Videos") || [];
    const videoFiles = items.filter((item) => {
      if (item.type !== "file") return false;
      const ext = item.name.split(".").pop()?.toLowerCase();
      return ["mp4", "webm", "ogg"].includes(ext);
    });

    if (videoFiles.length === 0) {
      this.grid.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 3rem; margin-bottom: 10px;">🎬</div>
          <div>No videos found in /home/root/Videos</div>
        </div>
      `;
      return;
    }

    this.grid.innerHTML = videoFiles
      .map((file) => {
        const content = FileSystem.readFile(file.path);
        // Assuming video content might just be a URL for the simulation, or actual base64
        const src = content;

        return `
          <div class="video-item" data-src="${src}" data-name="${file.name}">
            <div class="video-icon">▶️</div>
            <div class="video-label">${file.name}</div>
          </div>
        `;
      })
      .join("");

    this.$$(".video-item").forEach((item) => {
      item.addEventListener("click", () => {
        this.openPlayer(item.dataset.src);
      });
    });
  }

  openPlayer(src) {
    this.videoElement.src = src;
    this.playerOverlay.classList.add("active");
    this.videoElement.play().catch(e => console.warn("Auto-play prevented", e));
  }

  closePlayer() {
    this.playerOverlay.classList.remove("active");
    this.videoElement.pause();
    this.videoElement.src = "";
  }
}
