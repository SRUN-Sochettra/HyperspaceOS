import BaseApp from "../BaseApp.js";
import FileSystem from "../../core/FileSystem.js";

export default class Camera extends BaseApp {
  async setup() {
    this.container.innerHTML = `
      <div class="camera-container">
        <div class="camera-toolbar">
          <span style="font-weight: 500;">Camera</span>
        </div>
        <div class="camera-feed-container">
          <video id="camera-feed-${this.windowId}" autoplay playsinline></video>
          <canvas id="camera-canvas-${this.windowId}" style="display: none;"></canvas>
        </div>
        <div class="camera-controls">
          <button class="camera-capture-btn" id="camera-capture-${this.windowId}">📸 Capture</button>
        </div>
      </div>
    `;

    this.videoElement = this.$(`#camera-feed-${this.windowId}`);
    this.canvasElement = this.$(`#camera-canvas-${this.windowId}`);
    this.captureBtn = this.$(`#camera-capture-${this.windowId}`);

    this.captureBtn.addEventListener("click", () => this.captureImage());

    this.startCamera();
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.videoElement.srcObject = this.stream;
    } catch (err) {
      console.error("Error accessing camera: ", err);
      this.container.innerHTML = `
        <div class="camera-container" style="justify-content: center; align-items: center;">
          <div style="font-size: 3rem; margin-bottom: 10px;">📸</div>
          <div>Error accessing camera. Please check permissions.</div>
        </div>
      `;
    }
  }

  captureImage() {
    if (!this.stream) return;

    const ctx = this.canvasElement.getContext('2d');

    // Set canvas dimensions to match video
    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

    // Get image as base64 string
    const dataUrl = this.canvasElement.toDataURL('image/png');

    // Save to filesystem
    this.saveImage(dataUrl);
  }

  saveImage(dataUrl) {
    const picturesDir = "/home/root/Pictures";

    if (!FileSystem.isDir(picturesDir)) {
      FileSystem.mkdir(picturesDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `snapshot_${timestamp}.png`;
    const filePath = `${picturesDir}/${filename}`;

    const result = FileSystem.writeFile(filePath, dataUrl);

    if (result.success) {
      this.notify("📸", "Snapshot Saved", `Saved to ${filePath}`);
    } else {
      this.notify("❌", "Save Failed", `Could not save image: ${result.error}`);
    }
  }

  onDestroy() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}
