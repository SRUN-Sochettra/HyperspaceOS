// ============================================================
//  ResizeController.js — Window resizing
//  Same pattern as DragController but for the resize handle.
//  Handles min-size constraints and cursor management.
// ============================================================

import EventBus from "../core/EventBus.js";

const ResizeController = (() => {
  let active = null;
  // active = {
  //   windowId: number,
  //   startX:   number,    ← mouse start position
  //   startY:   number,
  //   startW:   number,    ← window start size
  //   startH:   number,
  // }

  let getWindowFn = null;

  function init(getWindow) {
    getWindowFn = getWindow;

    document.addEventListener("mousedown", onMouseDown, { capture: false });
    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseup", onMouseUp);
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;

    const handle = e.target.closest(".window-resize-handle");
    if (!handle) return;

    const windowId = parseInt(handle.dataset.windowId);
    if (isNaN(windowId)) return;

    const win = getWindowFn(windowId);
    if (!win || !win.element || win.maximized) return;

    active = {
      windowId,
      startX: e.clientX,
      startY: e.clientY,
      startW: win.width,
      startH: win.height,
    };

    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
    win.element.style.willChange = "width, height";

    EventBus.emit("window:focus", { id: windowId });

    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!active) return;

    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;

    const win = getWindowFn(active.windowId);
    if (!win) return;

    win.setSize(active.startW + dx, active.startH + dy);
  }

  function onMouseUp() {
    if (!active) return;

    const win = getWindowFn(active.windowId);
    if (win?.element) {
      win.element.style.willChange = "";
    }

    active = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function destroy() {
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    active = null;
  }

  return { init, destroy };
})();

export default ResizeController;
