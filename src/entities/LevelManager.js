/**
 * src/entities/LevelManager.js
 * Builds each level.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class LevelManager {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;

    this.candy = null;
    this.target = null;
    this.bubble = null;
    this.stars = [];
    this.ropes = [];

    this.currentLevel = 1;
    this.collectedStars = 0;
    this.winNotified = false;
    this.lossStarted = false;
    this.lossNotified = false;
    this.candy_sprites = candySprites;
  }

  clearCurrentLevel(){
    if (typeof Bubble !== 'undefined' && typeof Bubble.clearAll === 'function') {
      Bubble.clearAll();
    }
    if (typeof AirCushion !== 'undefined' && typeof AirCushion.clearAll === 'function') {
      AirCushion.clearAll();
    }
    this.physicsWorld.resetForNewLevel();

    this.candy = null;
    this.target = null;
    this.bubble = null;
    this.stars = [];
    this.ropes = [];
  }

  loadLevel(index) {
    this.clearCurrentLevel();
    this.currentLevel = index;
    console.log(`Nivel actual: ${this.currentLevel}`);
    this.collectedStars = 0;
    this.winNotified = false;
    this.lossStarted = false;
    this.lossNotified = false;

    const centerX = CONFIG.CANVAS_WIDTH / 2;
    const h = CONFIG.CANVAS_HEIGHT;

    if (index === 1) {
      // Nivel 1: Péndulo simple
      this.candy = new Candy(this.physicsWorld, centerX - 60, 190, candySprites);
      this.target = new Target(this.physicsWorld, centerX, h - 100);
      this.stars = [
        new Star(this.physicsWorld, centerX - 85, 270, () => this.collectedStars++),
        new Star(this.physicsWorld, centerX, 340, () => this.collectedStars++),
        new Star(this.physicsWorld, centerX + 85, 270, () => this.collectedStars++)
      ];
      this.ropes.push(new Rope(centerX, 170, 4, this.candy.body));
    } else if (index === 2) {
      // Nivel 2: Tres cuerdas en tensión
      this.candy = new Candy(this.physicsWorld, centerX-170, 270, candySprites);
      this.target = new Target(this.physicsWorld, centerX+130, h - 100);
      this.stars = [
        new Star(this.physicsWorld, centerX-170, 520, () => this.collectedStars++, 13),
        new Star(this.physicsWorld, centerX - 170, 350, () => this.collectedStars++, 13),
        new Star(this.physicsWorld, centerX + 170, 350, () => this.collectedStars++, 13)
      ];
      this.ropes.push(new Rope(centerX - 170, 100, 1, this.candy.body));
      this.ropes.push(new Rope(centerX + 170, 100,55, this.candy.body));
      this.ropes.push(new Rope(centerX , 100, 30, this.candy.body));
    } else if (index === 3) {
      // Nivel 3: Cuerda y Burbuja antigravedad
      this.candy = new Candy(this.physicsWorld, centerX, 170, candySprites);
      this.target = new Target(this.physicsWorld, centerX, h-100); // Om Nom arriba
      this.stars = [
        new Star(this.physicsWorld, centerX, 120, () => this.collectedStars++, 13),
        new Star(this.physicsWorld, centerX, 370, () => this.collectedStars++, 13),
        new Star(this.physicsWorld, centerX, 470, () => this.collectedStars++, 13)
      ];
      this.ropes.push(new Rope(centerX, 170, 3, this.candy.body));
      this.bubble = new Bubble(this.physicsWorld, centerX, 370);
    }
  }


  async render() {
    // Dibujar primero las cuerdas.
    for (const rope of this.ropes) rope?.render();

    if (this.target) {
      this.target.update(this.candy);
      this.target.render();
    }

    for (const star of this.stars) {
      star.update();
      star.render();
    }

    if (this.bubble) this.bubble.render();

    if (this.candy) this.candy.render();

    if (this.target && this.target.reached && !this.winNotified) {
      this.winNotified = true;
      if (this.candy) this.candy.delete();
      for (let r=0; r<this.ropes.length; r++) {
        this.ropes[r].destroyNodesAndConstraints();
      }

      // Esperar a que termine la animación de masticar y notificar al GameState
      setTimeout(() => {
        if (typeof gameState !== 'undefined' && gameState) {
          if (typeof gameState.setWon === 'function') gameState.setWon();
          else if (typeof gameState.changeState === 'function') gameState.changeState('LEVEL_WON');
        }
      }, 2000);
    }


    if (this.target && this.target.lost && !this.lossNotified && sadAnimation.isFinished) {
      this.lossNotified = true;

      if (typeof gameState !== 'undefined' && gameState) {
        if (typeof gameState.setLost === 'function') {
          gameState.setLost();
        } else if (typeof gameState.changeState === 'function') {
          gameState.changeState('LEVEL_LOST');
        }
      }
    }
  }

  startLossAnimation() {
    if (this.lossStarted || !this.target || this.target.reached) return;

    this.lossStarted = true;
    this.target.onLost();
  }

  click(){
    this.candy.delete();
    this.candy = new Candy(
      this.physicsWorld,
      mouseX,
      mouseY,
      candySprites
    );
    return
  }
}