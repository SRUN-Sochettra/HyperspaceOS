import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'

export default function registerNotes() {
    Registry.register('notes', {
        title: 'Notes',
        icon: icon('notes'),
        width: 540,
        height: 420,
        category: 'productivity',
        component: () => import('./Notes.js'),
    })
}