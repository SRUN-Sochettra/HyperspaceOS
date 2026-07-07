import Registry from "../../core/Registry.js";

export default function registerMail() {
  Registry.register("mail", {
    title: "Mail",
    icon: "✉️",
    width: 800,
    height: 500,
    singleton: true,
    category: "productivity",
    component: () => import("./Mail.js"),
  });
}
