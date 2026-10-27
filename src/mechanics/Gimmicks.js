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
  sliceSound: null,
  popSound: null,
  loaded: false,

  preload() {
    if (this.loaded) return;

    if (typeof Image !== 'undefined') {
      const bFlight = new Image();
      bFlight.src = 'assets/mechanics/bubble_sheet.png';
      this.bubbleSheet = bFlight;

      const bAttached = new Image();
      bAttached.src = 'assets/mechanics/bubble_attached.png';
      this.bubbleAttachedSheet = bAttached;
    }

    if (typeof Audio !== 'undefined') {
      // Optional external audio files in assets/mechanics/ (gracefully fallback to Web Audio API if absent)
      try {
        const sliceAudio = new Audio('assets/mechanics/slice.mp3');
        sliceAudio.preload = 'none';
        sliceAudio.addEventListener('canplaythrough', () => {
          this.sliceSound = sliceAudio;
        });

        const popAudio = new Audio('assets/mechanics/pop.mp3');
        popAudio.preload = 'none';
        popAudio.addEventListener('canplaythrough', () => {
          this.popSound = popAudio;
        });
      } catch (err) {
        // Fallback procedural audio will be used
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
  static audioCtx = null;

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

    // Animation state
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.captureAnimProgress = 0;
    this.popParticles = [];
    this.popRingRadius = this.radius;
    this.popRingAlpha = 0;

    this.body = null;
    this._beforeUpdateHandler = null;
    this._lastForceTime = 0;

    if (!MechanicsAssets.loaded) {
      MechanicsAssets.preload();
    }

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

    if (this.physicsWorld) {
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
    if (this.state !== 'IDLE') return;

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

    // Remove the static trigger sensor from the world so it no longer collides
    if (this.physicsWorld && this.body) {
      this.physicsWorld.removeBody(this.body);
      this.body = null;
    }

    // Store original air friction and apply controlled bubble drag
    this.originalFrictionAir = typeof candyBody.frictionAir === 'number' ? candyBody.frictionAir : 0.001;
    const bubbleFriction = typeof BUBBLE_AIR_FRICTION !== 'undefined' ? BUBBLE_AIR_FRICTION : 0.045;
    candyBody.frictionAir = bubbleFriction;

    // Dampen initial fall momentum smoothly so the bubble catches the candy immediately
    if (typeof Matter !== 'undefined' && Matter.Body && candyBody.velocity) {
      Matter.Body.setVelocity(candyBody, {
        x: candyBody.velocity.x * 0.45,
        y: Math.min(0, candyBody.velocity.y * 0.2)
      });
    }
  }

  /**
   * Applies the upward anti-gravity force (Matter.Body.applyForce) to the captured candy each step.
   */
  applyBuoyancyStep() {
    if (this.state !== 'CAPTURED' || !this.capturedCandyBody) return;

    // If candy was eaten by Om Nom, release silently
    if (this.capturedCandy && this.capturedCandy.eaten) {
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
   * Updates visual animations and pop particles.
   */
  update() {
    this.wobblePhase += 0.09;

    if (this.state === 'CAPTURED') {
      this.captureAnimProgress = Math.min(1, this.captureAnimProgress + 0.12);
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
    if (this.state !== 'CAPTURED' || !this.capturedCandyBody) return false;

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
      if (b && b.state === 'CAPTURED' && b.handleClick(clickX, clickY)) {
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

    // Play pop sound
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
   * Plays pop.mp3 from MechanicsAssets if available, or synthesizes a bubble pop via Web Audio API.
   */
  playPopSound() {
    if (typeof audioManager !== 'undefined' && audioManager && audioManager.isMuted) {
      return;
    }

    if (MechanicsAssets && MechanicsAssets.popSound) {
      try {
        const snd = MechanicsAssets.popSound;
        if (typeof snd.play === 'function') {
          snd.currentTime = 0;
          snd.play();
          return;
        }
      } catch (e) {
        // Fallback to procedural pop below
      }
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!Bubble.audioCtx) {
        Bubble.audioCtx = new AudioContextClass();
      }
      const ctx = Bubble.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.065);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (err) {
      // Ignore audio errors
    }
  }

  /**
   * Renders the bubble in p5.js according to its current state (IDLE, CAPTURED, or POPPED).
   */
  render() {
    // Advance internal animations smoothly during render
    this.update();

    if (this.state === 'POPPED') {
      this.renderPopEffects();
      return;
    }

    const drawX = this.x;
    const drawY = this.y + (this.state === 'IDLE' ? Math.sin(this.wobblePhase) * 2.5 : 0);

    // Squash & stretch wobble
    const wobbleAmp = this.state === 'CAPTURED' ? 0.045 : 0.03;
    const bounceScale = this.state === 'CAPTURED'
      ? 1 + Math.sin(this.captureAnimProgress * Math.PI) * 0.14
      : 1.0;
    const scaleX = (1 + Math.sin(this.wobblePhase) * wobbleAmp) * bounceScale;
    const scaleY = (1 - Math.sin(this.wobblePhase) * wobbleAmp) * bounceScale;
    const diameter = this.radius * 2 * (this.state === 'CAPTURED' ? 1.12 : 1.0);

    push();
    translate(drawX, drawY);
    scale(scaleX, scaleY);

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
    arc(0, 0, diameter * 0.86, diameter * 0.86, -PI * 0.85, -PI * 0.28);

    stroke(255, 245, 155, 130);
    strokeWeight(2.0);
    arc(0, 0, diameter * 0.80, diameter * 0.80, -PI * 0.76, -PI * 0.18);

    stroke(145, 245, 255, 145);
    strokeWeight(2.0);
    arc(0, 0, diameter * 0.88, diameter * 0.88, PI * 0.15, PI * 0.72);

    // 2. Crisp glossy specular highlights
    noStroke();
    fill(255, 255, 255, 220);
    push();
    translate(-diameter * 0.22, -diameter * 0.22);
    rotate(-PI / 4);
    ellipse(0, 0, diameter * 0.25, diameter * 0.13);
    pop();

    fill(255, 255, 255, 160);
    circle(diameter * 0.22, diameter * 0.24, diameter * 0.08);

    pop();
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
    this.detachEvents();
    if (this.physicsWorld && this.body) {
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
}

// Global scope export
if (typeof window !== 'undefined') {
  window.MechanicsAssets = MechanicsAssets;
  window.Bubble = Bubble;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MechanicsAssets, Bubble };
}
