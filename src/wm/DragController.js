import EventBus from "../core/EventBus.js";
import SnapController from "./SnapController.js";

const DragController = (() => {
  let active = null;
  let getWindowFn = null;
  const EDGE_PADDING = 20;

  function init(getWindow) {
    getWindowFn = getWindow;
    SnapController.init();

    document.addEventListener("mousedown", onMouseDown, { capture: false });
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;

    const titlebar = e.target.closest(".window-titlebar");
    if (!titlebar) return;
    if (e.target.closest(".traffic-btn")) return;

    const windowId = parseInt(titlebar.dataset.windowId);
    if (isNaN(windowId)) return;

    const win = getWindowFn(windowId);
    if (!win || !win.element) return;

    // Unsnap if maximized
    if (win.maximized) {
      const proportionX = e.clientX / window.innerWidth;
      win.toggleMaximize();
      win.setPosition(e.clientX - win.width * proportionX, e.clientY - 20);
    }

    // Unsnap if was snapped
    if (win.snapped) {
      const oldBounds = win.preSnapBounds;
      if (oldBounds) {
        const proportionX = (e.clientX - win.x) / win.width;
        win.setSize(oldBounds.width, oldBounds.height);
        win.setPosition(
          e.clientX - oldBounds.width * proportionX,
          e.clientY - 20,
        );
      }
      win.snapped = false;
      win.preSnapBounds = null;
    }

    const rect = win.element.getBoundingClientRect();

    active = {
      windowId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      element: win.element,
    };

    win.element.style.willChange = "left, top";
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    EventBus.emit("window:focus", { id: windowId });
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!active) return;

    let x = e.clientX - active.offsetX;
    let y = e.clientY - active.offsetY;

    // Clamp
    x = Math.max(-active.element.offsetWidth + EDGE_PADDING * 4, x);
    x = Math.min(window.innerWidth - EDGE_PADDING, x);
    y = Math.max(0, y);
    y = Math.min(window.innerHeight - EDGE_PADDING, y);

    const win = getWindowFn(active.windowId);
    if (win) win.setPosition(x, y);

    // Check snap zones
    SnapController.check(e.clientX, e.clientY);
  }

  function onMouseUp(e) {
    if (!active) return;

    const win = getWindowFn(active.windowId);

    // Check if we should snap
    const snapBounds = SnapController.resolve();

    if (snapBounds && win) {
      // Save pre-snap bounds for unsnapping later
      win.preSnapBounds = {
        x: win.x,
        y: win.y,
        width: win.width,
        height: win.height,
      };
      win.snapped = true;

      // Animate to snap position
      if (win.spring) {
        win.spring.animate(
          `snap-${win.id}`,
          win.element,
          {
            x: { from: win.x, to: snapBounds.x },
            y: { from: win.y, to: snapBounds.y },
            width: { from: win.width, to: snapBounds.width },
            height: { from: win.height, to: snapBounds.height },
          },
          {
            stiffness: 280,
            damping: 28,
            mass: 0.8,
            onComplete: () => {
              win.x = snapBounds.x;
              win.y = snapBounds.y;
              win.width = snapBounds.width;
              win.height = snapBounds.height;
            },
          },
        );
      } else {
        win.setPosition(snapBounds.x, snapBounds.y);
        win.setSize(snapBounds.width, snapBounds.height);
      }
    }

    if (win?.element) win.element.style.willChange = "";

    active = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function destroy() {
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    SnapController.destroy();
    active = null;
  }

  return { init, destroy };
})();

export default DragController;
