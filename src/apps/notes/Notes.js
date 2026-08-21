import BaseApp from '../BaseApp.js'
import FileSystem from '../../core/FileSystem.js'
import { marked } from 'marked'

const NOTES_DIR = '/home/root/Documents/Notes'

export default class Notes extends BaseApp {

    async setup() {
        // Ensure notes directory exists
        if (!FileSystem.isDir(NOTES_DIR)) {
            FileSystem.mkdir(NOTES_DIR)
        }

        this.activeNoteId = null
        this.editMode = true

        marked.setOptions({ breaks: true, gfm: true })

        this.container.innerHTML = `
      <div class="notes-container">
        <div class="notes-sidebar">
          <div class="notes-sidebar-header">
            <button class="notes-new-btn" id="notes-new-${this.windowId}">+ New Note</button>
          </div>
          <div class="notes-list" id="notes-list-${this.windowId}"></div>
        </div>
        <div class="notes-editor">
          <div class="notes-toolbar">
            <button class="notes-tool-btn" id="notes-toggle-${this.windowId}" title="Toggle Preview">Preview</button>
            <button class="notes-tool-btn" data-insert="**" title="Bold"><b>B</b></button>
            <button class="notes-tool-btn" data-insert="*" title="Italic"><i>I</i></button>
            <button class="notes-tool-btn" data-insert="\`" title="Code">{ }</button>
            <div style="flex:1"></div>
            <button class="notes-tool-btn" id="notes-delete-${this.windowId}" title="Delete Note">Delete</button>
          </div>
          <textarea class="notes-textarea" id="notes-textarea-${this.windowId}" placeholder="Write in Markdown..."></textarea>
          <div class="notes-preview" id="notes-preview-${this.windowId}" style="display:none"></div>
        </div>
      </div>
    `

        this.listEl = this.$(`#notes-list-${this.windowId}`)
        this.textareaEl = this.$(`#notes-textarea-${this.windowId}`)
        this.previewEl = this.$(`#notes-preview-${this.windowId}`)

        // Create default notes if directory is empty
        const entries = FileSystem.readdir(NOTES_DIR)
        if (!entries || entries.length === 0) {
            this.createDefaultNotes()
        }

        this.renderList()

        // Load first note
        const firstNote = this.getNotes()[0]
        if (firstNote) this.loadNote(firstNote.path)

        // Auto-save on typing (debounced)
        let saveTimer
        this.textareaEl.addEventListener('input', () => {
            clearTimeout(saveTimer)
            saveTimer = setTimeout(() => {
                if (this.activeNoteId) {
                    FileSystem.writeFile(this.activeNoteId, this.textareaEl.value)
                    this.renderList()
                }
            }, 500)
        })

        this.$(`#notes-toggle-${this.windowId}`).addEventListener('click', () => {
            this.editMode = !this.editMode
            this.textareaEl.style.display = this.editMode ? '' : 'none'
            this.previewEl.style.display = this.editMode ? 'none' : ''
            if (!this.editMode) this.previewEl.innerHTML = marked.parse(this.textareaEl.value)
        })

        this.$$('.notes-tool-btn[data-insert]').forEach(btn => {
            btn.addEventListener('click', () => {
                const insert = btn.dataset.insert
                const start = this.textareaEl.selectionStart
                const end = this.textareaEl.selectionEnd
                const selected = this.textareaEl.value.substring(start, end)
                this.textareaEl.value = this.textareaEl.value.substring(0, start) + insert + selected + insert + this.textareaEl.value.substring(end)
                this.textareaEl.focus()
            })
        })

        this.$(`#notes-new-${this.windowId}`).addEventListener('click', () => this.createNote())
        this.$(`#notes-delete-${this.windowId}`).addEventListener('click', () => this.deleteNote())

        // Listen for FS changes from other apps
        this.listen('fs:change', () => this.renderList())
    }

    getNotes() {
        const entries = FileSystem.readdir(NOTES_DIR) || []
        return entries
            .filter(e => e.type === 'file')
            .map(e => ({
                path: e.path,
                name: e.name.replace(/\.(md|txt)$/, ''),
                modified: e.modified,
                title: this.getTitleFromFile(e.path),
            }))
            .sort((a, b) => (b.modified || 0) - (a.modified || 0))
    }

    getTitleFromFile(path) {
        const content = FileSystem.readFile(path) || ''
        const firstLine = content.split('\n')[0]?.replace(/^#+\s*/, '').trim()
        return firstLine || FileSystem.basename(path)
    }

    renderList() {
        const notes = this.getNotes()
        this.listEl.innerHTML = notes.map(note => {
            const isActive = this.activeNoteId === note.path
            const date = note.modified ? new Date(note.modified).toLocaleDateString() : ''
            return `
        <div class="note-item ${isActive ? 'active' : ''}" data-path="${note.path}">
          <div class="note-item-title">${note.title}</div>
          <div class="note-item-date">${date}</div>
        </div>
      `
        }).join('')

        this.listEl.querySelectorAll('.note-item').forEach(el => {
            el.addEventListener('click', () => this.loadNote(el.dataset.path))
        })
    }

    loadNote(path) {
        this.activeNoteId = path
        const content = FileSystem.readFile(path)
        if (content !== null) {
            this.textareaEl.value = content
            if (!this.editMode) this.previewEl.innerHTML = marked.parse(content)
        }
        this.renderList()
    }

    createNote() {
        const name = `Note-${Date.now()}.md`
        const path = FileSystem.join(NOTES_DIR, name)
        FileSystem.writeFile(path, '# New Note\n\nStart writing...\n')
        this.loadNote(path)
        this.textareaEl.focus()
    }

    deleteNote() {
        if (!this.activeNoteId) return
        FileSystem.rm(this.activeNoteId)
        this.activeNoteId = null
        const notes = this.getNotes()
        if (notes.length > 0) this.loadNote(notes[0].path)
        else { this.textareaEl.value = ''; this.renderList() }
    }

    createDefaultNotes() {
        FileSystem.writeFile(FileSystem.join(NOTES_DIR, 'Project-Ideas.md'),
            '# Project Ideas\n\n## Must Build\n1. **3D file manager** using WebGPU\n2. AI-powered terminal\n3. Collaborative whiteboard\n\n> The canvas-in-HTML API opens huge possibilities\n')
        FileSystem.writeFile(FileSystem.join(NOTES_DIR, 'Getting-Started.md'),
            '# Getting Started\n\n## Terminal Commands\n- `ls`, `cd`, `mkdir`, `touch`, `rm`\n- `cat`, `head`, `tail`, `grep`\n- `find`, `du`, `wc`\n- `echo "text" > file`\n\n## Tips\n- Right-click for context menus\n- Ctrl+T opens new terminal\n- Files are saved to the virtual file system\n')
    }

    onDestroy() {
        // Save current note before closing
        if (this.activeNoteId && this.textareaEl) {
            const content = this.textareaEl.value
            if (content) {
                import('../../core/FileSystem.js').then(({ default: FileSystem }) => {
                    FileSystem.writeFile(this.activeNoteId, content)
                })
            }
        }
        this.listEl = null
        this.textareaEl = null
        this.previewEl = null
    }
}