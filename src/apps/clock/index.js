import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'
import './clock.css'

export default function registerClock() {
  Registry.register('clock', {
    title: 'Clock',
    icon: icon('clock'),
    width: 400,
    height: 500,
    singleton: true,
    category: 'utility',
    component: () => import('./Clock.js'),
  })
}
