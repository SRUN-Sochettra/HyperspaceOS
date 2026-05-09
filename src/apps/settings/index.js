import Registry from '../../core/Registry.js'

export default function registerSettings() {
    Registry.register('settings', {
        title: 'Settings',
        icon: '⚙️',
        width: 440,
        height: 480,
        singleton: true,
        category: 'system',
        component: () => import('./Settings.js'),
    })
}