// ============================================================================
// F1 Owner — Audio management system
// Handles all sound effects, background music, and UI interaction sounds.
// Separate volume controls for SFX and music, with mute functionality.
// ============================================================================

import { createUISFX, type CueName } from 'uisfx';

type AudioCategory = "music" | "sfx" | "ui";

// Initialize uisfx with sci-fi feel
const uiSfx = createUISFX({ pack: 'scifi' });

class AudioManager {
  private musicVolume = 0.3; // 0-1
  private sfxVolume = 0.5; // 0-1
  private uiVolume = 0.4; // 0-1
  private musicMuted = false;
  private sfxMuted = false;
  private uiMuted = false;
  private musicAudio: HTMLAudioElement | null = null;
  private currentMusic: string | null = null;
  private ambienceAudio: HTMLAudioElement | null = null;
  private currentAmbience: string | null = null;
  private unlocked = false;

  constructor() {
    this.loadSettings();
  }

  /** Unlock the uisfx AudioContext from a trusted user gesture (required by browsers). */
  async unlock() {
    if (this.unlocked) return;
    try {
      await uiSfx.unlock();
      this.unlocked = true;
    } catch {
      // ignore
    }
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem("f1-owner-audio");
      if (saved) {
        const settings = JSON.parse(saved);
        this.musicVolume = settings.musicVolume ?? 0.3;
        this.sfxVolume = settings.sfxVolume ?? 0.5;
        this.uiVolume = settings.uiVolume ?? 0.4;
        this.musicMuted = settings.musicMuted ?? false;
        this.sfxMuted = settings.sfxMuted ?? false;
        this.uiMuted = settings.uiMuted ?? false;
      }
    } catch {
      // ignore
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        "f1-owner-audio",
        JSON.stringify({
          musicVolume: this.musicVolume,
          sfxVolume: this.sfxVolume,
          uiVolume: this.uiVolume,
          musicMuted: this.musicMuted,
          sfxMuted: this.sfxMuted,
          uiMuted: this.uiMuted,
        })
      );
    } catch {
      // ignore
    }
  }

  getVolume(category: AudioCategory): number {
    switch (category) {
      case "music": return this.musicMuted ? 0 : this.musicVolume;
      case "sfx": return this.sfxMuted ? 0 : this.sfxVolume;
      case "ui": return this.uiMuted ? 0 : this.uiVolume;
    }
  }

  setVolume(category: AudioCategory, volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    switch (category) {
      case "music":
        this.musicVolume = clamped;
        if (this.musicAudio) this.musicAudio.volume = this.musicMuted ? 0 : clamped;
        if (this.ambienceAudio) this.ambienceAudio.volume = this.musicMuted ? 0 : clamped * 0.8;
        break;
      case "sfx": this.sfxVolume = clamped; break;
      case "ui": this.uiVolume = clamped; break;
    }
    this.saveSettings();
  }

  isMuted(category: AudioCategory): boolean {
    switch (category) {
      case "music": return this.musicMuted;
      case "sfx": return this.sfxMuted;
      case "ui": return this.uiMuted;
    }
  }

  toggleMute(category: AudioCategory) {
    switch (category) {
      case "music":
        this.musicMuted = !this.musicMuted;
        if (this.musicAudio) this.musicAudio.volume = this.musicMuted ? 0 : this.musicVolume;
        if (this.ambienceAudio) this.ambienceAudio.volume = this.musicMuted ? 0 : this.musicVolume * 0.8;
        break;
      case "sfx": this.sfxMuted = !this.sfxMuted; break;
      case "ui": this.uiMuted = !this.uiMuted; break;
    }
    this.saveSettings();
  }

  /** Play a one-shot sound effect. */
  playSfx(src: string, volume?: number) {
    if (this.sfxMuted) return;
    try {
      const audio = new Audio(src);
      audio.volume = volume ?? this.sfxVolume;
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }

  /** Play a UI interaction sound using uisfx. */
  playUi(cue: CueName) {
    if (this.uiMuted) return;
    try {
      uiSfx.play(cue);
    } catch {
      // ignore
    }
  }

  /** Start or switch background music (looping). */
  playMusic(src: string) {
    if (this.currentMusic === src && this.musicAudio && !this.musicAudio.paused) return;
    this.stopMusic();
    try {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = this.musicMuted ? 0 : this.musicVolume;
      audio.play().catch(() => {});
      this.musicAudio = audio;
      this.currentMusic = src;
    } catch {
      // ignore
    }
  }

  /** Stop background music. */
  stopMusic() {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.src = "";
      this.musicAudio = null;
      this.currentMusic = null;
    }
  }

  /** Start or switch looping ambience (separate from music channel). */
  playAmbience(src: string) {
    if (this.currentAmbience === src && this.ambienceAudio && !this.ambienceAudio.paused) return;
    this.stopAmbience();
    try {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = this.musicMuted ? 0 : this.musicVolume * 0.8;
      audio.play().catch(() => {});
      this.ambienceAudio = audio;
      this.currentAmbience = src;
    } catch {
      // ignore
    }
  }

  /** Stop looping ambience. */
  stopAmbience() {
    if (this.ambienceAudio) {
      this.ambienceAudio.pause();
      this.ambienceAudio.src = "";
      this.ambienceAudio = null;
      this.currentAmbience = null;
    }
  }

  /** Fade out music over `ms` milliseconds. */
  fadeOutMusic(ms = 1500) {
    if (!this.musicAudio || this.musicMuted) {
      this.stopMusic();
      return;
    }
    const audio = this.musicAudio;
    const startVol = audio.volume;
    const step = startVol / (ms / 50);
    const fade = setInterval(() => {
      audio.volume = Math.max(0, audio.volume - step);
      if (audio.volume <= 0) {
        clearInterval(fade);
        this.stopMusic();
      }
    }, 50);
  }
}

export const audioManager = new AudioManager();

// ---------------------------------------------------------------------------
// SFX paths
// ---------------------------------------------------------------------------

export const SFX = {
  // Special: Charles Leclerc scream (forced retirement only)
  charlesScream: "/assets/sfx/charles-leclerc-scream.mp3",
  // Music: Opening theme (landing screen until first GP)
  openingTheme: "/assets/sfx/F1 Theme - Build Up & Starting Grid.mp3",
  // SFX: Box box (pause button or race weekend decision)
  boxBox: "/assets/sfx/formula-1-box-box.mp3",
  // SFX: Radio notification (tabs with notifications)
  radioNotification: "/assets/sfx/formula-1-radio-notification.mp3",
  // Music: Post-race theme (race ended, classification)
  postRace: "/assets/sfx/F1 Theme Suite (Post-Race).mp3",
  // SFX: Race ambience (manual race simulation, chart)
  raceAmbience: "/assets/sfx/Race Ambience.mp3",
} as const;

// UI interaction sounds using uisfx (sci-fi feel)
// These are generated at runtime - no MP3 files needed
export const UI_SOUNDS = {
  buttonClick: "press" as CueName,
  buttonHover: "hover" as CueName,
  tabSwitch: "toggle-on" as CueName,
  notification: "notification" as CueName,
  success: "success" as CueName,
  warning: "warning" as CueName,
} as const;