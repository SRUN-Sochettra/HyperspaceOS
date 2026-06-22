import Registry from "../../core/Registry.js";

export default function registerBrowser() {
  Registry.register("browser", {
    title: "Browser",
    icon: "🌐",
    width: 800,
    height: 600,
    singleton: false,
    category: "productivity",
    component: () => import("./Browser.js"),
  });
}
