/**
 * src/mechanics/Gimmicks.js
 * Special physics mechanics: Anti-gravity Bubble (Bubble), Air Cushion (AirCushion),
 * and decentralized asset loader (MechanicsAssets).
 * Responsibility: Farid [BASE + Mechanics]
 */

/**
 * Decentralized asset manager for Farid's mechanics module.
 * Invoked automatically by sketch.js inside preload().
 */
const MechanicsAssets = {
  bubbleSheet: null,
  bubbleAttachedSheet: null,
  cushionSheet: null,
  pinImg: null,
  sliceSound: null,
  popSound: null,
  cushionSound: null,
  loaded: false,

  /**
   * Loads a sprite image supporting both p5.js v2.x Promise-based loadImage()
   * and native HTMLImageElement for instant availability and file:// CORS fallback.
   * @param {string} path
   * @param {string} key
   */
  loadSprite(path, key) {
    if (typeof Image !== 'undefined') {
      const htmlImg = new Image();
      htmlImg.src = path;
      this[key] = htmlImg;
    }

    if (typeof loadImage === 'function') {
      try {
        const res = loadImage(path);
        if (res && typeof res.then === 'function') {
          res.then((p5Img) => {
            if (p5Img && p5Img.width > 0) {
              this[key] = p5Img;
            }
          }).catch(() => {});
        } else if (res && res.width > 0) {
          this[key] = res;
        }
      } catch (err) {
        // Keep HTMLImageElement fallback
      }
    }
  },

  /**
   * Checks whether a loaded image (p5.Image or HTMLImageElement) is decoded and ready to draw.
   * @param {Object|HTMLImageElement|null} img
   * @returns {boolean}
   */
  isReady(img) {
    if (!img || typeof img.then === 'function') return false;
    if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) {
      return Boolean(img.complete && img.naturalWidth > 0);
    }
    const elt = img.canvas || img.elt;
    if (elt) {
      const w = elt.naturalWidth || elt.width || img.width || 0;
      return w > 0;
    }
    return Boolean(img.width > 0 && img.height > 0);
  },

  /**
   * Returns the underlying drawable canvas/image element for CanvasRenderingContext2D.drawImage.
   * @param {Object|HTMLImageElement|null} img
   * @returns {HTMLImageElement|HTMLCanvasElement|null}
   */
  getDrawableSource(img) {
    if (!this.isReady(img)) return null;
    if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) {
      return img;
    }
    return img.canvas || img.elt || null;
  },

  /**
   * Draws an image or spritesheet sub-region centered at (dx, dy) with size (dw, dh),
   * compatible with both p5.Image and HTMLImageElement under active p5 transforms.
   * @param {Object|HTMLImageElement|null} img
   * @param {number} dx - Center X in current coordinate space
   * @param {number} dy - Center Y in current coordinate space
   * @param {number} dw - Destination width
   * @param {number} dh - Destination height
   * @param {number} [sx] - Optional source X
   * @param {number} [sy] - Optional source Y
   * @param {number} [sw] - Optional source width
   * @param {number} [sh] - Optional source height
   * @returns {boolean} True if drawn successfully
   */
  drawImageOrRegion(img, dx, dy, dw, dh, sx, sy, sw, sh) {
    if (!this.isReady(img)) return false;

    const hasCrop = (
      typeof sx === 'number' &&
      typeof sy === 'number' &&
      typeof sw === 'number' &&
      typeof sh === 'number'
    );

    // If p5.Image without sub-region crop, try native p5 image() first
    if (!hasCrop && img && (img.canvas || img.elt) && typeof image === 'function' && typeof imageMode === 'function') {
      try {
        imageMode(CENTER);
        image(img, dx, dy, dw, dh);
        return true;
      } catch (err) {
        // Fallback to drawingContext.drawImage below
      }
    }

    const src = this.getDrawableSource(img);
    if (src && typeof drawingContext !== 'undefined' && drawingContext && typeof drawingContext.drawImage === 'function') {
      try {
        if (hasCrop) {
          drawingContext.drawImage(src, sx, sy, sw, sh, dx - dw * 0.5, dy - dh * 0.5, dw, dh);
        } else {
          drawingContext.drawImage(src, dx - dw * 0.5, dy - dh * 0.5, dw, dh);
        }
        return true;
      } catch (err) {
        return false;
      }
    }

    return false;
  },

  preload() {
    if (this.loaded) return;

    // 1. Preload all 4 mechanics sprites
    this.loadSprite('assets/mechanics/bubble_sheet.png', 'bubbleSheet');
    this.loadSprite('assets/mechanics/bubble_attached.png', 'bubbleAttachedSheet');
    this.loadSprite('assets/mechanics/cushion.png', 'cushionSheet');
    this.loadSprite('assets/mechanics/pin.png', 'pinImg');

    // 2. Preload all 3 mechanics sound effects with preload = 'auto'
    if (typeof Audio !== 'undefined') {
      try {
        this.sliceSound = new Audio('assets/mechanics/slice.mp3');
        this.sliceSound.preload = 'auto';
        this.sliceSound.addEventListener('error', () => {
          this.sliceSound = null;
        });
        this.sliceSound.load();

        this.popSound = new Audio('assets/mechanics/pop.mp3');
        this.popSound.preload = 'auto';
        this.popSound.addEventListener('error', () => {
          this.popSound = null;
        });
        this.popSound.load();

        this.cushionSound = new Audio('assets/mechanics/cushion.mp3');
        this.cushionSound.preload = 'auto';
        this.cushionSound.addEventListener('error', () => {
          this.cushionSound = null;
        });
        this.cushionSound.load();
      } catch (err) {
        // Fallback procedural Web Audio API will be used
      }
    }

    this.loaded = true;
  }
};

/**
 * Bubble (Anti-gravity Bubble Mechanic)
 * Static sensor that captures the candy on contact, applies upward buoyancy force
 * each physics frame to invert gravity, and pops when clicked by the player.
 */
