/**
 * src/config.js
 * Global game configuration: dimensions, gravity, labels, and collision categories.
 * Responsibility: Ángel & Farid [BASE]
 */

const CONFIG = {
  // Proportional vertical resolution for Cut the Rope (Aspect Ratio 2:3, classic 320x480 / 640x960)
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 720,
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

  // Safe patch for p5.prototype.loadImage to support offline file:/// protocol without CORS blockage
  if (typeof p5 !== 'undefined' && p5.prototype && p5.prototype.loadImage) {
    const _origP5LoadImage = p5.prototype.loadImage;
    p5.prototype.loadImage = function(path, successCallback, failureCallback) {
      // If path is a data URI, standard p5 can process it or native Image
      const img = this.createImage ? this.createImage(1, 1) : (new p5.Image(1, 1, this));
      const nativeImg = new Image();
      img.elt = nativeImg;

      nativeImg.onload = () => {
        img.width = nativeImg.naturalWidth;
        img.height = nativeImg.naturalHeight;
        if (img.canvas) {
          img.canvas.width = nativeImg.naturalWidth;
          img.canvas.height = nativeImg.naturalHeight;
          if (img.drawingContext) {
            img.drawingContext.drawImage(nativeImg, 0, 0);
          }
        }
        img.modified = true;
        if (typeof successCallback === 'function') successCallback(img);
      };

      nativeImg.onerror = (err) => {
        if (typeof failureCallback === 'function') failureCallback(err);
      };

      nativeImg.src = path;
      return img;
    };
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG };
}
