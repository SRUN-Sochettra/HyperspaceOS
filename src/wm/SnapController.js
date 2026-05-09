// ============================================================
//  SnapController.js — Window snap zones
//  Drag to screen edges to snap:
//    - Top edge: maximize
//    - Left edge: left half
//    - Right edge: right half
//    - Corners: quarter screen
//  Shows a preview overlay while dragging near edges.
// ============================================================

import EventBus from '../core/EventBus.js'

const SnapController = (() => {

    let preview = null
    let currentZone = null
    let enabled = true

    const EDGE_THRESHOLD = 8   // px from edge to trigger
    const CORNER_SIZE = 80      // px from corner to trigger corner snap

    const ZONES = {
        left: { x: 0, y: 32, w: 0.5, h: 1, label: 'Left Half' },
        right: { x: 0.5, y: 32, w: 0.5, h: 1, label: 'Right Half' },
        top: { x: 0, y: 32, w: 1, h: 1, label: 'Maximize' },
        topLeft: { x: 0, y: 32, w: 0.5, h: 0.5, label: 'Top Left' },
        topRight: { x: 0.5, y: 32, w: 0.5, h: 0.5, label: 'Top Right' },
        bottomLeft: { x: 0, y: 0.5, w: 0.5, h: 0.5, label: 'Bottom Left' },
        bottomRight: { x: 0.5, y: 0.5, w: 0.5, h: 0.5, label: 'Bottom Right' },
    }

    function init() {
        // Create preview element
        preview = document.createElement('div')
        preview.className = 'snap-preview'
        preview.style.display = 'none'
        document.body.appendChild(preview)

        console.log('[SnapController] Initialized')
    }

    // Called by DragController during mousemove
    function check(mouseX, mouseY) {
        if (!enabled) return null

        const zone = detectZone(mouseX, mouseY)

        if (zone !== currentZone) {
            currentZone = zone
            if (zone) {
                showPreview(zone)
            } else {
                hidePreview()
            }
        }

        return zone
    }

    function detectZone(x, y) {
        const w = window.innerWidth
        const h = window.innerHeight
        const statusH = 32
        const dockH = 76

        const nearLeft = x <= EDGE_THRESHOLD
        const nearRight = x >= w - EDGE_THRESHOLD
        const nearTop = y <= EDGE_THRESHOLD + statusH
        const nearBottom = y >= h - EDGE_THRESHOLD

        const inTopCorner = y <= statusH + CORNER_SIZE
        const inBottomCorner = y >= h - dockH - CORNER_SIZE

        // Corners first (more specific)
        if (nearLeft && inTopCorner) return 'topLeft'
        if (nearRight && inTopCorner) return 'topRight'
        if (nearLeft && inBottomCorner) return 'bottomLeft'
        if (nearRight && inBottomCorner) return 'bottomRight'

        // Edges
        if (nearTop) return 'top'
        if (nearLeft) return 'left'
        if (nearRight) return 'right'

        return null
    }

    function showPreview(zoneName) {
        if (!preview) return

        const zone = ZONES[zoneName]
        if (!zone) return

        const w = window.innerWidth
        const h = window.innerHeight
        const statusH = 32
        const dockH = 76
        const availH = h - statusH - dockH
        const pad = 6

        let left, top, width, height

        if (zoneName === 'top') {
            // Maximize
            left = pad
            top = statusH + pad
            width = w - pad * 2
            height = availH - pad * 2
        } else {
            // Calculate from zone ratios
            left = zone.x * w + pad
            top = (typeof zone.y === 'number' && zone.y < 1
                ? (zone.y === 32 ? statusH : zone.y * availH + statusH)
                : statusH) + pad
            width = zone.w * w - pad * 2
            height = zone.h * availH - pad * 2

            // Fix y for bottom zones
            if (zoneName === 'bottomLeft' || zoneName === 'bottomRight') {
                top = statusH + availH * 0.5 + pad
                height = availH * 0.5 - pad * 2
            }
            // Fix y for top quarter zones
            if (zoneName === 'topLeft' || zoneName === 'topRight') {
                top = statusH + pad
                height = availH * 0.5 - pad * 2
            }
            // Fix y for full-height halves
            if (zoneName === 'left' || zoneName === 'right') {
                top = statusH + pad
                height = availH - pad * 2
            }
        }

        preview.style.left = `${left}px`
        preview.style.top = `${top}px`
        preview.style.width = `${width}px`
        preview.style.height = `${height}px`
        preview.style.display = 'block'
        preview.dataset.zone = zoneName
    }

    function hidePreview() {
        if (preview) {
            preview.style.display = 'none'
            preview.dataset.zone = ''
        }
        currentZone = null
    }

    // Called by DragController on mouseup — returns snap bounds or null
    function resolve() {
        const zone = currentZone
        hidePreview()

        if (!zone) return null

        const w = window.innerWidth
        const h = window.innerHeight
        const statusH = 32
        const dockH = 76
        const availH = h - statusH - dockH
        const pad = 6

        const bounds = {}

        switch (zone) {
            case 'top':
                bounds.x = pad; bounds.y = statusH + pad
                bounds.width = w - pad * 2; bounds.height = availH - pad * 2
                break
            case 'left':
                bounds.x = pad; bounds.y = statusH + pad
                bounds.width = w / 2 - pad * 1.5; bounds.height = availH - pad * 2
                break
            case 'right':
                bounds.x = w / 2 + pad * 0.5; bounds.y = statusH + pad
                bounds.width = w / 2 - pad * 1.5; bounds.height = availH - pad * 2
                break
            case 'topLeft':
                bounds.x = pad; bounds.y = statusH + pad
                bounds.width = w / 2 - pad * 1.5; bounds.height = availH / 2 - pad * 1.5
                break
            case 'topRight':
                bounds.x = w / 2 + pad * 0.5; bounds.y = statusH + pad
                bounds.width = w / 2 - pad * 1.5; bounds.height = availH / 2 - pad * 1.5
                break
            case 'bottomLeft':
                bounds.x = pad; bounds.y = statusH + availH / 2 + pad * 0.5
                bounds.width = w / 2 - pad * 1.5; bounds.height = availH / 2 - pad * 1.5
                break
            case 'bottomRight':
                bounds.x = w / 2 + pad * 0.5; bounds.y = statusH + availH / 2 + pad * 0.5
                bounds.width = w / 2 - pad * 1.5; bounds.height = availH / 2 - pad * 1.5
                break
        }

        return bounds
    }

    function destroy() {
        if (preview && preview.parentNode) preview.remove()
        preview = null
        currentZone = null
    }

    return { init, check, resolve, hidePreview, destroy }

})()

export default SnapController