/**
 * src/ui/GameState.js
 * State machine managing game lifecycles: LOADING, MENU, PLAYING, LEVEL_WON, LEVEL_LOST.
 * Responsibility: UI & Game States (Ariadna)
 */

class GameState {
  constructor(initialState = 'LOADING') {
    this.currentState = initialState;
    this.previousState = null;
    this.stateTimer = 0;
    this.score = 0;
    this.collectedStars = 0;
    this.listeners = [];
  }

  /**
   * Transition to a new state
   */
  changeState(newState) {
    if (this.currentState === newState) return;

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateTimer = 0;

    // Notify registered listeners
    for (const listener of this.listeners) {
      if (typeof listener === 'function') {
        listener(this.currentState, this.previousState);
      }
    }
  }

  setLoading() {
    this.changeState('LOADING');
  }

  setMenu() {
    this.changeState('MENU');
  }

  setPlaying() {
    this.changeState('PLAYING');
  }

  setWon() {
    this.changeState('LEVEL_WON');
  }

  setLost() {
    this.changeState('LEVEL_LOST');
  }

  addListener(fn) {
    if (typeof fn === 'function') {
      this.listeners.push(fn);
    }
  }

  update() {
    this.stateTimer++;
  }
}

// Global scope export
if (typeof window !== 'undefined') {
  window.GameState = GameState;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameState };
}
