import Registry from '../../core/Registry.js'

export default function registerWeather() {
    Registry.register('weather', {
        title: 'Weather',
        icon: '🌤️',
        width: 340,
        height: 440,
        singleton: true,
        category: 'utility',
        component: () => import('./Weather.js'),
    })
}