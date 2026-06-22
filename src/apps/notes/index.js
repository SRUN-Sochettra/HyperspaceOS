import Registry from "../../core/Registry.js";

export default function registerNotes() {
  Registry.register("notes", {
    title: "Notes",
    icon: "📝",
    width: 540,
    height: 420,
    category: "productivity",
    component: () => import("./Notes.js"),
  });
}
