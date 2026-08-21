import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'

export default function registerFiles() {
    Registry.register('files', {
        title: 'Files',
        icon: icon('files'),
        width: 520,
        height: 400,
        category: 'system',
        component: () => import('./Files.js'),
    })
}
