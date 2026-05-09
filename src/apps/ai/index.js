import Registry from '../../core/Registry.js'

export default function registerAI() {
    Registry.register('ai', {
        title: 'AI Assistant',
        icon: '🤖',
        width: 420,
        height: 480,
        singleton: true,
        category: 'utility',
        component: () => import('./AI.js'),
    })
}