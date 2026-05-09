// ============================================================
//  AudioEngine.js — Web Audio API wrapper
//  Handles audio context, analyser node, frequency data.
//  Generates a real audio signal using oscillators
//  (since we can't ship MP3s, we synthesize ambient music).
// ============================================================

export default class AudioEngine {

    constructor() {
        this.ctx = null
        this.analyser = null
        this.gainNode = null
        this.frequencyData = null
        this.timeData = null
        this.oscillators = []
        this.playing = false
        this.initialized = false
    }

    async init() {
        if (this.initialized) return

        this.ctx = new (window.AudioContext || window.webkitAudioContext)()

        // Resume if suspended (browser autoplay policy)
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume()
        }

        this.gainNode = this.ctx.createGain()
        this.gainNode.gain.value = 0.15
        this.gainNode.connect(this.ctx.destination)

        this.analyser = this.ctx.createAnalyser()
        this.analyser.fftSize = 256
        this.analyser.smoothingTimeConstant = 0.8
        this.analyser.connect(this.gainNode)

        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
        this.timeData = new Uint8Array(this.analyser.frequencyBinCount)

        this.initialized = true
    }

    // ---- SYNTHESIZE AMBIENT MUSIC ----
    // Creates layered oscillators that sound like ambient/synthwave
    async play(trackIndex = 0) {
        if (!this.initialized) await this.init()
        if (this.ctx.state === 'suspended') await this.ctx.resume()

        this.stop()

        const tracks = [
            { // Neon Dreams — deep pad
                notes: [
                    { freq: 110, type: 'sine', gain: 0.12, detune: 0 },
                    { freq: 220, type: 'sine', gain: 0.08, detune: 5 },
                    { freq: 330, type: 'triangle', gain: 0.04, detune: -3 },
                    { freq: 55, type: 'sine', gain: 0.15, detune: 0 },   // sub bass
                    { freq: 440, type: 'sine', gain: 0.02, detune: 7 },
                ],
                lfoRate: 0.5,
                lfoDepth: 3,
                filterFreq: 800,
            },
            { // Digital Horizons — brighter
                notes: [
                    { freq: 146.83, type: 'triangle', gain: 0.10, detune: 0 },
                    { freq: 293.66, type: 'sine', gain: 0.06, detune: 4 },
                    { freq: 440, type: 'sine', gain: 0.03, detune: -2 },
                    { freq: 73.42, type: 'sine', gain: 0.12, detune: 0 },
                    { freq: 587.33, type: 'triangle', gain: 0.015, detune: 6 },
                ],
                lfoRate: 0.3,
                lfoDepth: 5,
                filterFreq: 1200,
            },
            { // Pixel Storm — darker
                notes: [
                    { freq: 82.41, type: 'sawtooth', gain: 0.05, detune: 0 },
                    { freq: 164.81, type: 'sine', gain: 0.08, detune: 3 },
                    { freq: 246.94, type: 'triangle', gain: 0.04, detune: -4 },
                    { freq: 41.20, type: 'sine', gain: 0.14, detune: 0 },
                    { freq: 329.63, type: 'sine', gain: 0.02, detune: 8 },
                ],
                lfoRate: 0.7,
                lfoDepth: 4,
                filterFreq: 600,
            },
            { // Glass Memories — ethereal
                notes: [
                    { freq: 196, type: 'sine', gain: 0.10, detune: 0 },
                    { freq: 392, type: 'sine', gain: 0.05, detune: 6 },
                    { freq: 523.25, type: 'triangle', gain: 0.03, detune: -5 },
                    { freq: 98, type: 'sine', gain: 0.12, detune: 0 },
                    { freq: 659.25, type: 'sine', gain: 0.015, detune: 4 },
                ],
                lfoRate: 0.2,
                lfoDepth: 6,
                filterFreq: 1500,
            },
            { // Quantum Loop — pulsing
                notes: [
                    { freq: 130.81, type: 'square', gain: 0.03, detune: 0 },
                    { freq: 261.63, type: 'sine', gain: 0.08, detune: 2 },
                    { freq: 392, type: 'triangle', gain: 0.04, detune: -3 },
                    { freq: 65.41, type: 'sine', gain: 0.13, detune: 0 },
                    { freq: 523.25, type: 'sine', gain: 0.02, detune: 5 },
                ],
                lfoRate: 1.0,
                lfoDepth: 8,
                filterFreq: 900,
            },
        ]

        const track = tracks[trackIndex % tracks.length]

        // Low-pass filter for warmth
        const filter = this.ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = track.filterFreq
        filter.Q.value = 1
        filter.connect(this.analyser)

        // LFO for movement
        const lfo = this.ctx.createOscillator()
        const lfoGain = this.ctx.createGain()
        lfo.frequency.value = track.lfoRate
        lfoGain.gain.value = track.lfoDepth
        lfo.connect(lfoGain)
        lfo.start()
        this.oscillators.push(lfo)

        // Create oscillators for each note
        for (const note of track.notes) {
            const osc = this.ctx.createOscillator()
            const oscGain = this.ctx.createGain()

            osc.type = note.type
            osc.frequency.value = note.freq
            osc.detune.value = note.detune

            // Connect LFO to frequency for vibrato
            lfoGain.connect(osc.frequency)

            oscGain.gain.value = note.gain

            // Fade in
            oscGain.gain.setValueAtTime(0, this.ctx.currentTime)
            oscGain.gain.linearRampToValueAtTime(note.gain, this.ctx.currentTime + 2)

            osc.connect(oscGain)
            oscGain.connect(filter)
            osc.start()

            this.oscillators.push(osc)
        }

        this.playing = true
    }

    stop() {
        for (const osc of this.oscillators) {
            try {
                osc.stop()
                osc.disconnect()
            } catch (e) {
                // Already stopped
            }
        }
        this.oscillators = []
        this.playing = false
    }

    // ---- GET FREQUENCY DATA (for visualizer) ----
    getFrequencyData() {
        if (!this.analyser) return null
        this.analyser.getByteFrequencyData(this.frequencyData)
        return this.frequencyData
    }

    getTimeData() {
        if (!this.analyser) return null
        this.analyser.getByteTimeDomainData(this.timeData)
        return this.timeData
    }

    getVolume() {
        if (!this.gainNode) return 0.15
        return this.gainNode.gain.value
    }

    setVolume(val) {
        if (!this.gainNode) return
        this.gainNode.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1)
    }

    destroy() {
        this.stop()
        if (this.ctx && this.ctx.state !== 'closed') {
            this.ctx.close()
        }
    }
}