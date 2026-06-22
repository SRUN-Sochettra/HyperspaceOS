export default class Sparkline {
  constructor(canvas, color = "#00f5ff") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.color = color;
    this.data = new Array(60).fill(0);
    this.max = 100;
  }

  push(value) {
    this.data.push(value);
    if (this.data.length > 60) this.data.shift();
  }

  draw() {
    const { canvas, ctx, data, color, max } = this;

    // Get actual rendered size
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Resize canvas to match container
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    // Build the line path
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * w;
      const y = h - (Math.min(data[i], max) / max) * h * 0.9 - 1;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Stroke the line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Fill under the line
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + "25");
    grad.addColorStop(1, color + "03");
    ctx.fillStyle = grad;
    ctx.fill();
  }
}
