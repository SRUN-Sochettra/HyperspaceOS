// ============================================================
//  Sounds.js — UI sound effects using Web Audio API
//  Synthesized sounds — no audio files needed.
//  Every interaction gets a subtle sonic feedback.
// ============================================================

import Store from "./Store.js";
import EventBus from "./EventBus.js";

const Sounds = (() => {
  let ctx = null;
  let enabled = true;
  let initialized = false;
  let masterGain = null;

  function init() {
    EventBus.on("window:opened", () => play("windowOpen"));
    EventBus.on("window:closed", () => play("windowClose"));
    EventBus.on("window:minimized", () => play("minimize"));
    EventBus.on("window:maximized", () => play("maximize"));
    EventBus.on("window:tiled", () => play("snap"));
    EventBus.on("notification:show", () => play("notify"));
    EventBus.on("os:boot:complete", () => play("boot"));

    // Check if sounds are enabled
    const soundSetting = Store.get("settings.soundEnabled");
    enabled = soundSetting !== false; // Default to true

    Store.subscribe("settings.soundEnabled", (val) => {
      enabled = val !== false;
    });

    // Initialize AudioContext on first user interaction
    const initAudio = () => {
      if (initialized) return;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.12;
        masterGain.connect(ctx.destination);
        initialized = true;
      } catch (e) {
        console.warn("[Sounds] AudioContext failed:", e.message);
      }
      document.removeEventListener("click", initAudio);
      document.removeEventListener("keydown", initAudio);
    };

    document.addEventListener("click", initAudio);
    document.addEventListener("keydown", initAudio);

    console.log("[Sounds] Initialized");
  }

  function play(soundName) {
    if (!enabled || !initialized || !ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    try {
      const sound = SOUNDS[soundName];
      if (sound) sound();
    } catch {}
  }

  // ---- HELPER: create oscillator + envelope ----
  function tone(freq, type, duration, volume = 0.3) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function noise(duration, volume = 0.05) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 4000;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
  }

  // ---- SOUND DEFINITIONS ----
  const SOUNDS = {
    windowOpen() {
      tone(600, "sine", 0.12, 0.15);
      setTimeout(() => tone(900, "sine", 0.1, 0.1), 50);
    },

    windowClose() {
      tone(500, "sine", 0.1, 0.12);
      setTimeout(() => tone(350, "sine", 0.12, 0.08), 40);
    },

    minimize() {
      tone(800, "sine", 0.08, 0.1);
      setTimeout(() => tone(500, "sine", 0.1, 0.08), 30);
      setTimeout(() => tone(350, "sine", 0.12, 0.06), 60);
    },

    maximize() {
      tone(400, "sine", 0.08, 0.1);
      setTimeout(() => tone(600, "sine", 0.08, 0.1), 40);
      setTimeout(() => tone(800, "sine", 0.1, 0.08), 80);
    },

    snap() {
      tone(700, "triangle", 0.06, 0.12);
      noise(0.04, 0.03);
    },

    notify() {
      tone(880, "sine", 0.08, 0.12);
      setTimeout(() => tone(1100, "sine", 0.12, 0.08), 80);
    },

    click() {
      noise(0.03, 0.04);
    },

    error() {
      tone(200, "square", 0.15, 0.1);
      setTimeout(() => tone(180, "square", 0.15, 0.08), 100);
    },

    boot() {
      tone(330, "sine", 0.2, 0.08);
      setTimeout(() => tone(440, "sine", 0.2, 0.1), 150);
      setTimeout(() => tone(660, "sine", 0.25, 0.12), 300);
      setTimeout(() => tone(880, "sine", 0.3, 0.08), 500);
    },

    typing() {
      const f = 400 + Math.random() * 100;
      tone(f, "sine", 0.05, 0.02);
    },
  };

  function setVolume(val) {
    if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, val));
  }

  function destroy() {
    if (ctx && ctx.state !== "closed") ctx.close();
    ctx = null;
    initialized = false;
  }

  return { init, play, setVolume, destroy };
})();

export default Sounds;