class Bubble {
  static activeInstances = [];

  /**
   * Supports both constructor signatures:
   * - new Bubble(x, y, radius)
   * - new Bubble(physicsWorld, x, y, radius)
   */
  constructor(worldOrX, xOrY, yOrRadius, maybeRadius) {
    const defaultRadius = typeof BUBBLE_RADIUS !== 'undefined' ? BUBBLE_RADIUS : 34;

    if (typeof worldOrX === 'object' && worldOrX !== null) {
      this.physicsWorld = worldOrX;
      this.x = Number(xOrY) || 0;
      this.y = Number(yOrRadius) || 0;
      this.radius = Number(maybeRadius) || defaultRadius;
    } else {
      this.physicsWorld = typeof physicsWorld !== 'undefined' ? physicsWorld : null;
      this.x = Number(worldOrX) || 0;
      this.y = Number(xOrY) || 0;
      this.radius = Number(yOrRadius) || defaultRadius;
    }

    this.type = 'bubble';
    this.state = 'IDLE'; // 'IDLE' | 'CAPTURED' | 'POPPED'
    this.capturedCandy = null;
    this.capturedCandyBody = null;
    this.originalFrictionAir = 0.001;

    // Animation & frame tracking state
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.captureAnimProgress = 0;
    this.flightFrameIndex = 0;
    this.flightFrameTimer = 0;
    this.popParticles = [];
    this.popRingRadius = this.radius;
    this.popRingAlpha = 0;
    this.destroyed = false;
    this._lastUpdateFrame = -1;
    this._lastRenderFrame = -1;
    this._boundCandyRef = (typeof levelManager !== 'undefined' && levelManager && levelManager.candy)
      ? levelManager.candy
      : null;

    this.body = null;
    this._beforeUpdateHandler = null;
    this._lastForceTime = 0;

    if (!MechanicsAssets.loaded) {
      MechanicsAssets.preload();
    }

    // Automatically clean up any stale Bubble instances left over from a previous level or restart
    Bubble.pruneStaleInstances(this.physicsWorld);

    this.initSensorBody();
    Bubble.activeInstances.push(this);
  }

  /**
   * Creates the static Matter.js sensor body at (this.x, this.y) and registers the physics tick hook.
   */
  initSensorBody() {
    if (typeof Matter === 'undefined') return;

    const bubbleLabel = (typeof CONFIG !== 'undefined' && CONFIG.LABELS)
      ? CONFIG.LABELS.BUBBLE
      : 'BUBBLE';

    this.body = Matter.Bodies.circle(this.x, this.y, this.radius, {
      label: bubbleLabel,
      isStatic: true,
      isSensor: true
    });

    this.body.gameObject = this;

    if (this.physicsWorld && typeof this.physicsWorld.addBody === 'function') {
      this.physicsWorld.addBody(this.body);

      // Hook directly into Matter.Events 'beforeUpdate' so upward force is guaranteed every physics step
      if (this.physicsWorld.Events && this.physicsWorld.engine) {
        this._beforeUpdateHandler = () => {
          this.applyBuoyancyStep();
        };
        this.physicsWorld.Events.on(this.physicsWorld.engine, 'beforeUpdate', this._beforeUpdateHandler);
      }
    }
  }

  /**
   * Automatic collision callback dispatched by PhysicsWorld when another body touches the bubble sensor.
   * @param {Object|Matter.Body} other
   * @param {Matter.Body} [otherBody]
   */
  onCollide(other, otherBody) {
    if (this.state !== 'IDLE' || this.destroyed) return;

    const isCandyEntity = other && (other.type === 'candy' || other.label === 'CANDY');
    const rawBody = otherBody || (other && other.body ? other.body : other);
    const candyLabel = (typeof CONFIG !== 'undefined' && CONFIG.LABELS) ? CONFIG.LABELS.CANDY : 'CANDY';
    const isCandyBody = rawBody && rawBody.label === candyLabel;

    if (!isCandyEntity && !isCandyBody) return;
    if (!rawBody) return;

    this.captureCandy(other, rawBody);
  }

  /**
   * Captures the candy body inside the bubble and activates upward buoyancy.
   * @param {Object} candyObj
   * @param {Matter.Body} candyBody
   */
  captureCandy(candyObj, candyBody) {
    this.state = 'CAPTURED';
    this.capturedCandy = candyObj;
    this.capturedCandyBody = candyBody;
    this.captureAnimProgress = 0;
    this.flightFrameIndex = 0;
    this.flightFrameTimer = 0;

    // Remove the static trigger sensor from the world so it no longer collides
    if (this.physicsWorld && this.body && typeof this.physicsWorld.removeBody === 'function') {
      this.physicsWorld.removeBody(this.body);
      this.body = null;
    }

    // Store original air friction and apply controlled bubble drag
    this.originalFrictionAir = typeof candyBody.frictionAir === 'number' ? candyBody.frictionAir : 0.001;
    const bubbleFriction = typeof BUBBLE_AIR_FRICTION !== 'undefined' ? BUBBLE_AIR_FRICTION : 0.045;
    candyBody.frictionAir = bubbleFriction;

  }

