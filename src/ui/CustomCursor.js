/**
 * src/ui/CustomCursor.js
 * Custom interactive white cursor with slice trail, sparkles, and state animations.
 * Responsibility: UI & Game Effects (Ariadna)
 */

class CustomCursor {
  static idleImg = null;
  static pressedImg = null;

  static preload() {
    const idleUri = 'data:image/png;base64,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';
    const pressedUri = 'data:image/png;base64,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';

    if (typeof loadImage === 'function') {
      CustomCursor.idleImg = loadImage('assets/cursor/cursor.png', () => {}, () => {
        // Fallback to data URI for offline/file:// protocol compatibility
        CustomCursor.idleImg = loadImage(idleUri);
      });

      CustomCursor.pressedImg = loadImage('assets/cursor/cursor_pressed.png', () => {}, () => {
        CustomCursor.pressedImg = loadImage(pressedUri);
      });
    }
  }

  constructor() {
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.vx = 0;
    this.vy = 0;

    this.isPressed = false;
    this.isVisible = false;

    // Trail points for the slash / cut effect
    this.trail = [];
    this.maxTrailLength = 22;

    // Sparkles / cut particles
    this.sparkles = [];

    // Base cursor dimensions (original ratio: 52x63)
    this.cursorWidth = 30;
    this.cursorHeight = 36;

    // Ensure images are loaded if preload was not triggered
    if (!CustomCursor.idleImg && typeof loadImage === 'function') {
      CustomCursor.preload();
    }
  }

