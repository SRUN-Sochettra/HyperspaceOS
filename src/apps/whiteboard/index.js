import Registry from '../../core/Registry.js'

export default function registerWhiteboard() {
    Registry.register('whiteboard', {
        title: 'Whiteboard',
        icon: '🎨',
        width: 700,
        height: 500,
        category: 'productivity',
        component: () => import('./Whiteboard.js'),
    })
}