
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
    this.candy = null;
    this.target = null;
    this.stars = [];
    this.ropes = [];
  }

  loadLevel(index = 1) {
    this.clearCurrentLevel();
    this.currentLevel = index;
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
      // Nivel 2: Dos cuerdas en tensión
      this.candy = new Candy(this.physicsWorld, centerX, 180, candySprites);
      this.target = new Target(this.physicsWorld, centerX, h - 100);
      this.stars = [
        new Star(this.physicsWorld, centerX, 280, 13, () => this.collectedStars++),
        new Star(this.physicsWorld, centerX - 80, 360, 13, () => this.collectedStars++),
        new Star(this.physicsWorld, centerX + 80, 360, 13, () => this.collectedStars++)
      ];
      this.ropes.push(new Rope(centerX - 100, 80, 7, this.candy.body));
      this.ropes.push(new Rope(centerX + 100, 80, 7, this.candy.body));
    } else if (index === 3) {
      // Nivel 3: Cuerda y Burbuja antigravedad
      this.candy = new Candy(this.physicsWorld, centerX, 130, candySprites);
      this.target = new Target(this.physicsWorld, centerX, 90); // Om Nom arriba
      this.stars = [
        new Star(this.physicsWorld, centerX, 240, 13, () => this.collectedStars++),
        new Star(this.physicsWorld, centerX, 340, 13, () => this.collectedStars++),
        new Star(this.physicsWorld, centerX, 440, 13, () => this.collectedStars++)
      ];
      this.ropes.push(new Rope(centerX, 55, 6, this.candy.body));
      new Bubble(this.physicsWorld, centerX, 320, 34); // Burbuja que atrapa el dulce al caer
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

    if (this.candy) this.candy.render();

    if (this.target && this.target.reached && !this.winNotified) {
      this.winNotified = true;
      if (this.candy) this.candy.delete();

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
