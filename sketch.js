/**
 * sketch.js
 * Main p5.js lifecycle and orchestration for physics engine, entities, and UI.
 * Responsibility: Ángel [BASE]
 */

// Global system instances
let physicsWorld;
let gameState;
let uiManager;
let audioManager;
let particleSystem;
let levelManager;
let cutter;
let customCursor;
let entitiesAssets;

let candySprites;
let supportSprite;
let starBgSprite;

let idleAnimation;
let openMouthAnimation;
let eatingAnimation;
let sadAnimation;
let starAnimation;

let starSounds;
let omNomSounds;

/**
 * 1. PRELOAD: Decentralized asset loading per team member
 */
async function preload() {
  if (typeof CustomCursor !== 'undefined' && typeof CustomCursor.preload === 'function') {
    CustomCursor.preload();
  }
  if (typeof MechanicsAssets !== 'undefined' && typeof MechanicsAssets.preload === 'function') {
    MechanicsAssets.preload();
  }

  entitiesAssets = new EntitiesAssets();

  if (typeof EntitiesAssets !== 'undefined' && typeof entitiesAssets.preload === 'function') {
    await entitiesAssets.preload();
  }
  if (typeof UIAssets !== 'undefined' && typeof UIAssets.preload === 'function') {
    UIAssets.preload();
  }
}

/**
 * 2. SETUP: Canvas, physics engine, and coordinator initialization
 */
async function setup() {
  await preload();
  const w = CONFIG.CANVAS_WIDTH;
  const h = CONFIG.CANVAS_HEIGHT;

  const canvas = createCanvas(w, h);
  const container = document.getElementById('game-container');
  if (container) {
    canvas.parent(container);
  }

  // 1. Initialize physics engine
  physicsWorld = new PhysicsWorld();

  // 2. Initialize particle system (Ariadna)
  if (typeof ParticleSystem !== 'undefined') {
    particleSystem = new ParticleSystem();
  }

  // 3. Initialize game state machine (Ariadna)
  if (typeof GameState !== 'undefined') {
    gameState = new GameState();
  }

  // 4. Initialize audio manager (Ariadna)
  if (typeof AudioManager !== 'undefined') {
    audioManager = new AudioManager(gameState);
  }

  // 5. Initialize rope cutter / slice mechanic (Farid)
  if (typeof Cutter !== 'undefined') {
    cutter = new Cutter();
  }

  // 6. Initialize level manager (Nicolás)
  if (typeof LevelManager !== 'undefined') {
    levelManager = new LevelManager(physicsWorld);
    if (typeof levelManager.loadLevel === 'function') {
      levelManager.loadLevel(1);
    }
  }

  // 7. Initialize UI manager (Ariadna)
  if (typeof UIManager !== 'undefined') {
    uiManager = new UIManager(gameState, levelManager, audioManager);
  }

  // 8. Initialize custom cursor & slice trail
  if (typeof CustomCursor !== 'undefined') {
    customCursor = new CustomCursor();
  }

}

/**
 * 3. DRAW: Main game loop at 60 FPS
 */
function draw() {
  // Current game state
  const currentState = (gameState && gameState.currentState)
    ? gameState.currentState
    : 'PLAYING';

  switch (currentState) {
    case 'LOADING':
      if (uiManager && typeof uiManager.drawLoading === 'function') {
        uiManager.drawLoading();
      } else {
        drawFallbackScreen('Loading...', 'Please wait');
      }
      break;

    case 'MENU':
      if (uiManager && typeof uiManager.drawMenu === 'function') {
        uiManager.drawMenu();
      } else {
        drawFallbackScreen('Cut the Rope', 'Click to play');
      }
      break;

    case 'PLAYING':
      // 1. Background
      if (uiManager && typeof uiManager.drawBackground === 'function') {
        uiManager.drawBackground();
      } else {
        background(35);
      }

      // 2. Step physics simulation
      if (physicsWorld) {
        physicsWorld.update();
      }

      // 3. Render entities and level elements (Nicolás)
      if (levelManager && typeof levelManager.render === 'function') {
        levelManager.render();
      }

      // 4. Cutting mechanic (Farid)
      if (cutter) {
        if (typeof cutter.update === 'function') {
          cutter.update();
        }
        if (typeof cutter.render === 'function') {
          cutter.render();
        }
      }

      // 5. Particles (Ariadna)
      if (particleSystem) {
        if (typeof particleSystem.update === 'function') {
          particleSystem.update();
        }
        if (typeof particleSystem.render === 'function') {
          particleSystem.render();
        }
      }

      // 6. Top HUD (Ariadna)
      if (uiManager && typeof uiManager.drawHUD === 'function') {
        uiManager.drawHUD();
      }

      // 7. Out-of-bounds check (Ángel's logic)
      checkOutOfBounds();
      break;

    case 'LEVEL_WON':
      uiManager.drawSuccessScreen();
      break;
    case 'LEVEL_LOST':
      uiManager.drawFailScreen();
      break;
    case 'GAME_COMPLETED':
      // Render overlay for completion/failure states
      if (uiManager && typeof uiManager.drawOverlay === 'function') {
        uiManager.drawOverlay(currentState);
      } else {
        drawFallbackScreen(currentState, 'Click to continue');
      }
      break;

    default:
      background(30);
      break;
  }

  // Phase 1 visual indicator when team components are not yet initialized
  if (!levelManager && !uiManager) {
    drawEngineStatus();
  }

  // Always update and render custom cursor on top of all visual elements
  if (customCursor) {
    customCursor.update();
    customCursor.render();
  }
}

