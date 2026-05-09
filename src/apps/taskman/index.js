import Registry from '../../core/Registry.js'

export default function registerTaskManager() {
    Registry.register('taskman', {
        title: 'Task Manager',
        icon: '📋',
        width: 480,
        height: 400,
        singleton: true,
        category: 'system',
        component: () => import('./TaskManager.js'),
    })
}