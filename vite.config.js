import { defineConfig } from 'vite'

export default defineConfig({
    // Each app folder becomes its own lazy chunk
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('/apps/')) {
                        return 'app-' + id.split('/apps/')[1].split('/')[0]
                    }
                    if (id.includes('/core/')) return 'core'
                    if (id.includes('/wm/')) return 'wm'
                    if (id.includes('/ui/')) return 'ui'
                }
            }
        }
    }
})