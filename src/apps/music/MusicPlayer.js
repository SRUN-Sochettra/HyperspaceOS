import BaseApp from '../BaseApp.js'
import AudioEngine from './AudioEngine.js'
import Visualizer from './Visualizer.js'
import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'

export default class MusicPlayer extends BaseApp {

    async setup() {
        this.audioEngine = new AudioEngine()
        this.playing = false
        this.currentTime = 0
        this.duration = 242
        this.vizMode = 'bars'

        this.tracks = [
            { title: 'Neon Dreams', artist: 'HyperSpace Radio', emoji: '🎧', dur: 242 },
            { title: 'Digital Horizons', artist: 'CyberWave', emoji: '🌌', dur: 198 },
            { title: 'Pixel Storm', artist: 'ByteBeats', emoji: '⚡', dur: 267 },
            { title: 'Glass Memories', artist: 'NeonDrift', emoji: '💎', dur: 185 },
            { title: 'Quantum Loop', artist: 'SynthOS', emoji: '🔮', dur: 312 },
        ]

        this.trackIndex = 0
        this.track = this.tracks[0]

        this.container.innerHTML = `
      <div class="music-container">
        <div class="music-artwork" id="music-art-${this.windowId}">${this.track.emoji}</div>
        <div class="music-info">
          <div class="music-title" id="music-title-${this.windowId}">${this.track.title}</div>
          <div class="music-artist" id="music-artist-${this.windowId}">${this.track.artist}</div>
        </div>
        <div class="music-visualizer" id="music-viz-${this.windowId}"></div>
        <div class="music-viz-modes">
          <button class="music-viz-btn active" data-mode="bars">▐▐▐</button>
          <button class="music-viz-btn" data-mode="wave">〰️</button>
          <button class="music-viz-btn" data-mode="circle">◎</button>
        </div>
        <div class="music-progress-container">
          <span class="music-time" id="music-cur-${this.windowId}">0:00</span>
          <div class="music-progress-track" id="music-ptrack-${this.windowId}">
            <div class="music-progress-fill" id="music-pfill-${this.windowId}"></div>
          </div>
          <span class="music-time" id="music-dur-${this.windowId}">${this.formatTime(this.duration)}</span>
        </div>
        <div class="music-controls">
          <button class="music-btn" id="music-prev-${this.windowId}">⏮</button>
          <button class="music-btn play" id="music-play-${this.windowId}">▶</button>
          <button class="music-btn" id="music-next-${this.windowId}">⏭</button>
        </div>
        <div class="music-volume">
          <span class="music-vol-icon">🔊</span>
          <input type="range" class="music-vol-slider" id="music-vol-${this.windowId}" min="0" max="100" value="15" />
        </div>
      </div>
    `

        // Init visualizer
        const vizContainer = this.$(`#music-viz-${this.windowId}`)
        this.visualizer = new Visualizer(vizContainer, this.audioEngine)

        // Bind controls
        this.$(`#music-play-${this.windowId}`).addEventListener('click', () => this.togglePlay())
        this.$(`#music-prev-${this.windowId}`).addEventListener('click', () => this.prevTrack())
        this.$(`#music-next-${this.windowId}`).addEventListener('click', () => this.nextTrack())

        // Progress seek
        this.$(`#music-ptrack-${this.windowId}`).addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            this.currentTime = ((e.clientX - rect.left) / rect.width) * this.duration
            this.updateProgress()
        })

        // Volume slider
        this.$(`#music-vol-${this.windowId}`).addEventListener('input', (e) => {
            this.audioEngine.setVolume(parseInt(e.target.value) / 100 * 0.3)
        })

        // Viz mode switcher
        this.$$('.music-viz-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.$$('.music-viz-btn').forEach(b => b.classList.remove('active'))
                btn.classList.add('active')
                this.vizMode = btn.dataset.mode
                this.visualizer.setMode(this.vizMode)
            })
        })
    }

    async togglePlay() {
        const btn = this.$(`#music-play-${this.windowId}`)

        if (this.playing) {
            this.playing = false
            btn.textContent = '▶'
            this.audioEngine.stop()
            this.visualizer.stop()
            for (const id of this.intervals) clearInterval(id)
            this.intervals = []
        } else {
            try {
                this.playing = true
                btn.textContent = '⏸'

                await this.audioEngine.play(this.trackIndex)
                this.visualizer.start()

                this.addInterval(() => {
                    if (!this.playing) return
                    this.currentTime += 0.25
                    if (this.currentTime >= this.duration) { this.nextTrack(); return }
                    this.updateProgress()
                }, 250)
            } catch (err) {
                console.error('[Music] Playback failed:', err)
                this.playing = false
                btn.textContent = '▶'
                this.notify('⚠️', 'Music', 'Click again to enable audio (browser requires user interaction)')
            }
        }

        Store.set('music.playing', this.playing)
    }

    updateProgress() {
        const pct = (this.currentTime / this.duration) * 100
        const fill = this.$(`#music-pfill-${this.windowId}`)
        const cur = this.$(`#music-cur-${this.windowId}`)
        if (fill) fill.style.width = `${pct}%`
        if (cur) cur.textContent = this.formatTime(this.currentTime)
    }

    async nextTrack() {
        const wasPlaying = this.playing
        if (this.playing) {
            this.audioEngine.stop()
            this.visualizer.stop()
            for (const id of this.intervals) clearInterval(id)
            this.intervals = []
        }
        this.trackIndex = (this.trackIndex + 1) % this.tracks.length
        this.loadTrack()
        if (wasPlaying) {
            this.playing = false
            await this.togglePlay()
        }
    }

    async prevTrack() {
        const wasPlaying = this.playing
        if (this.playing) {
            this.audioEngine.stop()
            this.visualizer.stop()
            for (const id of this.intervals) clearInterval(id)
            this.intervals = []
        }
        this.trackIndex = (this.trackIndex - 1 + this.tracks.length) % this.tracks.length
        this.loadTrack()
        if (wasPlaying) {
            this.playing = false
            await this.togglePlay()
        }
    }

    loadTrack() {
        this.track = this.tracks[this.trackIndex]
        this.currentTime = 0
        this.duration = this.track.dur

        this.$(`#music-art-${this.windowId}`).textContent = this.track.emoji
        this.$(`#music-title-${this.windowId}`).textContent = this.track.title
        this.$(`#music-artist-${this.windowId}`).textContent = this.track.artist
        this.$(`#music-dur-${this.windowId}`).textContent = this.formatTime(this.duration)
        this.updateProgress()
    }

    formatTime(s) {
        const m = Math.floor(s / 60)
        return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
    }

    onDestroy() {
        if (this.visualizer) {
            this.visualizer.destroy()
            this.visualizer = null
        }
        if (this.audioEngine) {
            this.audioEngine.destroy()
            this.audioEngine = null
        }
        this.playing = false

        import('../../core/Store.js').then(({ default: Store }) => {
            Store.set('music.playing', false)
        })
    }
}