/**
 * Out-of-bounds check:
 * Verifies if the candy fell below the canvas viewport to trigger defeat.
 */
function checkOutOfBounds() {
  let candyPos = null;

  // Retrieve candy position from LevelManager or global reference
  if (levelManager && levelManager.candy) {
    if (levelManager.candy.body && levelManager.candy.body.position) {
      candyPos = levelManager.candy.body.position;
    } else if (typeof levelManager.candy.x === 'number' && typeof levelManager.candy.y === 'number') {
      candyPos = { x: levelManager.candy.x, y: levelManager.candy.y };
    }
  }

  if (!candyPos) return;

  const limitW = (typeof CONFIG !== 'undefined' && CONFIG.CANVAS_WIDTH) ? CONFIG.CANVAS_WIDTH : 480;
  const limitH = (typeof CONFIG !== 'undefined' && CONFIG.CANVAS_HEIGHT) ? CONFIG.CANVAS_HEIGHT : 720;
  const margin = 50;

  const outY = candyPos.y > limitH + margin || candyPos.y <= -10;
  const outX = candyPos.x < -margin || candyPos.x > limitW + margin;

  if (outY || outX) {
    if (levelManager && typeof levelManager.startLossAnimation === 'function') {
      levelManager.startLossAnimation();
      levelManager.candy.delete();
    } else if (gameState && typeof gameState.setLost === 'function') {
      gameState.setLost();
    } else if (gameState && typeof gameState.changeState === 'function') {
      gameState.changeState('LEVEL_LOST');
    }
  }
}

/**
 * Visual indicator for Phase 1 (Base & Graybox)
 */
function drawEngineStatus() {
  push();
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(22);
  text('Cut the Rope — Core & Physics Engine (Ángel)', width / 2, height / 2 - 40);
  textSize(14);
  fill(180);
  text('PhysicsWorld and Matter.js active at 60 FPS', width / 2, height / 2);
  text('Waiting for entities, mechanics, and UI implementations...', width / 2, height / 2 + 25);
  pop();
}

/**
 * Fallback overlay screen if UIManager is not yet available
 */
function drawFallbackScreen(title, subtitle) {
  background(20, 20, 25, 200);
  push();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);
  text(title, width / 2, height / 2 - 20);
  textSize(16);
  fill(200);
  text(subtitle, width / 2, height / 2 + 20);
  pop();
}

/**
 * 4. INPUT EVENTS (Mouse & Touch)
 */
function mousePressed() {
  if (customCursor) {
    customCursor.onPress(mouseX, mouseY);
  }

  // UI clicks (buttons / HUD)
  if (uiManager && typeof uiManager.handleClick === 'function') {
    if (uiManager.handleClick(mouseX, mouseY)) {
      return;
    }
  }

  // Interaction with gimmicks (bubbles, air cushions)
  if (levelManager && typeof levelManager.handleClick === 'function') {
    if (levelManager.handleClick(mouseX, mouseY)) {
      return;
    }
  }

  // Start cutter swipe path
  if (cutter && typeof cutter.onPress === 'function') {
    cutter.onPress(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (customCursor) {
    customCursor.onDrag(mouseX, mouseY);
  }

  if (cutter && typeof cutter.onDrag === 'function') {
    cutter.onDrag(mouseX, mouseY);
  }
}

function mouseReleased() {
  if (customCursor) {
    customCursor.onRelease();
  }

  if (cutter && typeof cutter.onRelease === 'function') {
    cutter.onRelease();
  }
}

function keyPressed() {
  // Production mode: disabled to prevent accidental restarts or unhandled exceptions.
  // Uncomment only for local testing:
  // if (levelManager && typeof levelManager.click === 'function') levelManager.click();
}
