import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'

export default function registerCamera() {
  Registry.register('camera', {
    title: 'Camera',
    icon: icon('camera'),
    width: 600,
    height: 500,
    minWidth: 400,
    minHeight: 350,
    category: 'media',
    component: () => import('./Camera.js'),
  })
}
