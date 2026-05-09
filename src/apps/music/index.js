import Registry from '../../core/Registry.js'

export default function registerMusic() {
    Registry.register('music', {
        title: 'Music',
        icon: '🎵',
        width: 340,
        height: 500,
        singleton: true,
        category: 'media',
        component: () => import('./MusicPlayer.js'),
    })
}