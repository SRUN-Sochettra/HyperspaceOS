// ============================================================
//  DragDropController.js — File drag & drop
//  Handles dragging files from the Files app between folders.
//  Shows a ghost preview while dragging.
// ============================================================

import FileSystem from '../core/FileSystem.js'
import EventBus from '../core/EventBus.js'

const DragDropController = (() => {

    let dragData = null
    let ghost = null
    let dropTarget = null

    function init() {
        document.addEventListener('dragstart', onDragStart)
        document.addEventListener('dragover', onDragOver)
        document.addEventListener('dragleave', onDragLeave)
        document.addEventListener('drop', onDrop)
        document.addEventListener('dragend', onDragEnd)

        console.log('[DragDrop] Initialized')
    }

    function onDragStart(e) {
        const item = e.target.closest('.fm-item[data-path]')
        if (!item) return

        const path = item.dataset.path
        const name = item.dataset.name
        const type = item.dataset.type

        dragData = { path, name, type }

        // Set drag image
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', path)

        // Create ghost
        ghost = document.createElement('div')
        ghost.className = 'drag-ghost'
        ghost.innerHTML = `
      <span>${item.querySelector('.fm-item-icon')?.textContent || 'file'}</span>
      <span>${name}</span>
    `
        document.body.appendChild(ghost)
        e.dataTransfer.setDragImage(ghost, 20, 20)

        // Slight delay to set opacity
        requestAnimationFrame(() => {
            item.style.opacity = '0.4'
        })
    }

    function onDragOver(e) {
        if (!dragData) return

        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'

        // Check if hovering over a folder item
        const item = e.target.closest('.fm-item[data-type="dir"]')
        const grid = e.target.closest('.fm-grid')

        // Remove previous highlights
        document.querySelectorAll('.fm-item.drop-target').forEach(el => {
            el.classList.remove('drop-target')
        })

        if (item && item.dataset.path !== dragData.path) {
            item.classList.add('drop-target')
            dropTarget = item.dataset.path
        } else if (grid) {
            // Dropping on the grid itself (current folder)
            dropTarget = null
        } else {
            dropTarget = null
        }
    }

    function onDragLeave(e) {
        const item = e.target.closest('.fm-item')
        if (item) item.classList.remove('drop-target')
    }

    function onDrop(e) {
        if (!dragData) return
        e.preventDefault()

        // Clean up highlights
        document.querySelectorAll('.fm-item.drop-target, .fm-item[style*="opacity"]').forEach(el => {
            el.classList.remove('drop-target')
            el.style.opacity = ''
        })

        if (dropTarget && dropTarget !== dragData.path) {
            // Move file to the target folder
            const destPath = FileSystem.join(dropTarget, dragData.name)

            if (FileSystem.exists(destPath)) {
                EventBus.emit('notification:show', {
                    icon: 'Warning',
                    title: 'Cannot Move',
                    body: `"${dragData.name}" already exists in destination`,
                })
            } else {
                const result = FileSystem.mv(dragData.path, destPath)
                if (result.error) {
                    EventBus.emit('notification:show', {
                        icon: 'Error',
                        title: 'Move Failed',
                        body: result.error,
                    })
                } else {
                    EventBus.emit('notification:show', {
                        icon: 'archive',
                        title: 'Moved',
                        body: `${dragData.name} → ${FileSystem.basename(dropTarget)}/`,
                    })
                }
            }
        }

        cleanup()
    }

    function onDragEnd() {
        // Clean up even if drop was cancelled
        document.querySelectorAll('.fm-item[style*="opacity"]').forEach(el => {
            el.style.opacity = ''
        })
        document.querySelectorAll('.fm-item.drop-target').forEach(el => {
            el.classList.remove('drop-target')
        })
        cleanup()
    }

    function cleanup() {
        if (ghost && ghost.parentNode) ghost.remove()
        ghost = null
        dragData = null
        dropTarget = null
    }

    function destroy() {
        document.removeEventListener('dragstart', onDragStart)
        document.removeEventListener('dragover', onDragOver)
        document.removeEventListener('dragleave', onDragLeave)
        document.removeEventListener('drop', onDrop)
        document.removeEventListener('dragend', onDragEnd)
        cleanup()
    }

    return { init, destroy }

})()

export default DragDropController