  /**
   * Applies the upward anti-gravity force (Matter.Body.applyForce) to the captured candy each step.
   */
  applyBuoyancyStep() {
    if (this.state !== 'CAPTURED' || !this.capturedCandyBody || this.destroyed) return;

    // If candy was eaten by Om Nom, release silently
    if (this.capturedCandy && this.capturedCandy.eaten) {
      this.destroy();
      return;
    }

    // If the captured candy body was removed from the physics world (e.g. level restart/change), clean up
    if (
      this.physicsWorld &&
      this.physicsWorld.world &&
      Array.isArray(this.physicsWorld.world.bodies) &&
      this.physicsWorld.world.bodies.indexOf(this.capturedCandyBody) === -1
    ) {
      this.destroy();
      return;
    }

    if (typeof Matter === 'undefined' || !Matter.Body) return;

    const candyBody = this.capturedCandyBody;
    this.x = candyBody.position.x;
    this.y = candyBody.position.y;

    const gravityY = (
      this.physicsWorld &&
      this.physicsWorld.world &&
      this.physicsWorld.world.gravity &&
      this.physicsWorld.world.gravity.y !== undefined
    )
      ? this.physicsWorld.world.gravity.y
      : ((typeof CONFIG !== 'undefined' && CONFIG.GRAVITY_Y !== undefined) ? CONFIG.GRAVITY_Y : 0.3);
    const gravityScale = (
      this.physicsWorld &&
      this.physicsWorld.world &&
      this.physicsWorld.world.gravity &&
      this.physicsWorld.world.gravity.scale !== undefined
    )
      ? this.physicsWorld.world.gravity.scale
      : 0.001;

    const buoyancyFactor = typeof BUBBLE_BUOYANCY_FACTOR !== 'undefined' ? BUBBLE_BUOYANCY_FACTOR : 1.85;
    const maxUpwardSpeed = typeof BUBBLE_MAX_UPWARD_SPEED !== 'undefined' ? BUBBLE_MAX_UPWARD_SPEED : 4.2;

    // Upward force overcomes downward gravity (F_g = m * g * scale)
    const upwardForceY = -candyBody.mass * gravityY * gravityScale * buoyancyFactor;

    Matter.Body.applyForce(candyBody, candyBody.position, {
      x: 0,
      y: upwardForceY
    });

    // Clamp terminal upward speed so the candy rises smoothly
    if (candyBody.velocity && candyBody.velocity.y < -maxUpwardSpeed) {
      Matter.Body.setVelocity(candyBody, {
        x: candyBody.velocity.x,
        y: -maxUpwardSpeed
      });
    }
  }

  /**
   * Updates visual animations and pop particles (idempotent per p5 frameCount).
   */
  update() {
    if (this.destroyed) return;

    if (typeof frameCount === 'number') {
      if (this._lastUpdateFrame === frameCount) return;
      this._lastUpdateFrame = frameCount;
    }

    this.wobblePhase += 0.09;

    if (this.state === 'CAPTURED') {
      this.captureAnimProgress = Math.min(1, this.captureAnimProgress + 0.12);
      this.flightFrameTimer++;
      if (this.flightFrameTimer >= 3) {
        this.flightFrameTimer = 0;
        this.flightFrameIndex = (this.flightFrameIndex + 1) % 14;
      }

      if (this.capturedCandyBody && this.capturedCandyBody.position) {
        this.x = this.capturedCandyBody.position.x;
        this.y = this.capturedCandyBody.position.y;
      }
      // Fallback if physicsWorld does not have Matter.Events attached
      if (!this._beforeUpdateHandler) {
        this.applyBuoyancyStep();
      }
    } else if (this.state === 'POPPED') {
      this.popRingRadius += 3.2;
      this.popRingAlpha = Math.max(0, this.popRingAlpha - 18);

      for (let i = 0; i < this.popParticles.length; i++) {
        const p = this.popParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.94;
        p.size *= 0.94;
        p.life -= p.decay;
      }
      this.popParticles = this.popParticles.filter(p => p.life > 0 && p.size > 0.5);
    }
  }

  /**
   * Checks if a player click at (clickX, clickY) hits the captured bubble and pops it.
   * @param {number} clickX
   * @param {number} clickY
   * @returns {boolean} True if the bubble was popped by this click
   */
  handleClick(clickX, clickY) {
    if (this.state !== 'CAPTURED' || !this.capturedCandyBody || this.destroyed) return false;

    const pos = this.capturedCandyBody.position;
    const dist = Math.hypot(clickX - pos.x, clickY - pos.y);
    const hitRadius = this.radius * 1.35;

    if (dist <= hitRadius) {
      this.pop();
      return true;
    }

    return false;
  }

