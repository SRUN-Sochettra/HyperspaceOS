import Registry from "../../core/Registry.js";

export default function registerGames() {
  Registry.register("games", {
    title: "Games",
    icon: "🎮",
    width: 400,
    height: 440,
    minWidth: 400,
    minHeight: 440,
    singleton: true,
    category: "media",
    component: () => import("./Games.js"),
  });
}
