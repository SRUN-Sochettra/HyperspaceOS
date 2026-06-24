import Registry from "../../core/Registry.js";
import EventBus from "../../core/EventBus.js";

// Queue files that arrive before the editor component mounts
const pendingFiles = [];

// This listener runs as soon as this module is imported (during boot)
// It catches files from Files app or Terminal even if Editor isn't open yet
EventBus.on("editor:queueFile", ({ path, content }) => {
  pendingFiles.push({ path, content });
});

export function getPendingFiles() {
  // Return all pending and clear the queue
  return pendingFiles.splice(0);
}

export default function registerEditor() {
  Registry.register("editor", {
    title: "Code Editor",
    icon: "💻",
    width: 620,
    height: 480,
    singleton: true,
    category: "productivity",
    component: () => import("./Editor.js"),
  });
}
