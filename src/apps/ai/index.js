import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'

export default function registerAI() {
    Registry.register('ai', {
        title: 'Command Assistant',
        icon: icon('assistant'),
        width: 420,
        height: 480,
        singleton: true,
        category: 'utility',
        component: () => import('./AI.js'),
    })
}
