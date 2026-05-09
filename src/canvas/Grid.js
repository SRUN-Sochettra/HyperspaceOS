// ============================================================
//  Grid.js — Perspective grid floor
//  A CSS-only 3D grid that scrolls infinitely, creating
//  a retro-futuristic ground plane effect.
//
//  Why CSS instead of canvas?
//  - repeating-linear-gradient is perfectly suited for infinite grids
//  - CSS 3D transform (rotateX) handles the perspective
//  - CSS animation handles the scroll
//  - Zero JS computation per frame
// ============================================================

import Store from '../core/Store.js'

const Grid = (() => {

    let container = null
    let gridElement = null

    function init() {
        container = document.getElementById('environment-layer')
        if (!container) {
            console.warn('[Grid] #environment-layer not found')
            return
        }

        // Create grid floor element
        gridElement = document.createElement('div')
        gridElement.className = 'grid-floor'
        container.appendChild(gridElement)

        // React to accent color changes for grid tint
        Store.subscribe('settings.accentColor', (color) => {
            updateGridColor(color)
        })

        console.log('[Grid] Initialized')
    }

    function updateGridColor(hexColor) {
        if (!gridElement) return

        // Convert hex to rgba with low opacity for grid lines
        const r = parseInt(hexColor.slice(1, 3), 16)
        const g = parseInt(hexColor.slice(3, 5), 16)
        const b = parseInt(hexColor.slice(5, 7), 16)
        const gridColor = `rgba(${r}, ${g}, ${b}, 0.06)`

        gridElement.style.background = `
      repeating-linear-gradient(
        90deg,
        ${gridColor} 0px,
        ${gridColor} 1px,
        transparent 1px,
        transparent 80px
      ),
      repeating-linear-gradient(
        0deg,
        ${gridColor} 0px,
        ${gridColor} 1px,
        transparent 1px,
        transparent 80px
      )
    `
    }

    function destroy() {
        if (gridElement && gridElement.parentNode) {
            gridElement.remove()
        }
        gridElement = null
        console.log('[Grid] Destroyed')
    }

    return { init, destroy }

})()

export default Grid