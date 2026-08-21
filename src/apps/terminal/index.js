import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'

export default function registerTerminal() {
    Registry.register('terminal', {
        title: 'Terminal',
        icon: icon('terminal'),
        width: 580,
        height: 400,
        minWidth: 400,
        minHeight: 250,
        singleton: false,
        category: 'system',
        component: () => import('./Terminal.js'),
    })
}