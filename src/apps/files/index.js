import Registry from '../../core/Registry.js'

export default function registerFiles() {
    Registry.register('files', {
        title: 'Files',
        icon: '📁',
        width: 520,
        height: 400,
        category: 'system',
        component: () => import('./Files.js'),
    })
}