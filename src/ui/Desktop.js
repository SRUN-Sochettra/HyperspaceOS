import FileSystem from '../core/FileSystem.js'
import EventBus from '../core/EventBus.js'
import Registry from '../core/Registry.js'
import { icon } from './Icons.js'

const Desktop = (() => {

    let container = null

    function init() {
        // Create our own container — don't use environment-layer
        container = document.createElement('div')
        container.id = 'desktop-icons-layer'
        container.className = 'desktop-icons-layer'

        // Insert after environment-layer but before window-layer
        const windowLayer = document.getElementById('window-layer')
        if (windowLayer) {
            windowLayer.parentNode.insertBefore(container, windowLayer)
        } else {
            document.body.appendChild(container)
        }

        // Ensure Desktop directory exists
        if (!FileSystem.isDir('/home/root/Desktop')) {
            FileSystem.mkdir('/home/root/Desktop')
        }

        // Add some default desktop items if empty
        const items = FileSystem.readdir('/home/root/Desktop') || []
        if (items.length === 0) {
            FileSystem.writeFile('/home/root/Desktop/Welcome.md',
                '# Welcome to HyperSpace\n\nDouble-click this file to open it in the editor.\n\nTry right-clicking the desktop for more options!\n')
            FileSystem.writeFile('/home/root/Desktop/Notes.md',
                '# Quick Notes\n\nWrite anything here.\n')
        }

        render()

        // Re-render when filesystem changes
        EventBus.on('fs:change', ({ path, type }) => {
            // Only re-render if change is in Desktop folder
            if (!path || path.startsWith('/home/root/Desktop')) {
                render()
            }
        })

        console.log('[Desktop] Initialized')
    }

    function render() {
        if (!container) return

        const items = FileSystem.readdir('/home/root/Desktop') || []

        container.innerHTML = items.map(item => `
      <div class="desktop-icon" 
           draggable="true"
           data-path="${item.path}" 
           data-name="${item.name}" 
           data-type="${item.type}">
        <div class="desktop-icon-visual">${getIcon(item)}</div>
        <div class="desktop-icon-label">${item.name}</div>
      </div>
    `).join('')

        bindEvents()
    }

    function bindEvents() {
        container.querySelectorAll('.desktop-icon').forEach(el => {
            const path = el.dataset.path
            const name = el.dataset.name
            const type = el.dataset.type

            // Double-click to open
            el.addEventListener('dblclick', () => {
                if (type === 'dir') {
                    // Open Files app
                    Registry.launch('files')
                } else {
                    // Open in editor
                    const content = FileSystem.readFile(path)
                    if (content !== null) {
                        EventBus.emit('editor:queueFile', { path, content })
                        EventBus.emit('editor:openFile', { path, content })
                        Registry.launch('editor')
                    }
                }
            })

            // Right-click
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault()
                e.stopPropagation()
                showIconContextMenu(e.clientX, e.clientY, path, name, type)
            })

            // Click to select
            el.addEventListener('click', () => {
                container.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'))
                el.classList.add('selected')
            })
        })

        // Click desktop background to deselect
        container.addEventListener('click', (e) => {
            if (e.target === container) {
                container.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'))
            }
        })

        // Right-click desktop background
        container.addEventListener('contextmenu', (e) => {
            if (e.target !== container) return
            e.preventDefault()
            showDesktopContextMenu(e.clientX, e.clientY)
        })
    }

    function showIconContextMenu(x, y, path, name, type) {
        removeMenu()

        const items = [
            {
                icon: icon('files'), label: 'Open', action: () => {
                    if (type === 'dir') {
                        Registry.launch('files')
                    } else {
                        const content = FileSystem.readFile(path)
                        EventBus.emit('editor:queueFile', { path, content })
                        EventBus.emit('editor:openFile', { path, content })
                        Registry.launch('editor')
                    }
                }
            },
            { type: 'separator' },
            {
                icon: icon('editor'), label: 'Rename', action: () => {
                    const newName = prompt('Rename to:', name)
                    if (newName && newName !== name) {
                        const newPath = FileSystem.join('/home/root/Desktop', newName)
                        FileSystem.mv(path, newPath)
                    }
                }
            },
            {
                icon: icon('close'), label: 'Delete', action: () => {
                    if (confirm(`Delete "${name}"?`)) {
                        FileSystem.rm(path, true)
                    }
                }
            },
        ]

        createMenu(x, y, items)
    }

    function showDesktopContextMenu(x, y) {
        removeMenu()

        const items = [
            {
                icon: icon('file'), label: 'New File', action: () => {
                    const name = prompt('File name:')
                    if (name) FileSystem.writeFile(FileSystem.join('/home/root/Desktop', name), '')
                }
            },
            {
                icon: icon('folder'), label: 'New Folder', action: () => {
                    const name = prompt('Folder name:')
                    if (name) FileSystem.mkdir(FileSystem.join('/home/root/Desktop', name))
                }
            },
            { type: 'separator' },
            { icon: icon('terminal'), label: 'Open Terminal', action: () => Registry.launch('terminal') },
            { icon: icon('settings'), label: 'Settings', action: () => Registry.launch('settings') },
            { type: 'separator' },
            { icon: icon('maximize'), label: 'Tile Windows', action: () => EventBus.emit('window:tile') },
        ]

        createMenu(x, y, items)
    }

    function createMenu(x, y, items) {
        const menu = document.createElement('div')
        menu.className = 'context-menu'
        menu.style.position = 'fixed'
        menu.style.zIndex = '99999'
        menu.style.left = Math.min(x, window.innerWidth - 220) + 'px'
        menu.style.top = Math.min(y, window.innerHeight - items.length * 36) + 'px'

        menu.innerHTML = items.map(item => {
            if (item.type === 'separator') return '<div class="ctx-separator"></div>'
            return `<div class="ctx-item"><span class="ctx-item-icon">${item.icon}</span><span class="ctx-item-label">${item.label}</span></div>`
        }).join('')

        const actionItems = items.filter(i => i.type !== 'separator')
        let idx = 0
        menu.querySelectorAll('.ctx-item').forEach(el => {
            const action = actionItems[idx]?.action
            idx++
            if (action) {
                el.addEventListener('click', () => { action(); removeMenu() })
            }
        })

        document.body.appendChild(menu)
        window._desktopMenu = menu

        const close = (e) => {
            if (!menu.contains(e.target)) {
                removeMenu()
                document.removeEventListener('mousedown', close, true)
            }
        }
        setTimeout(() => document.addEventListener('mousedown', close, true), 10)
    }

    function removeMenu() {
        if (window._desktopMenu) {
            window._desktopMenu.remove()
            window._desktopMenu = null
        }
    }

    function getIcon(item) {
        if (item.type === 'dir') return icon('folder')
        const ext = item.name.split('.').pop()?.toLowerCase()
        const map = {
            md: 'notes', txt: 'file', js: 'editor', json: 'files', css: 'files',
            html: 'files', log: 'sysmon', py: 'editor', sh: 'terminal',
        }
    }

    return { init }

})()

export default Desktop