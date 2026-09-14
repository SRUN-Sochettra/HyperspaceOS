import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";
import { safeMediaUrl } from "../../utils/safeDom.js";

export default class Photos extends BaseApp {
  async setup() {
    this.container.innerHTML = `
            <div class="photos-container">
                <div class="photos-toolbar">
                    <span style="font-weight: 500;">Gallery</span>
                    <div style="flex: 1;"></div>
                    <button class="glass-btn" id="photos-refresh-${this.windowId}">🔄 Refresh</button>
                </div>
                <div class="photos-grid" id="photos-grid-${this.windowId}">
                    <!-- Photos go here -->
                </div>

                <div class="photo-lightbox" id="photo-lightbox-${this.windowId}">
                    <div class="lightbox-toolbar">
                        <button class="lightbox-close" id="lightbox-close-${this.windowId}">✕</button>
                    </div>
                    <div class="lightbox-content">
                        <img id="lightbox-img-${this.windowId}" src="" alt="Full view" />
                    </div>
                </div>
            </div>
        `;

    this.grid = this.$(`#photos-grid-${this.windowId}`);
    this.lightbox = this.$(`#photo-lightbox-${this.windowId}`);
    this.lightboxImg = this.$(`#lightbox-img-${this.windowId}`);

    this.$(`#photos-refresh-${this.windowId}`).addEventListener("click", () =>
      this.loadPhotos(),
    );
    this.$(`#lightbox-close-${this.windowId}`).addEventListener("click", () =>
      this.closeLightbox(),
    );

    if (!FileSystem.isDir("/home/root/Pictures")) FileSystem.mkdir("/home/root/Pictures");
    this.loadPhotos();
  }

  loadPhotos() {
    const items = FileSystem.readdir("/home/root/Pictures") || [];
    this.grid.replaceChildren();
    let count = 0;
    for (const file of items) {
      if (file.type !== "file") continue;
      const src = safeMediaUrl(FileSystem.readFile(file.path), "image");
      if (!src) continue;
      count += 1;
      const button = this.createElement("button", "photo-item");
      button.type = "button";
      button.setAttribute("aria-label", `Open ${file.name}`);
      const image = document.createElement("img"); image.src = src; image.alt = file.name;
      button.append(image, this.createElement("span", "photo-label", file.name));
      this.listenTo(button, "click", () => this.openLightbox(src));
      this.grid.append(button);
    }
    if (!count) this.grid.append(this.createElement("div", "photos-empty-state", "No photos are stored in /home/root/Pictures."));
  }

  openLightbox(src) {
    this.lightboxImg.src = src;
    this.lightbox.classList.add("active");
  }

  closeLightbox() {
    this.lightbox.classList.remove("active");
    this.addTimeout(() => {
      this.lightboxImg.removeAttribute("src");
    }, 300);
  }
  onDestroy() { this.lightboxImg?.removeAttribute("src"); }
}