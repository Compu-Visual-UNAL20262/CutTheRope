/**
 * src/config.js
 * Global game configuration: dimensions, gravity, labels, and collision categories.
 * Responsibility: Ángel & Farid [BASE]
 */

 const CONFIG = {
  // Proportional vertical resolution for Cut the Rope (Aspect Ratio 2:3, classic 320x480 / 640x960)
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 720,
  GRAVITY_Y: 0.8,

  LABELS: {
    CANDY: 'CANDY',
    STAR: 'STAR',
    TARGET: 'TARGET',
    BUBBLE: 'BUBBLE',
    AIR_CUSHION: 'AIR_CUSHION',
    ROPE_NODE: 'ROPE_NODE',
    SPIKE: 'SPIKE' // Reserved for optional spikes mechanic
  },

  COLLISION_CATEGORIES: {
    DEFAULT: 0x0001,
    CANDY: 0x0002,
    ROPE: 0x0004,
    SENSOR: 0x0008
  },

  LOADING_SPEED: 1.0//0.005 // ~3.3s loading duration at 60 FPS
};

// Entities-related constants
 const CANDY_RADIUS = 25
 const MASCARA_RADIUS = CANDY_RADIUS+2
 const TARGET_RADIUS = 60
 const DETECTION_RADIUS = 150
 const STAR_RADIUS = 20
 const STAR_BG_RATIO = 8

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
    ],
    frameRate: 8,
    loop: true,
    loopStart: 3
  }, 

  sad: {
    frames: [
      {x:774,  y:0, w:142, h:126},
      {x:916,  y:0, w:135, h:129},
      {x:1051, y:0, w:131, h:134},
      {x:1182, y:0, w:127, h:137},
      {x:1309, y:0, w:125, h:139},
      {x:1434, y:0, w:125, h:141},
      {x:1559, y:0, w:127, h:135},
      {x:1686, y:0, w:129, h:130},
      {x:1815, y:0, w:131, h:127}
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

const STAR_SPRITES = {
  bg: [{x:14, y:6, w:122, h:126}],
  animation: {
    frames: [
      {x:156, y:2, w:49, h:49},
      {x:209, y:2, w:41, h:49},
      {x:254, y:2, w:33, h:49},
      {x:291, y:2, w:26, h:50},
      {x:321, y:2, w:18, h:50},
      {x:343, y:2, w:22, h:50},
      {x:369, y:2, w:27, h:50},
      {x:400, y:2, w:31, h:50},
      {x:435, y:2, w:36, h:50},
      {x:400, y:56, w:40, h:50},
      {x:444, y:56, w:44, h:50}
    ],
    frameRate: 1.5,
    loop: true
  },
}

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
const BUBBLE_BUOYANCY_FACTOR = 1.4;
const BUBBLE_AIR_FRICTION = 0.045;
const BUBBLE_MAX_UPWARD_SPEED = 1.5;

const AIR_CUSHION_RADIUS = 48;
const AIR_CUSHION_RANGE = 240;
const AIR_CUSHION_CONE_HALF_ANGLE = Math.PI * 0.38;
const AIR_CUSHION_FORCE = 0.0085;
const AIR_CUSHION_VELOCITY_BOOST = 0.65;
const AIR_CUSHION_COOLDOWN_MS = 180;

const BUBBLE_FLIGHT_FRAMES = [
  { x: 0, y: 0,    w: 90,  h: 108 },
  { x: 0, y: 108,  w: 90,  h: 107 },
  { x: 0, y: 215,  w: 94,  h: 103 },
  { x: 0, y: 318,  w: 98,  h: 100 },
  { x: 0, y: 418,  w: 102, h: 98  },
  { x: 0, y: 516,  w: 106, h: 93  },
  { x: 0, y: 609,  w: 108, h: 90  },
  { x: 0, y: 699,  w: 108, h: 89  },
  { x: 0, y: 788,  w: 106, h: 90  },
  { x: 0, y: 878,  w: 102, h: 94  },
  { x: 0, y: 972,  w: 98,  h: 99  },
  { x: 0, y: 1071, w: 94,  h: 105 },
  { x: 0, y: 1176, w: 90,  h: 107 },
  { x: 0, y: 1283, w: 90,  h: 109 }
];

const BUBBLE_ATTACHED_FRAMES = [
  { x: 0, y: 0, w: 98, h: 98 },
  { x: 2, y: 99, w: 112, h: 129 },
  { x: 1, y: 231, w: 114, h: 113 },
  { x: 1, y: 346, w: 114, h: 111 }
];

const CUSHION_FRAMES = [
  { x: 10, y: 2, w: 133, h: 140 },
  { x: 0, y: 175, w: 132, h: 150 },
  { x: 0, y: 343, w: 131, h: 168 },
  { x: 10, y: 525, w: 131, h: 147 },
  { x: 11, y: 688, w: 136, h: 125 },
  { x: 10, y: 829, w: 133, h: 131 }
];


// Global scope  for compatibility across scripts and modules
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;

}
