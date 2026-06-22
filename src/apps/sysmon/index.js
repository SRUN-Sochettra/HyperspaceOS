import Registry from "../../core/Registry.js";

export default function registerSysmon() {
  Registry.register("sysmon", {
    title: "System Monitor",
    icon: "📊",
    width: 500,
    height: 380,
    category: "system",
    component: () => import("./SysMonitor.js"),
  });
}
