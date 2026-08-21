import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'

export default function registerPhotos() {
  Registry.register('photos', {
    title: 'Photos',
    icon: icon('photos'),
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    singleton: true,
    category: 'media',
    component: () => import('./Photos.js'),
  })
}
