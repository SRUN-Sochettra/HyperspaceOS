import Registry from "../../core/Registry.js";

export default function registerMarkdown() {
  Registry.register("markdown", {
    title: "Markdown Viewer",
    icon: "📝",
    width: 600,
    height: 500,
    category: "productivity",
    component: () => import("./Markdown.js"),
  });
}
