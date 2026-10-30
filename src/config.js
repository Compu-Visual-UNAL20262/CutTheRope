/**
 * src/config.js
 * Global game configuration: dimensions, gravity, labels, and collision categories.
 * Responsibility: Ángel & Farid [BASE]
 */

 const CONFIG = {
  // Proportional vertical resolution for Cut the Rope (Aspect Ratio 2:3, classic 320x480 / 640x960)
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 720,
  GRAVITY_Y: 0.3,

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
  },

  LOADING_SPEED: 0.005 // ~3.3s loading duration at 60 FPS
};

// Entities-related constants
 const CANDY_RADIUS = 25
 const MASCARA_RADIUS = CANDY_RADIUS+2
 const TARGET_RADIUS = 60
 const DETECTION_RADIUS = 150
 const STAR_RADIUS = 13

 const ANIMATION_TIME = 30;
 const OMNOM_SPRITES = {
  idle: {
    frames: [
      {x:0, y:133,  w:129, h:133},
      {x:0, y:266,  w:129, h:133},
      {x:0, y:399,  w:129, h:133},
      {x:0, y:532,  w:129, h:133},
      {x:0, y:665,  w:129, h:135},
      {x:0, y:800,  w:129, h:137},
      {x:0, y:937,  w:129, h:139},
      {x:0, y:1076, w:129, h:141},
      {x:0, y:1217, w:129, h:143},
      {x:0, y:1360, w:129, h:143},
      {x:0, y:1503, w:129, h:143},
      {x:0, y:1646, w:129, h:144},
      {x:0, y:1790, w:129, h:144},
      {x:0, y:1646, w:129, h:144},
      {x:0, y:1503, w:129, h:143},
      {x:0, y:1360, w:129, h:143},
      {x:0, y:1217, w:129, h:143},
      {x:0, y:1076, w:129, h:141},
      {x:0, y:937,  w:129, h:139},
      {x:0, y:800,  w:129, h:137},
      {x:0, y:665,  w:129, h:135},
      {x:0, y:532,  w:129, h:133},
      {x:0, y:399,  w:129, h:133},
      {x:0, y:266,  w:129, h:133},
      {x:0, y:133,  w:129, h:133},
    ],
    frameRate: 12,
    loop: true
  },

  openMouth: {
    frames: [
      {x:129, y:272,  w:132, h:145},
      {x:129, y:417,  w:130, h:137},
      {x:129, y:554,  w:129, h:135},
      {x:129, y:689,  w:129, h:133},
      {x:129, y:822,  w:129, h:130},
      {x:129, y:952,  w:129, h:128},
      {x:129, y:1080, w:129, h:128},
      {x:129, y:1208, w:129, h:128},
      {x:129, y:1336, w:129, h:128},
      {x:129, y:1464, w:129, h:133},
      //{x:129, y:1597, w:129, h:139},
      //{x:129, y:1736, w:131, h:124},
      //{x:129, y:1860, w:131, h:131},
    ],
    frameRate: 16,
    loop: false
  },

  eating: {
    frames: [
      {x:129, y:1597, w:129, h:139},
      {x:129, y:1736, w:131, h:124},
      {x:129, y:1860, w:131, h:131},
      {x:262, y:406,  w:129, h:137},
      {x:262, y:543,  w:129, h:142},
      {x:262, y:685,  w:129, h:143},
      {x:262, y:828,  w:131, h:142},
      {x:129, y:1860, w:131, h:131},
      {x:262, y:406,  w:129, h:137},
      {x:262, y:543,  w:129, h:142},
      {x:262, y:685,  w:129, h:143},
      {x:262, y:828,  w:131, h:142},
      {x:129, y:1860, w:131, h:131},
      {x:262, y:406,  w:129, h:137},
      {x:262, y:543,  w:129, h:142},
      {x:262, y:685,  w:129, h:143},
      {x:262, y:828,  w:131, h:142},
      {x:262, y:970,  w:133, h:134},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
      {x:262, y:1104, w:127, h:149},
    ],
    frameRate: 8,
    loop: false
  }
};

const CANDY_SPRITES = [
  {x:10, y:1, w:104, h:104},
  {x:146, y:1, w:100, h:100},
  {x:1, y:150, w:100, h:100}
]

const SUPPORT_SPRITE = [{x:5, y:2, w:185, h:180}]

//  const STAR_SPRITES = {
//   spin: {
//     frames: [
//       // Los 10 frames de la estrella
//     ],
//     frameRate: 10,
//     loop: true
//   }
// };

const ROPE_DEFAULT_SEGMENTS = 8;
const ROPE_SEGMENT_LENGTH = 28.5;
const ROPE_NODE_RADIUS = 4;
const ROPE_PIN_RADIUS = 10;
const ROPE_STIFFNESS = 1.0;
const ROPE_DAMPING = 0.0;
const ROPE_FADE_SPEED = 6;

const CUTTER_MAX_TRAIL = 14;
const CUTTER_TRAIL_DECAY = 0.12;
const CUTTER_BLADE_WIDTH = 9;
const CUTTER_HIT_RADIUS = 5;

const BUBBLE_RADIUS = 34;
const BUBBLE_BUOYANCY_FACTOR = 1.85;
const BUBBLE_AIR_FRICTION = 0.045;
const BUBBLE_MAX_UPWARD_SPEED = 4.2;


// Global scope  for compatibility across scripts and modules
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;

}