  /**
   * Update cursor position, motion physics, trail decay, and particles
   */
  update() {
    // Check if mouse is within canvas boundaries
    const insideX = mouseX >= 0 && mouseX <= width;
    const insideY = mouseY >= 0 && mouseY <= height;
    this.isVisible = insideX && insideY;

    if (!this.isVisible) {
      // Fade out trail when cursor leaves the screen
      for (let i = 0; i < this.trail.length; i++) {
        this.trail[i].life -= 0.1;
      }
      this.trail = this.trail.filter(pt => pt.life > 0);
      return;
    }

    // Velocity and smooth positioning
    this.prevX = this.x;
    this.prevY = this.y;
    this.x = mouseX;
    this.y = mouseY;

    this.vx = this.x - this.prevX;
    this.vy = this.y - this.prevY;
    const speed = Math.hypot(this.vx, this.vy);

    // Add points to trail when dragging or moving fast
    if (this.isPressed || speed > 4) {
      this.trail.unshift({
        x: this.x,
        y: this.y,
        life: 1.0,
        decay: this.isPressed ? 0.045 : 0.07,
        maxLife: 1.0,
        speed: speed,
        isCutting: this.isPressed
      });

      // Spawn particles during active swipe
      if (this.isPressed && speed > 5 && Math.random() < 0.45) {
        this.addSparkle(
          this.x + (Math.random() - 0.5) * 8,
          this.y + (Math.random() - 0.5) * 8
        );
      }
    }

    // Trim trail size
    if (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }

    // Update existing trail points
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].life -= this.trail[i].decay;
    }
    this.trail = this.trail.filter(pt => pt.life > 0);

    // Update sparkles
    for (let i = 0; i < this.sparkles.length; i++) {
      const p = this.sparkles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // light gravity
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.size *= 0.93;
      p.rotation += p.vRot;
      p.life -= p.decay;
    }
    this.sparkles = this.sparkles.filter(p => p.life > 0 && p.size > 0.4);
  }

  /**
   * Render all cursor visual layers: trail, sparkles, and white pointer
   */
  render() {
    push();

    // 1. Render the cutting / movement trail behind the cursor
    this.renderTrail();

    // 2. Render sparkle particles
    this.renderSparkles();

    // 3. Render the white cursor pointer icon if inside canvas
    if (this.isVisible) {
      this.renderPointer();
    }

    pop();
  }

  /**
   * Renders the dynamic glowing slash trail
   */
  renderTrail() {
    if (this.trail.length < 2) return;

    push();
    noFill();
    strokeCap(ROUND);
    strokeJoin(ROUND);

    // Pass 1: Outer glow
    for (let i = 0; i < this.trail.length - 1; i++) {
      const p1 = this.trail[i];
      const p2 = this.trail[i + 1];
      const factor = p1.life;
      const baseWidth = p1.isCutting ? 13 : 7;
      const strokeW = baseWidth * factor;

      if (p1.isCutting) {
        stroke(255, 215, 80, Math.floor(130 * factor));
      } else {
        stroke(90, 215, 255, Math.floor(90 * factor));
      }
      strokeWeight(strokeW);
      line(p1.x, p1.y, p2.x, p2.y);
    }

    // Pass 2: High-intensity white core
    for (let i = 0; i < this.trail.length - 1; i++) {
      const p1 = this.trail[i];
      const p2 = this.trail[i + 1];
      const factor = p1.life;
      const coreWidth = (p1.isCutting ? 5 : 2.5) * factor;

      stroke(255, 255, 255, Math.floor(240 * factor));
      strokeWeight(coreWidth);
      line(p1.x, p1.y, p2.x, p2.y);
    }

    pop();
  }

  /**
   * Renders sparkle stars and embers
   */
  renderSparkles() {
    if (this.sparkles.length === 0) return;

    push();
    noStroke();
    rectMode(CENTER);

    for (let i = 0; i < this.sparkles.length; i++) {
      const p = this.sparkles[i];
      push();
      translate(p.x, p.y);
      rotate(p.rotation);

      const alpha = Math.floor(255 * (p.life / p.maxLife));
      fill(p.r, p.g, p.b, alpha);

      const s = p.size;
      quad(0, -s * 1.6, s * 0.4, 0, 0, s * 1.6, -s * 0.4, 0);
      quad(-s * 1.6, 0, 0, s * 0.4, s * 1.6, 0, 0, -s * 0.4);

      pop();
    }

    pop();
  }

  /**
   * Renders the custom white pointer
   */
  renderPointer() {
    push();

    // Hotspot is exactly at (this.x, this.y)
    const isCut = this.isPressed;
    const w = isCut ? this.cursorWidth * 0.94 : this.cursorWidth;
    const h = isCut ? this.cursorHeight * 0.94 : this.cursorHeight;

    // Small active aura at the tip when cutting/clicking
    if (isCut) {
      noStroke();
      fill(255, 220, 100, 70);
      circle(this.x + 1, this.y + 1, 16);
      fill(255, 255, 255, 180);
      circle(this.x + 1, this.y + 1, 6);
    }

    const activeImg = isCut
      ? (CustomCursor.pressedImg || CustomCursor.idleImg)
      : (CustomCursor.idleImg || CustomCursor.pressedImg);

    if (activeImg && activeImg.width > 0) {
      image(activeImg, this.x, this.y, w, h);
    } else {
      // Fallback vector drawing if image is still loading
      this.drawVectorFallback(w, h, isCut);
    }

    pop();
  }

  /**
   * Procedural fallback matching the white pointer with ball
   */
  drawVectorFallback(w, h, isCut) {
    push();
    translate(this.x, this.y);

    stroke(30);
    strokeWeight(1.8);
    strokeJoin(ROUND);

    // Ball at the base
    fill(245, 250, 255);
    ellipse(w * 0.58, h * 0.68, w * 0.38, w * 0.38);

    // Triangular white pointer body
    fill(255, 255, 255);
    beginShape();
    vertex(0, 0);
    vertex(w * 0.88, h * 0.32);
    vertex(w * 0.48, h * 0.60);
    vertex(w * 0.22, h * 0.90);
    endShape(CLOSE);

    pop();
  }

  /**
   * Spawn sparkle particle burst
   */
  addSparkle(x, y, r = 255, g = 230, b = 100) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;
    this.sparkles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.5 + Math.random() * 3.0,
      r: r,
      g: g,
      b: b,
      rotation: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 0.25,
      life: 1.0,
      maxLife: 1.0,
      decay: 0.04 + Math.random() * 0.03
    });
  }

  /**
   * Input event hooks
   */
  onPress(x, y) {
    this.isPressed = true;
    this.x = x;
    this.y = y;

    // Burst of sparks on click
    for (let i = 0; i < 6; i++) {
      this.addSparkle(x, y, 255, 220 + Math.random() * 35, 90);
    }
  }

  onDrag(x, y) {
    this.isPressed = true;
    this.x = x;
    this.y = y;
  }

  onRelease() {
    this.isPressed = false;
  }
}

// Global scope export
if (typeof window !== 'undefined') {
  window.CustomCursor = CustomCursor;
}
