/**
 * src/config.js
 * Global game configuration: dimensions, gravity, labels, and collision categories.
 * Responsibility: Ángel & Farid [BASE]
 */

const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRAVITY_Y: 1.0,

  LABELS: {
    CANDY: 'CANDY',
    STAR: 'STAR',
    TARGET: 'TARGET',
    BUBBLE: 'BUBBLE',
    ROPE_NODE: 'ROPE_NODE',
    SPIKE: 'SPIKE' // Reserved for optional spikes mechanic
  },

  COLLISION_CATEGORIES: {
    DEFAULT: 0x0001,
    CANDY: 0x0002,
    ROPE: 0x0004,
    SENSOR: 0x0008
  }
};

// Global scope export for compatibility across scripts and modules
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG };
}
