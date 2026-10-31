/**
 * src/ui/AudioManager.js
 * Manages game audio, background music loops, volume controls, and sound effects.
 * Handles browser autoplay policies and state-based transitions.
 * Responsibility: UI & Game Effects (Ariadna)
 */

class AudioManager {
  constructor(gameState = null) {
    this.gameState = gameState;
    this.menuMusic = null;
    this.isMenuMusicPlaying = false;
    this.musicVolume = 0.55;
    this.isMuted = false;
    this.unlocked = false;

    this.init();

    // Hook into GameState changes if provided
    if (this.gameState && typeof this.gameState.addListener === 'function') {
      this.gameState.addListener((newState, oldState) => {
        this.handleStateChange(newState, oldState);
      });

      // If already in MENU at initialization time
      if (this.gameState.currentState === 'MENU') {
        this.playMenuMusic();
      }
    }
  }

  /**
   * Initialize audio element and browser autoplay unlock handlers
   */
  init() {
    try {
      const existing = (typeof document !== 'undefined') ? document.getElementById('menu-music') : null;
      if (existing) {
        this.menuMusic = existing;
      } else if (typeof Audio !== 'undefined') {
        this.menuMusic = new Audio('assets/audio/menu_theme.wav');
      }

      if (this.menuMusic) {
        this.menuMusic.loop = true;
        this.menuMusic.volume = this.musicVolume;
        this.menuMusic.preload = 'auto';
      }
    } catch (err) {
      console.warn('AudioManager: Could not initialize menu music audio element:', err);
    }

    // Modern browsers require user interaction to allow audio playback.
    const unlockAudio = () => {
      this.unlocked = true;
      if (this.isMenuMusicPlaying && this.menuMusic && this.menuMusic.paused && !this.isMuted) {
        this.menuMusic.play().catch(() => {});
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });

      // Pause music when tab is hidden, resume when tab is active
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            if (this.menuMusic && !this.menuMusic.paused) {
              this.menuMusic.pause();
            }
          } else {
            if (this.isMenuMusicPlaying && this.menuMusic && this.menuMusic.paused && !this.isMuted) {
              this.menuMusic.play().catch(() => {});
            }
          }
        });
      }
    }
  }

  /**
   * React to GameState transitions
   */
  handleStateChange(newState, oldState) {
    if (newState === 'MENU') {
      this.playMenuMusic();
    }
    // } else if (newState === 'PLAYING') {
    //   this.fadeOutMenuMusic(500);
    // }
  }

  /**
   * Start playing menu theme music with loop
   */
  playMenuMusic() {
    this.isMenuMusicPlaying = true;
    if (!this.menuMusic || this.isMuted) return;

    this.menuMusic.volume = this.musicVolume;
    this.menuMusic.currentTime = 0;

    const playPromise = this.menuMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay policy prevented immediate playback; waiting for user interaction
      });
    }
  }

  /**
   * Smoothly fade out the menu music over durationMs
   */
  fadeOutMenuMusic(durationMs = 600) {
    if (!this.menuMusic || this.menuMusic.paused) {
      this.isMenuMusicPlaying = false;
      return;
    }

    this.isMenuMusicPlaying = false;
    const startVolume = this.menuMusic.volume;
    const startTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    const fadeStep = () => {
      const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      if (this.menuMusic) {
        this.menuMusic.volume = Math.max(0, startVolume * (1 - progress));
      }

      if (progress < 1) {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(fadeStep);
        }
      } else {
        if (this.menuMusic) {
          this.menuMusic.pause();
          this.menuMusic.currentTime = 0;
          this.menuMusic.volume = this.musicVolume;
        }
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(fadeStep);
    } else {
      setTimeout(() => {
        if (this.menuMusic) {
          this.menuMusic.pause();
          this.menuMusic.currentTime = 0;
          this.menuMusic.volume = this.musicVolume;
        }
      }, durationMs);
    }
  }

  /**
   * Stop menu music immediately
   */
  stopMenuMusic() {
    this.isMenuMusicPlaying = false;
    if (this.menuMusic) {
      this.menuMusic.pause();
      this.menuMusic.currentTime = 0;
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.menuMusic) {
      if (this.isMuted) {
        this.menuMusic.pause();
      } else if (this.isMenuMusicPlaying) {
        this.menuMusic.play().catch(() => {});
      }
    }
    return this.isMuted;
  }

  /**
   * Set music volume (0.0 to 1.0)
   */
  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.menuMusic) {
      this.menuMusic.volume = this.musicVolume;
    }
  }
}

// Global scope export
if (typeof window !== 'undefined') {
  window.AudioManager = AudioManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioManager };
}
