import Registry from '../../core/Registry.js'

export default function registerCalculator() {
    Registry.register('calculator', {
        title: 'Calculator',
        icon: '🧮',
        width: 300,
        height: 460,
        singleton: true,
        category: 'utility',
        component: () => import('./Calculator.js'),
    })
}