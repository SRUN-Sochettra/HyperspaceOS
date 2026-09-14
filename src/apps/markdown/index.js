import Registry from "../../core/Registry.js";
import EventBus from "../../core/EventBus.js";
import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'
import EventBus from '../../core/EventBus.js'

// Queue files that arrive before the markdown viewer component mounts
const pendingFiles = [];
const pendingFiles = []

// This listener runs as soon as this module is imported (during boot)
EventBus.on("markdown:queueFile", ({ path }) => {
  pendingFiles.push({ path });
});
EventBus.on('markdown:queueFile', ({ path }) => {
  pendingFiles.push({ path })
})

export function getPendingFiles() {
  // Return all pending and clear the queue
  return pendingFiles.splice(0);
  return pendingFiles.splice(0)
}

export default function registerMarkdown() {
  Registry.register("markdown", {
    title: "Markdown Viewer",
    icon: "📝",
  Registry.register('markdown', {
    title: 'Markdown Viewer',
    icon: icon('markdown'),
    width: 600,
    height: 500,
    category: "productivity",
    component: () => import("./Markdown.js"),
  });
    category: 'productivity',
    component: () => import('./Markdown.js'),
  })
}
