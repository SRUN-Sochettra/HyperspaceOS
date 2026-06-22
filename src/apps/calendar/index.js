import Registry from '../../core/Registry.js'

export default function registerCalendar() {
    Registry.register('calendar', {
        title: 'Calendar',
        icon: '📅',
        width: 400,
        height: 500,
        minWidth: 350,
        minHeight: 400,
        singleton: true,
        category: 'productivity',
        component: () => import('./Calendar.js'),
    })
}
