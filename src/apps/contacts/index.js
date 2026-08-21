import { icon } from '../../ui/Icons.js'
import Registry from '../../core/Registry.js'

export default function registerContacts() {
  Registry.register('contacts', {
    title: 'Contacts',
    icon: icon('contacts'),
    width: 400,
    height: 500,
    singleton: true,
    category: 'utility',
    component: () => import('./Contacts.js'),
  })
}