  /**
   * Static helper to check clicks across all active Bubble instances in the current level.
   * @param {number} clickX
   * @param {number} clickY
   * @returns {boolean}
   */
  static handleGlobalClick(clickX, clickY) {
    for (let i = Bubble.activeInstances.length - 1; i >= 0; i--) {
      const b = Bubble.activeInstances[i];
      if (b && !b.destroyed && b.state === 'CAPTURED' && b.handleClick(clickX, clickY)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Pops the bubble, restores normal gravity/drag to the candy, plays pop.mp3, and spawns droplets.
   */
  pop() {
    if (this.state !== 'CAPTURED') return;

    this.state = 'POPPED';

    if (this.capturedCandyBody) {
      this.x = this.capturedCandyBody.position.x;
      this.y = this.capturedCandyBody.position.y;
      this.capturedCandyBody.frictionAir = this.originalFrictionAir;
    }

    this.capturedCandy = null;
    this.capturedCandyBody = null;
    this.detachEvents();

    // Play pop.mp3 sound
    this.playPopSound();

    // Spawn soap bubble pop ring and droplets
    this.popRingRadius = this.radius * 0.9;
    this.popRingAlpha = 230;

    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const speed = 2.0 + Math.random() * 3.5;
      this.popParticles.push({
        x: this.x + Math.cos(angle) * (this.radius * 0.65),
        y: this.y + Math.sin(angle) * (this.radius * 0.65),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 4 + Math.random() * 5,
        life: 1.0,
        decay: 0.055 + Math.random() * 0.03
      });
    }
  }

  /**
   * Plays assets/mechanics/pop.mp3 from MechanicsAssets respecting audioManager.isMuted.
   */
  playPopSound() {
    if (typeof audioManager !== 'undefined' && audioManager && audioManager.isMuted) {
      return;
    }

    if (typeof MechanicsAssets !== 'undefined' && MechanicsAssets && MechanicsAssets.popSound) {
      try {
        const snd = MechanicsAssets.popSound;
        if (typeof snd.play === 'function') {
          if (typeof snd.currentTime === 'number') {
            snd.currentTime = 0;
          }
          const playPromise = snd.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        }
      } catch (err) {
        // Ignore browser autoplay restrictions
      }
    }
  }

  /**
   * Renders the bubble in p5.js using bubble_attached.png (IDLE) and bubble_sheet.png (CAPTURED).
   */
  render() {
    if (this.destroyed) return;

    if (typeof frameCount === 'number') {
      this._lastRenderFrame = frameCount;
    }

    this.update();

    if (this.state === 'POPPED') {
      this.renderPopEffects();
      return;
    }

    push();
    translate(this.x, this.y);

    if (this.state === 'IDLE') {
      // Static circular bubble waiting for the candy using Frame 0 of bubble_attached.png
      const attachedFrame = (typeof BUBBLE_ATTACHED_FRAMES !== 'undefined' && Array.isArray(BUBBLE_ATTACHED_FRAMES))
        ? BUBBLE_ATTACHED_FRAMES[0]
        : { x: 0, y: 0, w: 98, h: 98 };
      const diameter = this.radius * 2.15;

      const drewAttached = (
        typeof MechanicsAssets !== 'undefined' &&
        MechanicsAssets &&
        MechanicsAssets.drawImageOrRegion(
          MechanicsAssets.bubbleAttachedSheet,
          0,
          0,
          diameter,
          diameter,
          attachedFrame.x,
          attachedFrame.y,
          attachedFrame.w,
          attachedFrame.h
        )
      );

      if (!drewAttached) {
        this.renderVectorFallback(diameter);
      }
    } else if (this.state === 'CAPTURED') {
      // Animated 14-frame wobbling bubble in flight using bubble_sheet.png
      const bounceScale = 1 + Math.sin(this.captureAnimProgress * Math.PI) * 0.12;
      scale(bounceScale, bounceScale);

      const flightFrames = (typeof BUBBLE_FLIGHT_FRAMES !== 'undefined' && Array.isArray(BUBBLE_FLIGHT_FRAMES))
        ? BUBBLE_FLIGHT_FRAMES
        : [
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

      const frame = flightFrames[this.flightFrameIndex % flightFrames.length];
      const baseSize = this.radius * 2.35;
      const drawW = baseSize * (frame.w / 99);
      const drawH = baseSize * (frame.h / 99);

      const drewFlight = (
        typeof MechanicsAssets !== 'undefined' &&
        MechanicsAssets &&
        MechanicsAssets.drawImageOrRegion(
          MechanicsAssets.bubbleSheet,
          0,
          0,
          drawW,
          drawH,
          frame.x,
          frame.y,
          frame.w,
          frame.h
        )
      );

      if (!drewFlight) {
        this.renderVectorFallback(baseSize);
      }
    }

    pop();
  }

  /**
   * Vector fallback when bubble sprites are still decoding.
   * @param {number} diameter
   */
  renderVectorFallback(diameter) {
    // 1. Translucent soap bubble body
    noStroke();
    fill(135, 220, 255, this.state === 'CAPTURED' ? 68 : 52);
    circle(0, 0, diameter);

    // Inner soft rim glow
    noFill();
    stroke(170, 235, 255, 95);
    strokeWeight(4.5);
    circle(0, 0, diameter * 0.93);

    // Outer crisp soap rim
    stroke(205, 248, 255, 225);
    strokeWeight(2.4);
    circle(0, 0, diameter);

    // Subtle rainbow iridescence arcs
    stroke(255, 185, 225, 125);
    strokeWeight(2.4);
    arc(0, 0, diameter * 0.86, diameter * 0.86, -Math.PI * 0.85, -Math.PI * 0.28);

    stroke(255, 245, 155, 130);
    strokeWeight(2.0);
    arc(0, 0, diameter * 0.80, diameter * 0.80, -Math.PI * 0.76, -Math.PI * 0.18);

    stroke(145, 245, 255, 145);
    strokeWeight(2.0);
    arc(0, 0, diameter * 0.88, diameter * 0.88, Math.PI * 0.15, Math.PI * 0.72);

    // 2. Crisp glossy specular highlights
    noStroke();
    fill(255, 255, 255, 220);
    push();
    translate(-diameter * 0.22, -diameter * 0.22);
    rotate(-Math.PI / 4);
    ellipse(0, 0, diameter * 0.25, diameter * 0.13);
    pop();

    fill(255, 255, 255, 160);
    circle(diameter * 0.22, diameter * 0.24, diameter * 0.08);
  }

  /**
   * Renders the expanding shockwave ring and soap droplets after the bubble is popped.
   */
  renderPopEffects() {
    if (this.popRingAlpha <= 0 && this.popParticles.length === 0) return;

    push();

    if (this.popRingAlpha > 0) {
      noFill();
      stroke(210, 248, 255, this.popRingAlpha);
      strokeWeight(2.5);
      circle(this.x, this.y, this.popRingRadius * 2);
    }

    noStroke();
    for (let i = 0; i < this.popParticles.length; i++) {
      const p = this.popParticles[i];
      const alpha = Math.floor(235 * p.life);
      fill(195, 245, 255, alpha);
      circle(p.x, p.y, p.size);
      fill(255, 255, 255, alpha);
      circle(p.x - p.size * 0.2, p.y - p.size * 0.2, p.size * 0.4);
    }

    pop();
  }

  /**
   * Unregisters the beforeUpdate listener from PhysicsWorld.
   */
  detachEvents() {
    if (
      this._beforeUpdateHandler &&
      this.physicsWorld &&
      this.physicsWorld.Events &&
      this.physicsWorld.engine
    ) {
      this.physicsWorld.Events.off(this.physicsWorld.engine, 'beforeUpdate', this._beforeUpdateHandler);
      this._beforeUpdateHandler = null;
    }
  }

  /**
   * Completely removes the bubble sensor and cleans up active references.
   */
  destroy() {
    this.destroyed = true;
    this.detachEvents();
    if (this.physicsWorld && this.body && typeof this.physicsWorld.removeBody === 'function') {
      this.physicsWorld.removeBody(this.body);
      this.body = null;
    }
    this.capturedCandy = null;
    this.capturedCandyBody = null;

    const idx = Bubble.activeInstances.indexOf(this);
    if (idx !== -1) {
      Bubble.activeInstances.splice(idx, 1);
    }
  }

  /**
   * Removes any stale Bubble instances left over from a previous level or restart
   * whose physics bodies were cleared from PhysicsWorld.
   * @param {PhysicsWorld|null} [world]
   */
  static pruneStaleInstances(world = null) {
    for (let i = Bubble.activeInstances.length - 1; i >= 0; i--) {
      const inst = Bubble.activeInstances[i];
      if (!inst || inst.destroyed) {
        Bubble.activeInstances.splice(i, 1);
        continue;
      }

      if (
        inst._boundCandyRef &&
        typeof levelManager !== 'undefined' &&
        levelManager &&
        levelManager.candy &&
        levelManager.candy !== inst._boundCandyRef
      ) {
        inst.destroy();
        continue;
      }

      const pw = inst.physicsWorld || world;
      const bodies = pw && pw.world && Array.isArray(pw.world.bodies) ? pw.world.bodies : null;
      if (bodies) {
        if (bodies.length === 0) {
          inst.destroy();
        } else if (inst.state === 'IDLE' && inst.body && bodies.indexOf(inst.body) === -1) {
          inst.destroy();
        } else if (inst.state === 'CAPTURED' && inst.capturedCandyBody && bodies.indexOf(inst.capturedCandyBody) === -1) {
          inst.destroy();
        } else if (inst.state === 'POPPED' && inst.popRingAlpha <= 0 && inst.popParticles.length === 0) {
          inst.destroy();
        }
      }
    }
  }

  /**
   * Destroys and clears all registered Bubble instances (used on level transitions/restarts).
   */
  static clearAll() {
    for (let i = Bubble.activeInstances.length - 1; i >= 0; i--) {
      const inst = Bubble.activeInstances[i];
      if (inst && typeof inst.destroy === 'function') {
        inst.destroy();
      }
    }
    Bubble.activeInstances = [];
  }
}

/**
 * AirCushion (Clickable Air Pump / Directional Impulse Mechanic)
 * Clickable object that compresses visually, plays cushion.mp3, and applies a directional
 * force vector (Matter.Body.applyForce) to the candy when within its air cone range.
 */
class AirCushion {
  static activeInstances = [];

  /**
   * Supports flexible constructor signatures:
   * - new AirCushion(x, y, directionOrAngle = 'RIGHT', options = {})
   * - new AirCushion(physicsWorld, x, y, directionOrAngle = 'RIGHT', options = {})
   */
  constructor(worldOrX, xOrY, yOrDir = 'RIGHT', dirOrOptions = {}, maybeOptions = {}) {
    let rawDir = 'RIGHT';
    let opts = {};

    if (typeof worldOrX === 'object' && worldOrX !== null) {
      this.physicsWorld = worldOrX;
      this.x = Number(xOrY) || 0;
      this.y = Number(yOrDir) || 0;
      if (typeof dirOrOptions === 'object' && dirOrOptions !== null && !dirOrOptions.body && !dirOrOptions.position) {
        opts = dirOrOptions;
        rawDir = opts.direction !== undefined ? opts.direction : (opts.angle !== undefined ? opts.angle : 'RIGHT');
      } else {
        rawDir = dirOrOptions !== undefined ? dirOrOptions : 'RIGHT';
        opts = (typeof maybeOptions === 'object' && maybeOptions !== null) ? maybeOptions : {};
      }
    } else {
      this.physicsWorld = typeof physicsWorld !== 'undefined' ? physicsWorld : null;
      this.x = Number(worldOrX) || 0;
      this.y = Number(xOrY) || 0;
      if (typeof yOrDir === 'object' && yOrDir !== null && !yOrDir.body && !yOrDir.position) {
        opts = yOrDir;
        rawDir = opts.direction !== undefined ? opts.direction : (opts.angle !== undefined ? opts.angle : 'RIGHT');
      } else {
        rawDir = yOrDir !== undefined ? yOrDir : 'RIGHT';
        opts = (typeof dirOrOptions === 'object' && dirOrOptions !== null) ? dirOrOptions : {};
      }
    }

    const defaultRadius = typeof AIR_CUSHION_RADIUS !== 'undefined' ? AIR_CUSHION_RADIUS : 48;
    const defaultRange = typeof AIR_CUSHION_RANGE !== 'undefined' ? AIR_CUSHION_RANGE : 240;
    const defaultCone = typeof AIR_CUSHION_CONE_HALF_ANGLE !== 'undefined' ? AIR_CUSHION_CONE_HALF_ANGLE : Math.PI * 0.38;
    const defaultForce = typeof AIR_CUSHION_FORCE !== 'undefined' ? AIR_CUSHION_FORCE : 0.0085;
    const defaultBoost = typeof AIR_CUSHION_VELOCITY_BOOST !== 'undefined' ? AIR_CUSHION_VELOCITY_BOOST : 0.65;

    this.type = 'air_cushion';
    this.radius = Number(opts.radius) || defaultRadius;
    this.range = Number(opts.range) || defaultRange;
    this.coneHalfAngle = Number(opts.coneHalfAngle) || defaultCone;
    this.force = Number(opts.force) || defaultForce;
    this.velocityBoost = Number(opts.velocityBoost) || defaultBoost;
    this.angle = AirCushion.normalizeAngle(rawDir);

    // Optional explicit candy reference if passed in constructor
    const explicitCandy = opts.candy || opts.candyBody || (dirOrOptions && (dirOrOptions.body || dirOrOptions.position) ? dirOrOptions : null);
    this.targetCandyBody = (explicitCandy && explicitCandy.body) ? explicitCandy.body : explicitCandy;

    // Animation & interaction state
    this.isPuffing = false;
    this.animFrameIndex = 0;
    this.animTimer = 0;
    this.lastPuffTime = 0;
    this.airParticles = [];
    this.destroyed = false;
    this._lastUpdateFrame = -1;
    this._lastRenderFrame = -1;
    this._boundCandyRef = (typeof levelManager !== 'undefined' && levelManager && levelManager.candy)
      ? levelManager.candy
      : null;

    this.body = null;

    if (!MechanicsAssets.loaded) {
      MechanicsAssets.preload();
    }

    this.initBody();
    AirCushion.activeInstances.push(this);
  }

  /**
   * Normalizes a direction string, cardinal sign, degree value, or radian angle to radians.
   * @param {string|number} dirOrAngle
   * @returns {number} Angle in radians (0 = RIGHT, PI = LEFT, -PI/2 = UP, PI/2 = DOWN)
   */
  static normalizeAngle(dirOrAngle) {
    if (typeof dirOrAngle === 'string') {
      const upper = dirOrAngle.trim().toUpperCase();
      if (upper === 'LEFT' || upper === 'L' || upper === 'WEST') return Math.PI;
      if (upper === 'UP' || upper === 'U' || upper === 'TOP' || upper === 'NORTH') return -Math.PI * 0.5;
      if (upper === 'DOWN' || upper === 'D' || upper === 'BOTTOM' || upper === 'SOUTH') return Math.PI * 0.5;
      return 0; // Default 'RIGHT'
    }

    if (typeof dirOrAngle === 'number' && !Number.isNaN(dirOrAngle)) {
      if (dirOrAngle === -1) return Math.PI;
      if (dirOrAngle === 1 || dirOrAngle === 0) return 0;
      if (Math.abs(dirOrAngle) > Math.PI * 2) {
        return (dirOrAngle * Math.PI) / 180;
      }
      return dirOrAngle;
    }

    return 0;
  }

  /**
   * Creates the static non-blocking sensor body in PhysicsWorld.
   */
  initBody() {
    if (typeof Matter === 'undefined') return;

    const cushionLabel = (typeof CONFIG !== 'undefined' && CONFIG.LABELS && CONFIG.LABELS.AIR_CUSHION)
      ? CONFIG.LABELS.AIR_CUSHION
      : 'AIR_CUSHION';
    const sensorCat = (typeof CONFIG !== 'undefined' && CONFIG.COLLISION_CATEGORIES)
      ? CONFIG.COLLISION_CATEGORIES.SENSOR
      : 0x0008;

    this.body = Matter.Bodies.circle(this.x, this.y, this.radius, {
      label: cushionLabel,
      isStatic: true,
      isSensor: true,
      collisionFilter: {
        category: sensorCat,
        mask: 0
      }
    });

    this.body.gameObject = this;

    if (this.physicsWorld && typeof this.physicsWorld.addBody === 'function') {
      this.physicsWorld.addBody(this.body);
    }
  }

  /**
   * Resolves the active Candy Matter.Body from explicit reference, LevelManager, or PhysicsWorld.
   * @param {Matter.Body|Object|null} [overrideCandy]
   * @returns {Matter.Body|null}
   */
  resolveCandyBody(overrideCandy = null) {
    if (overrideCandy) {
      return overrideCandy.body ? overrideCandy.body : overrideCandy;
    }

    if (typeof levelManager !== 'undefined' && levelManager && levelManager.candy) {
      if (levelManager.candy.eaten) return null;
      if (levelManager.candy.body) return levelManager.candy.body;
    }

    if (this.targetCandyBody && this.targetCandyBody.position) {
      if (this.targetCandyBody.gameObject && this.targetCandyBody.gameObject.eaten) return null;
      return this.targetCandyBody;
    }

    if (this.physicsWorld && this.physicsWorld.world && Array.isArray(this.physicsWorld.world.bodies)) {
      const candyLabel = (typeof CONFIG !== 'undefined' && CONFIG.LABELS) ? CONFIG.LABELS.CANDY : 'CANDY';
      const bodies = this.physicsWorld.world.bodies;
      for (let i = 0; i < bodies.length; i++) {
        if (bodies[i] && bodies[i].label === candyLabel) {
          return bodies[i];
        }
      }
    }

    return null;
  }

  /**
   * Checks if a player click at (clickX, clickY) hits this AirCushion and activates it.
   * @param {number} clickX
   * @param {number} clickY
   * @param {Matter.Body|Object|null} [candyOverride]
   * @returns {boolean} True if clicked and triggered
   */
  handleClick(clickX, clickY, candyOverride = null) {
    if (this.destroyed) return false;

    const dist = Math.hypot(clickX - this.x, clickY - this.y);
    const hitRadius = this.radius * 1.35;

    if (dist <= hitRadius) {
      this.puff(candyOverride);
      return true;
    }

    return false;
  }

  /**
   * Static helper to process clicks across all active AirCushion instances in the level.
   * @param {number} clickX
   * @param {number} clickY
   * @returns {boolean}
   */
  static handleGlobalClick(clickX, clickY) {
    for (let i = AirCushion.activeInstances.length - 1; i >= 0; i--) {
      const c = AirCushion.activeInstances[i];
      if (c && !c.destroyed && c.handleClick(clickX, clickY)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Triggers the air cushion compression animation, sound effect, air stream particles,
   * and directional physical force on the candy if inside the air cone.
   * @param {Matter.Body|Object|null} [candyOverride]
   * @returns {boolean} True if the candy was inside the cone and received an impulse
   */
  puff(candyOverride = null) {
    if (this.destroyed) return false;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const cooldown = typeof AIR_CUSHION_COOLDOWN_MS !== 'undefined' ? AIR_CUSHION_COOLDOWN_MS : 180;
    if (this.lastPuffTime > 0 && now - this.lastPuffTime < cooldown) {
      return false;
    }
    this.lastPuffTime = now;

    // 1. Start 6-frame compression/blow animation
    this.isPuffing = true;
    this.animFrameIndex = 1;
    this.animTimer = 0;

    // 2. Play cushion.mp3 sound effect
    this.playCushionSound();

    // 3. Spawn visual air jet stream & puff rings along nozzle direction
    this.spawnAirJetParticles();

    // 4. Apply directional impulse to the candy if within range and cone
    return this.applyAirImpulse(candyOverride);
  }

  /**
   * Alias for puff() in case external callers invoke trigger() or activate().
   * @param {Matter.Body|Object|null} [candyOverride]
   * @returns {boolean}
   */
  trigger(candyOverride = null) {
    return this.puff(candyOverride);
  }

  /**
   * Evaluates whether the candy is within this cushion's air cone and applies Matter.Body.applyForce.
   * @param {Matter.Body|Object|null} [candyOverride]
   * @returns {boolean} True if force was applied to the candy
   */
  applyAirImpulse(candyOverride = null) {
    if (typeof Matter === 'undefined' || !Matter.Body) return false;

    const candyBody = this.resolveCandyBody(candyOverride);
    if (!candyBody || !candyBody.position) return false;

    const ux = Math.cos(this.angle);
    const uy = Math.sin(this.angle);

    // Nozzle origin slightly ahead of cushion center
    const nozzleX = this.x + ux * (this.radius * 0.45);
    const nozzleY = this.y + uy * (this.radius * 0.45);

    const dx = candyBody.position.x - nozzleX;
    const dy = candyBody.position.y - nozzleY;
    const dist = Math.hypot(dx, dy);

    if (dist < 1e-4 || dist > this.range) return false;

    const dirX = dx / dist;
    const dirY = dy / dist;
    const dot = dirX * ux + dirY * uy;
    const minCos = Math.cos(this.coneHalfAngle);

    // Allow generous hit when very close to the nozzle (< 55px), or inside angular cone
    if (dist > 55 && dot < minCos) {
      return false;
    }

    // Distance attenuation (stronger near nozzle, smooth falloff out to this.range)
    const falloff = Math.max(0.35, 1 - 0.65 * (dist / this.range));
    const mass = typeof candyBody.mass === 'number' && candyBody.mass > 0 ? candyBody.mass : 1;
    const forceMag = this.force * mass * falloff;

    // Apply physical force vector via Matter.Body.applyForce
    Matter.Body.applyForce(candyBody, candyBody.position, {
      x: ux * forceMag,
      y: uy * forceMag
    });

    // Apply responsive velocity impulse so lateral push works smoothly even inside high-drag Bubble
    if (candyBody.velocity && typeof Matter.Body.setVelocity === 'function') {
      const boost = this.velocityBoost * falloff;
      Matter.Body.setVelocity(candyBody, {
        x: candyBody.velocity.x + ux * boost,
        y: candyBody.velocity.y + uy * boost * 0.85
      });
    }

    return true;
  }

  /**
   * Plays assets/mechanics/cushion.mp3 from MechanicsAssets respecting audioManager.isMuted.
   */
  playCushionSound() {
    if (typeof audioManager !== 'undefined' && audioManager && audioManager.isMuted) {
      return;
    }

    if (typeof MechanicsAssets !== 'undefined' && MechanicsAssets && MechanicsAssets.cushionSound) {
      try {
        const snd = MechanicsAssets.cushionSound;
        if (typeof snd.play === 'function') {
          if (typeof snd.currentTime === 'number') {
            snd.currentTime = 0;
          }
          const playPromise = snd.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        }
      } catch (err) {
        // Ignore browser autoplay restrictions
      }
    }
  }

  /**
   * Spawns directional wind streaks and expanding air rings when the cushion puffs.
   */
  spawnAirJetParticles() {
    const ux = Math.cos(this.angle);
    const uy = Math.sin(this.angle);
    const nx = -uy;
    const ny = ux;

    const startX = this.x + ux * (this.radius * 0.78);
    const startY = this.y + uy * (this.radius * 0.78);

    // 1. Expanding air puff rings traveling along the cone
    for (let r = 0; r < 3; r++) {
      this.airParticles.push({
        isRing: true,
        x: startX + ux * (r * 10),
        y: startY + uy * (r * 10),
        vx: ux * (4.8 + r * 1.1),
        vy: uy * (4.8 + r * 1.1),
        angle: this.angle,
        size: 16 + r * 6,
        grow: 1.6,
        life: 1.0,
        decay: 0.055 + r * 0.008
      });
    }

    // 2. Wind stream droplets / streaks
    for (let i = 0; i < 14; i++) {
      const spread = (Math.random() - 0.5) * this.coneHalfAngle * 1.15;
      const pAngle = this.angle + spread;
      const speed = 4.2 + Math.random() * 5.2;
      const lateralOffset = (Math.random() - 0.5) * 18;

      this.airParticles.push({
        isRing: false,
        x: startX + nx * lateralOffset,
        y: startY + ny * lateralOffset,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        angle: pAngle,
        len: 10 + Math.random() * 14,
        size: 3.5 + Math.random() * 4,
        life: 1.0,
        decay: 0.048 + Math.random() * 0.025
      });
    }
  }

  /**
   * Advances the 6-frame cushion animation and wind particles (idempotent per p5 frameCount).
   */
  update() {
    if (this.destroyed) return;

    if (typeof frameCount === 'number') {
      if (this._lastUpdateFrame === frameCount) return;
      this._lastUpdateFrame = frameCount;
    }

    if (this.isPuffing) {
      this.animTimer++;
      // Advance through frames 1..5 at ~20 FPS (every 3 render ticks at 60 FPS)
      if (this.animTimer >= 3) {
        this.animTimer = 0;
        this.animFrameIndex++;
        if (this.animFrameIndex >= 6) {
          this.animFrameIndex = 0;
          this.isPuffing = false;
        }
      }
    }

    for (let i = 0; i < this.airParticles.length; i++) {
      const p = this.airParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      if (p.isRing) {
        p.size += p.grow;
      }
      p.life -= p.decay;
    }
    this.airParticles = this.airParticles.filter(p => p.life > 0);
  }

  /**
   * Renders the air stream particles and the rotated AirCushion sprite (or vector fallback).
   */
  render() {
    if (this.destroyed) return;

    if (typeof frameCount === 'number') {
      this._lastRenderFrame = frameCount;
    }

    this.update();

    push();

    // 1. Draw air cone particles behind/around the nozzle
    this.renderAirParticles();

    // 2. Draw cushion body oriented toward this.angle (static when idle)
    translate(this.x, this.y);
    // In cushion.png, the nozzle points UP (-PI/2), so rotating by (this.angle + PI/2) points it along this.angle
    rotate(this.angle + Math.PI * 0.5);

    const frames = typeof CUSHION_FRAMES !== 'undefined' && Array.isArray(CUSHION_FRAMES)
      ? CUSHION_FRAMES
      : [
          { x: 10, y: 2, w: 133, h: 140 },
          { x: 0, y: 175, w: 132, h: 150 },
          { x: 0, y: 343, w: 131, h: 168 },
          { x: 10, y: 525, w: 131, h: 147 },
          { x: 11, y: 688, w: 136, h: 125 },
          { x: 10, y: 829, w: 133, h: 131 }
        ];

    const frame = frames[Math.min(frames.length - 1, Math.max(0, this.animFrameIndex))];
    const baseSize = this.radius * 2.3;
    const drawW = baseSize * (frame.w / 140);
    const drawH = baseSize * (frame.h / 140);

    const drewSprite = (
      typeof MechanicsAssets !== 'undefined' &&
      MechanicsAssets &&
      MechanicsAssets.drawImageOrRegion(
        MechanicsAssets.cushionSheet,
        0,
        0,
        drawW,
        drawH,
        frame.x,
        frame.y,
        frame.w,
        frame.h
      )
    );

    if (!drewSprite) {
      this.renderVectorFallback();
    }

    pop();
  }

  /**
   * Vector fallback matching the blue Cut the Rope air cushion when sprite is still decoding.
   */
  renderVectorFallback() {
    const r = this.radius;
    const stretchY = this.isPuffing
      ? (this.animFrameIndex <= 2 ? 1.16 : 0.90)
      : 1.0;
    const stretchX = this.isPuffing
      ? (this.animFrameIndex <= 2 ? 0.88 : 1.08)
      : 1.0;

    push();
    scale(stretchX, stretchY);

    // Drop shadow
    noStroke();
    fill(20, 30, 45, 70);
    ellipse(2, 4, r * 1.85, r * 1.75);

    // Nozzle neck at top (-Y)
    stroke(34, 48, 72);
    strokeWeight(2.4);
    fill(74, 130, 228);
    rectMode(CENTER);
    rect(0, -r * 0.86, r * 0.42, r * 0.36, 5);

    // Nozzle lip
    fill(105, 162, 250);
    ellipse(0, -r * 1.02, r * 0.62, r * 0.24);
    fill(32, 52, 88);
    ellipse(0, -r * 1.03, r * 0.36, r * 0.11);

    // Main cushion bulb
    fill(92, 148, 245);
    ellipse(0, 0, r * 1.8, r * 1.7);

    // Inner darker blue patch
    noStroke();
    fill(65, 114, 208);
    rect(0, 0, r * 1.05, r * 1.05, 14);

    // Gloss highlight
    fill(190, 232, 255, 220);
    ellipse(r * 0.42, -r * 0.38, r * 0.22, r * 0.32);

    pop();
  }

  /**
   * Renders the directional air rings and wind streaks emitted during puff().
   */
  renderAirParticles() {
    if (this.airParticles.length === 0) return;

    for (let i = 0; i < this.airParticles.length; i++) {
      const p = this.airParticles[i];
      const alpha = Math.floor(220 * p.life);

      push();
      translate(p.x, p.y);
      rotate(p.angle);

      if (p.isRing) {
        noFill();
        stroke(215, 245, 255, alpha);
        strokeWeight(2.4 * p.life);
        arc(0, 0, p.size * 0.65, p.size * 1.35, -Math.PI * 0.42, Math.PI * 0.42);
      } else {
        stroke(235, 250, 255, alpha);
        strokeWeight(2.2 * p.life);
        line(-p.len * 0.5, 0, p.len * 0.5, 0);

        noStroke();
        fill(255, 255, 255, Math.floor(180 * p.life));
        circle(p.len * 0.35, 0, p.size * p.life);
      }

      pop();
    }
  }

  /**
   * Removes this AirCushion's sensor body from PhysicsWorld and unregisters it from activeInstances.
   */
  destroy() {
    this.destroyed = true;
    if (this.physicsWorld && this.body && typeof this.physicsWorld.removeBody === 'function') {
      this.physicsWorld.removeBody(this.body);
    }
    this.body = null;
    this.targetCandyBody = null;

    const idx = AirCushion.activeInstances.indexOf(this);
    if (idx !== -1) {
      AirCushion.activeInstances.splice(idx, 1);
    }
  }

  /**
   * Destroys and clears all registered AirCushion instances (used on level transitions/restarts).
   */
  static clearAll() {
    for (let i = AirCushion.activeInstances.length - 1; i >= 0; i--) {
      const inst = AirCushion.activeInstances[i];
      if (inst && typeof inst.destroy === 'function') {
        inst.destroy();
      }
    }
    AirCushion.activeInstances = [];
  }
}

// Global scope export
if (typeof window !== 'undefined') {
  window.MechanicsAssets = MechanicsAssets;
  window.Bubble = Bubble;
  window.AirCushion = AirCushion;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MechanicsAssets, Bubble, AirCushion };
}
