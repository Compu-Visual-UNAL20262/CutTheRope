/**
 * src/config.js
 * Global game configuration: dimensions, gravity, labels, and collision categories.
 * Responsibility: Ángel & Farid [BASE]
 */

 const CONFIG = {
  // Proportional vertical resolution for Cut the Rope (Aspect Ratio 2:3, classic 320x480 / 640x960)
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 720,
  GRAVITY_Y: 0.1,

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

// Entities-related constants
 const CANDY_RADIUS = 35
 const TARGET_RADIUS = 42
 const DETECTION_RADIUS = 250
 const STAR_RADIUS = 13

 const OMNOM_SPRITES = {
  idle: {
    frames: [
      {x:394, y:1864, w:130, h:150},
      {x:394, y:1864, w:130, h:150},
      {x:394, y:1561, w:130, h:150},
    ],
    frameRate: 8,
    loop: true
  },

  waitingCandy: {
    frames: [
      {x:128, y:272, w:130, h:145},
      {x:128, y:417, w:130, h:140},
      {x:128, y:554, w:130, h:140},
    ],
    frameRate: 12,
    loop: false
  }
};

const CANDY_SPRITES = [
  {x:11, y:2, w:102, h:102},
  {x:146, y:2, w:97, h:97},
  {x:1, y:149, w:102, h:102}
]

//  const STAR_SPRITES = {
//   spin: {
//     frames: [
//       // Los 10 frames de la estrella
//     ],
//     frameRate: 10,
//     loop: true
//   }
// };


// Global scope  for compatibility across scripts and modules
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;

}
