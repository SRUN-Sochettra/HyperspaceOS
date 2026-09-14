import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'

export default function registerVideo() {
  Registry.register('video', {
    title: 'Video Player',
    icon: icon('video'),
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    singleton: true,
    category: 'media',
    component: () => import('./Video.js'),
  })
}
