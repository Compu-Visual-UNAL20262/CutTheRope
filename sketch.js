/**
 * sketch.js
 * Ciclo de vida principal de p5.js y orquestación del motor, entidades y UI.
 * Responsabilidad: Ángel [BASE]
 */

// Instancias globales del sistema
let physicsWorld;
let gameState;
let uiManager;
let particleSystem;
let levelManager;
let cutter;

/**
 * 1. PRELOAD: Carga descentralizada de assets por cada integrante
 */
function preload() {
  if (typeof MechanicsAssets !== 'undefined' && typeof MechanicsAssets.preload === 'function') {
    MechanicsAssets.preload();
  }
  if (typeof EntitiesAssets !== 'undefined' && typeof EntitiesAssets.preload === 'function') {
    EntitiesAssets.preload();
  }
  if (typeof UIAssets !== 'undefined' && typeof UIAssets.preload === 'function') {
    UIAssets.preload();
  }
}

/**
 * 2. SETUP: Inicialización del lienzo, motor físico y coordinadores
 */
function setup() {
  const w = (typeof CONFIG !== 'undefined' && CONFIG.CANVAS_WIDTH) ? CONFIG.CANVAS_WIDTH : 800;
  const h = (typeof CONFIG !== 'undefined' && CONFIG.CANVAS_HEIGHT) ? CONFIG.CANVAS_HEIGHT : 600;

  const canvas = createCanvas(w, h);
  const container = document.getElementById('game-container');
  if (container) {
    canvas.parent(container);
  }

  // 1. Iniciar motor físico
  physicsWorld = new PhysicsWorld();

  // 2. Iniciar sistema de partículas (Ariadna)
  if (typeof ParticleSystem !== 'undefined') {
    particleSystem = new ParticleSystem();
  }

  // 3. Iniciar máquina de estados (Ariadna)
  if (typeof GameState !== 'undefined') {
    gameState = new GameState();
  }

  // 4. Iniciar cortador / slice (Farid)
  if (typeof Cutter !== 'undefined') {
    cutter = new Cutter();
  }

  // 5. Iniciar gestor de niveles (Nicolás)
  if (typeof LevelManager !== 'undefined') {
    levelManager = new LevelManager(physicsWorld);
    if (typeof levelManager.loadLevel === 'function') {
      levelManager.loadLevel(1);
    }
  }

  // 6. Iniciar gestor de UI (Ariadna)
  if (typeof UIManager !== 'undefined') {
    uiManager = new UIManager(gameState, levelManager);
  }
}

/**
 * 3. DRAW: Bucle principal a 60 FPS
 */
function draw() {
  // Estado actual del juego
  const currentState = (gameState && gameState.currentState)
    ? gameState.currentState
    : 'PLAYING';

  switch (currentState) {
    case 'MENU':
      if (uiManager && typeof uiManager.drawMenu === 'function') {
        uiManager.drawMenu();
      } else {
        drawFallbackScreen('Cut the Rope', 'Presiona para jugar');
      }
      break;

    case 'PLAYING':
      // 1. Fondo
      if (uiManager && typeof uiManager.drawBackground === 'function') {
        uiManager.drawBackground();
      } else {
        background(35);
      }

      // 2. Actualizar física
      if (physicsWorld) {
        physicsWorld.update();
      }

      // 3. Renderizar entidades y niveles (Nicolás)
      if (levelManager && typeof levelManager.render === 'function') {
        levelManager.render();
      }

      // 4. Mecánica de corte (Farid)
      if (cutter) {
        if (typeof cutter.update === 'function') {
          cutter.update();
        }
        if (typeof cutter.render === 'function') {
          cutter.render();
        }
      }

      // 5. Partículas (Ariadna)
      if (particleSystem) {
        if (typeof particleSystem.update === 'function') {
          particleSystem.update();
        }
        if (typeof particleSystem.render === 'function') {
          particleSystem.render();
        }
      }

      // 6. HUD superior (Ariadna)
      if (uiManager && typeof uiManager.drawHUD === 'function') {
        uiManager.drawHUD();
      }

      // 7. Verificación de límites (Lógica de Ángel)
      checkOutOfBounds();
      break;

    case 'LEVEL_WON':
    case 'LEVEL_LOST':
    case 'GAME_COMPLETED':
      // Mantener último frame visible o dibujar overlay
      if (uiManager && typeof uiManager.drawOverlay === 'function') {
        uiManager.drawOverlay(currentState);
      } else {
        drawFallbackScreen(currentState, 'Click para continuar');
      }
      break;

    default:
      background(30);
      break;
  }

  // Pantalla informativa de Fase 1 si los módulos del equipo aún no están instanciados
  if (!levelManager && !uiManager) {
    drawEngineStatus();
  }
}

/**
 * Control de Fuera de Límites:
 * Verifica si el dulce salió del lienzo por la parte inferior para disparar derrota.
 */
function checkOutOfBounds() {
  let candyY = null;

  // Buscar posición del dulce a través del LevelManager o variable global
  if (levelManager && levelManager.candy) {
    if (levelManager.candy.body && levelManager.candy.body.position) {
      candyY = levelManager.candy.body.position.y;
    } else if (typeof levelManager.candy.y === 'number') {
      candyY = levelManager.candy.y;
    }
  }

  const limitY = ((typeof CONFIG !== 'undefined' && CONFIG.CANVAS_HEIGHT) ? CONFIG.CANVAS_HEIGHT : 600) + 50;

  if (candyY !== null && candyY > limitY) {
    if (gameState && typeof gameState.setLost === 'function') {
      gameState.setLost();
    } else if (gameState && typeof gameState.changeState === 'function') {
      gameState.changeState('LEVEL_LOST');
    }
  }
}

/**
 * Indicador visual para Fase 1 (Base y Cajas Grises)
 */
function drawEngineStatus() {
  push();
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(22);
  text('Cut the Rope — Core & Motor Físico (Ángel)', width / 2, height / 2 - 40);
  textSize(14);
  fill(180);
  text('PhysicsWorld y Matter.js activos a 60 FPS', width / 2, height / 2);
  text('Esperando implementación de entidades, mecánicas y UI...', width / 2, height / 2 + 25);
  pop();
}

/**
 * Pantalla de reserva para estados si UIManager aún no está listo
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
 * 4. EVENTOS DE ENTRADA (Mouse & Touch)
 */
function mousePressed() {
  // Clics en interfaz (botones / HUD)
  if (uiManager && typeof uiManager.handleClick === 'function') {
    if (uiManager.handleClick(mouseX, mouseY)) {
      return;
    }
  }

  // Interacción con gimmicks (burbujas, cojines)
  if (levelManager && typeof levelManager.handleClick === 'function') {
    if (levelManager.handleClick(mouseX, mouseY)) {
      return;
    }
  }

  // Inicio de trazo del cortador
  if (cutter && typeof cutter.onPress === 'function') {
    cutter.onPress(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (cutter && typeof cutter.onDrag === 'function') {
    cutter.onDrag(mouseX, mouseY);
  }
}

function mouseReleased() {
  if (cutter && typeof cutter.onRelease === 'function') {
    cutter.onRelease();
  }
}
