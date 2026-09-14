<<<<<<< HEAD
import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'

export default function registerCalculator() {
    Registry.register('calculator', {
        title: 'Calculator',
        icon: icon('calculator'),
        width: 300,
        height: 460,
        singleton: true,
        category: 'utility',
        component: () => import('./Calculator.js'),
    })
}
=======
import Registry from "../../core/Registry.js";

export default function registerCalculator() {
  Registry.register("calculator", {
    title: "Calculator",
    icon: "🧮",
    width: 300,
    height: 460,
    singleton: true,
    category: "utility",
    component: () => import("./Calculator.js"),
  });
}
>>>>>>> origin/main
