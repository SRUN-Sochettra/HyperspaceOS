import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";

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

    // Ensure Pictures directory exists
    if (!FileSystem.isDir("/home/root/Pictures")) {
      FileSystem.mkdir("/home/root/Pictures");
      // Let's seed a sample base64 image if it's empty
      const sampleImage =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="; // Just a tiny red pixel for now
      FileSystem.writeFile("/home/root/Pictures/sample.png", sampleImage);
    }

    this.loadPhotos();
  }

  loadPhotos() {
    const items = FileSystem.readdir("/home/root/Pictures") || [];
    const imageFiles = items.filter((item) => {
      if (item.type !== "file") return false;
      const ext = item.name.split(".").pop()?.toLowerCase();
      return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    });

    if (imageFiles.length === 0) {
      this.grid.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 10px;">🖼️</div>
                    <div>No photos found in /home/root/Pictures</div>
                </div>
            `;
      return;
    }

    this.grid.innerHTML = imageFiles
      .map((file) => {
        const content = FileSystem.readFile(file.path);
        // If it's not a data URL, we might need a fallback, but for this OS simulator,
        // we assume image files store base64 data URLs as their content.
        const src =
          content && content.startsWith("data:image")
            ? content
            : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==";

        return `
                <div class="photo-item" data-src="${src}" data-name="${file.name}">
                    <img src="${src}" alt="${file.name}" />
                    <div class="photo-label">${file.name}</div>
                </div>
            `;
      })
      .join("");

    this.$$(".photo-item").forEach((item) => {
      item.addEventListener("click", () => {
        this.openLightbox(item.dataset.src);
      });
    });
  }

  openLightbox(src) {
    this.lightboxImg.src = src;
    this.lightbox.classList.add("active");
  }

  closeLightbox() {
    this.lightbox.classList.remove("active");
    setTimeout(() => {
      this.lightboxImg.src = "";
    }, 300);
  }
}
