// ============================================================
//  FileSystem.js — Virtual file system with persistence
//  Real CRUD: create, read, update, delete files/folders
//  Persisted to LocalStorage. Used by Files app, Terminal,
//  Notes (saves to files), Editor (opens real files).
// ============================================================

import EventBus from './EventBus.js'

const STORAGE_KEY = 'hyperspace-fs'

const FileSystem = (() => {

    let tree = {}

    // ---- INIT ----
    function init() {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                tree = JSON.parse(saved)
                console.log('[FileSystem] Restored from storage')
            } catch {
                tree = createDefaultTree()
            }
        } else {
            tree = createDefaultTree()
        }
    }

    function createDefaultTree() {
        return {
            '/': { type: 'dir', children: ['home', 'usr', 'etc', 'tmp'], created: Date.now() },
            '/home': { type: 'dir', children: ['root'], created: Date.now() },
            '/usr': { type: 'dir', children: [], created: Date.now() },
            '/etc': { type: 'dir', children: ['hostname', 'motd'], created: Date.now() },
            '/etc/hostname': { type: 'file', content: 'hyperspace-mainframe', size: 22, created: Date.now(), modified: Date.now() },
            '/etc/motd': { type: 'file', content: 'Welcome to HyperSpace v2.0\nType "help" for available commands.\n', size: 56, created: Date.now(), modified: Date.now() },
            '/tmp': { type: 'dir', children: [], created: Date.now() },
            '/home/root': { type: 'dir', children: ['Desktop', 'Documents', 'Downloads', 'Music', 'Projects', 'Pictures', '.config', '.bashrc', '.ssh', 'README.md', 'system.log'], created: Date.now() },
            '/home/root/Desktop': { type: 'dir', children: [], created: Date.now() },
            '/home/root/Documents': { type: 'dir', children: ['report.md', 'budget.txt'], created: Date.now() },
            '/home/root/Documents/report.md': { type: 'file', content: '# Quarterly Report\n\n## Summary\nAll systems operational.\n\n## Metrics\n- Uptime: 99.9%\n- Active users: 1\n- Windows opened: many\n', size: 142, created: Date.now(), modified: Date.now() },
            '/home/root/Documents/budget.txt': { type: 'file', content: 'Item              Cost\n──────────────────────\nThree.js          Free\nCodeMirror        Free\nuPlot             Free\nCoffee            $4.50\n──────────────────────\nTotal             $4.50\n', size: 180, created: Date.now(), modified: Date.now() },
            '/home/root/Downloads': { type: 'dir', children: [], created: Date.now() },
            '/home/root/Music': { type: 'dir', children: ['playlist.txt'], created: Date.now() },
            '/home/root/Music/playlist.txt': { type: 'file', content: '1. Neon Dreams - HyperSpace Radio\n2. Digital Horizons - CyberWave\n3. Pixel Storm - ByteBeats\n4. Glass Memories - NeonDrift\n5. Quantum Loop - SynthOS\n', size: 156, created: Date.now(), modified: Date.now() },
            '/home/root/Projects': { type: 'dir', children: ['hyperspace-os', 'experiments'], created: Date.now() },
            '/home/root/Projects/hyperspace-os': { type: 'dir', children: ['main.js', 'README.md'], created: Date.now() },
            '/home/root/Projects/hyperspace-os/main.js': { type: 'file', content: '// HyperSpace Entry Point\nimport { boot } from \'./core/OS.js\'\n\nboot()\n', size: 68, created: Date.now(), modified: Date.now() },
            '/home/root/Projects/hyperspace-os/README.md': { type: 'file', content: '# HyperSpace\n\nA web-based operating system built with vanilla JavaScript.\n\n## Features\n- Window manager\n- Terminal with 27+ commands\n- 9 built-in apps\n- Three.js background\n- Virtual file system\n', size: 198, created: Date.now(), modified: Date.now() },
            '/home/root/Projects/experiments': { type: 'dir', children: [], created: Date.now() },
            '/home/root/Pictures': { type: 'dir', children: [], created: Date.now() },
            '/home/root/.config': { type: 'dir', children: ['theme.json'], created: Date.now() },
            '/home/root/.config/theme.json': { type: 'file', content: '{\n  "accent": "#00f5ff",\n  "particles": true,\n  "animations": true\n}\n', size: 68, created: Date.now(), modified: Date.now() },
            '/home/root/.bashrc': { type: 'file', content: '# HyperSpace bash config\nexport PS1="\\u@hyperspace:\\w$ "\nexport EDITOR=vim\nalias ll="ls -la"\nalias cls="clear"\n\necho "Welcome to HyperSpace"\n', size: 140, created: Date.now(), modified: Date.now() },
            '/home/root/.ssh': { type: 'dir', children: ['known_hosts'], created: Date.now() },
            '/home/root/.ssh/known_hosts': { type: 'file', content: '# Known hosts\n', size: 14, created: Date.now(), modified: Date.now() },
            '/home/root/README.md': { type: 'file', content: '# Home Directory\n\nThis is the root user home folder.\n\nFeel free to create, edit, and delete files using:\n- The **Terminal** (`touch`, `mkdir`, `rm`, `echo > file`)\n- The **Files** app (double-click, right-click)\n- The **Editor** app (open files to edit)\n', size: 230, created: Date.now(), modified: Date.now() },
            '/home/root/system.log': { type: 'file', content: `[${new Date().toISOString()}] BOOT: System initialized\n[${new Date().toISOString()}] FS: File system mounted\n`, size: 100, created: Date.now(), modified: Date.now() },
        }
    }

    // ---- SAVE ----
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tree))
        } catch (e) {
            console.warn('[FileSystem] Save failed:', e.message)
        }
    }

    // ---- PATH HELPERS ----
    function normalize(path) {
        // Remove trailing slash, handle double slashes
        let p = path.replace(/\/+/g, '/').replace(/\/$/, '')
        if (!p) p = '/'
        return p
    }

    function parentPath(path) {
        const parts = path.split('/')
        parts.pop()
        return parts.join('/') || '/'
    }

    function basename(path) {
        return path.split('/').pop()
    }

    function join(...parts) {
        return normalize(parts.join('/'))
    }

    // ---- EXISTS ----
    function exists(path) {
        return tree[normalize(path)] !== undefined
    }

    // ---- STAT ----
    function stat(path) {
        const node = tree[normalize(path)]
        if (!node) return null
        return { ...node, path: normalize(path), name: basename(path) }
    }

    // ---- IS DIR ----
    function isDir(path) {
        const node = tree[normalize(path)]
        return node?.type === 'dir'
    }

    // ---- IS FILE ----
    function isFile(path) {
        const node = tree[normalize(path)]
        return node?.type === 'file'
    }

    // ---- READ DIR ----
    function readdir(path) {
        const p = normalize(path)
        const node = tree[p]
        if (!node || node.type !== 'dir') return null

        return (node.children || []).map(name => {
            const childPath = join(p, name)
            const child = tree[childPath]
            return {
                name,
                path: childPath,
                type: child?.type || 'file',
                size: child?.size || 0,
                created: child?.created || Date.now(),
                modified: child?.modified || Date.now(),
            }
        }).sort((a, b) => {
            // Dirs first, then alpha
            if (a.type === 'dir' && b.type !== 'dir') return -1
            if (a.type !== 'dir' && b.type === 'dir') return 1
            return a.name.localeCompare(b.name)
        })
    }

    // ---- READ FILE ----
    function readFile(path) {
        const node = tree[normalize(path)]
        if (!node || node.type !== 'file') return null
        return node.content
    }

    // ---- WRITE FILE ----
    function writeFile(path, content) {
        const p = normalize(path)
        const name = basename(p)
        const parent = parentPath(p)

        // Ensure parent exists
        if (!tree[parent] || tree[parent].type !== 'dir') {
            return { error: `Parent directory not found: ${parent}` }
        }

        const existing = tree[p]

        tree[p] = {
            type: 'file',
            content: String(content),
            size: String(content).length,
            created: existing?.created || Date.now(),
            modified: Date.now(),
        }

        // Add to parent's children if new
        if (!tree[parent].children.includes(name)) {
            tree[parent].children.push(name)
        }

        save()
        EventBus.emit('fs:change', { type: 'write', path: p })
        return { success: true, path: p }
    }

    // ---- MKDIR ----
    function mkdir(path) {
        const p = normalize(path)
        const name = basename(p)
        const parent = parentPath(p)

        if (tree[p]) {
            return { error: `Already exists: ${p}` }
        }

        if (!tree[parent] || tree[parent].type !== 'dir') {
            return { error: `Parent directory not found: ${parent}` }
        }

        tree[p] = {
            type: 'dir',
            children: [],
            created: Date.now(),
        }

        tree[parent].children.push(name)

        save()
        EventBus.emit('fs:change', { type: 'mkdir', path: p })
        return { success: true, path: p }
    }

    // ---- REMOVE ----
    function rm(path, recursive = false) {
        const p = normalize(path)

        if (p === '/' || p === '/home' || p === '/home/root') {
            return { error: 'Cannot delete system directory' }
        }

        const node = tree[p]
        if (!node) {
            return { error: `Not found: ${p}` }
        }

        if (node.type === 'dir' && node.children.length > 0 && !recursive) {
            return { error: `Directory not empty: ${p} (use -r for recursive)` }
        }

        // Recursive delete
        if (node.type === 'dir' && recursive) {
            for (const child of [...node.children]) {
                rm(join(p, child), true)
            }
        }

        // Remove from parent
        const parent = parentPath(p)
        const name = basename(p)
        if (tree[parent]?.children) {
            tree[parent].children = tree[parent].children.filter(c => c !== name)
        }

        delete tree[p]

        save()
        EventBus.emit('fs:change', { type: 'rm', path: p })
        return { success: true }
    }

    // ---- RENAME / MOVE ----
    function mv(from, to) {
        const fromP = normalize(from)
        const toP = normalize(to)

        if (!tree[fromP]) {
            return { error: `Not found: ${fromP}` }
        }

        if (tree[toP]) {
            return { error: `Already exists: ${toP}` }
        }

        // Copy node
        tree[toP] = { ...tree[fromP] }

        // If dir, update all children paths recursively
        if (tree[fromP].type === 'dir') {
            const renamePaths = (oldBase, newBase) => {
                const children = tree[newBase]?.children || []
                for (const child of children) {
                    const oldChild = join(oldBase, child)
                    const newChild = join(newBase, child)
                    if (tree[oldChild]) {
                        tree[newChild] = { ...tree[oldChild] }
                        delete tree[oldChild]
                        if (tree[newChild].type === 'dir') {
                            renamePaths(oldChild, newChild)
                        }
                    }
                }
            }
            renamePaths(fromP, toP)
        }

        // Remove from old parent, add to new parent
        const oldParent = parentPath(fromP)
        const newParent = parentPath(toP)
        const oldName = basename(fromP)
        const newName = basename(toP)

        if (tree[oldParent]?.children) {
            tree[oldParent].children = tree[oldParent].children.filter(c => c !== oldName)
        }
        if (tree[newParent]?.children && !tree[newParent].children.includes(newName)) {
            tree[newParent].children.push(newName)
        }

        delete tree[fromP]

        save()
        EventBus.emit('fs:change', { type: 'mv', from: fromP, to: toP })
        return { success: true }
    }

    // ---- COPY ----
    function cp(from, to) {
        const fromP = normalize(from)
        const toP = normalize(to)

        const node = tree[fromP]
        if (!node) return { error: `Not found: ${fromP}` }

        if (node.type === 'file') {
            return writeFile(toP, node.content)
        }

        // Copy dir recursively
        mkdir(toP)
        for (const child of node.children || []) {
            cp(join(fromP, child), join(toP, child))
        }

        return { success: true }
    }

    // ---- SEARCH ----
    function find(basePath, pattern) {
        const results = []
        const regex = new RegExp(pattern, 'i')

        for (const path of Object.keys(tree)) {
            if (path.startsWith(normalize(basePath)) && regex.test(basename(path))) {
                results.push({
                    path,
                    name: basename(path),
                    type: tree[path].type,
                })
            }
        }

        return results
    }

    // ---- DISK USAGE ----
    function du(path) {
        const p = normalize(path)
        let totalSize = 0
        let fileCount = 0
        let dirCount = 0

        for (const [nodePath, node] of Object.entries(tree)) {
            if (nodePath.startsWith(p)) {
                if (node.type === 'file') {
                    totalSize += node.size || 0
                    fileCount++
                } else {
                    dirCount++
                }
            }
        }

        return { totalSize, fileCount, dirCount }
    }

    // ---- APPEND TO LOG ----
    function appendLog(message) {
        const logPath = '/home/root/system.log'
        const existing = readFile(logPath) || ''
        const timestamp = new Date().toISOString()
        writeFile(logPath, existing + `[${timestamp}] ${message}\n`)
    }

    // ---- DEBUG ----
    function debug() {
        console.group('[FileSystem] Tree')
        const paths = Object.keys(tree).sort()
        for (const p of paths) {
            const node = tree[p]
            const indent = '  '.repeat(p.split('/').length - 1)
            if (node.type === 'dir') {
                console.log(`${indent}folder ${basename(p)}/  (${node.children.length} items)`)
            } else {
                console.log(`${indent}file ${basename(p)}  (${node.size}B)`)
            }
        }
        console.groupEnd()
    }

    // ---- RESET ----
    function reset() {
        tree = createDefaultTree()
        save()
        EventBus.emit('fs:change', { type: 'reset' })
    }

    return {
        init, save, reset,
        exists, stat, isDir, isFile,
        readdir, readFile, writeFile,
        mkdir, rm, mv, cp,
        find, du,
        normalize, parentPath, basename, join,
        appendLog, debug,
    }

})()

export default FileSystem