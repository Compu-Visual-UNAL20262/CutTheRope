/**
 * src/config.js
 * Configuración global del juego: dimensiones, gravedad, etiquetas y categorías de colisión.
 * Responsabilidad: Ángel y Farid [BASE]
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
    SPIKE: 'SPIKE' // Reservado por si Nicolás decide implementar el bonus
  },

  COLLISION_CATEGORIES: {
    DEFAULT: 0x0001,
    CANDY: 0x0002,
    ROPE: 0x0004,
    SENSOR: 0x0008
  }
};

// Exposición en el entorno global para compatibilidad con scripts y módulos
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG };
}
