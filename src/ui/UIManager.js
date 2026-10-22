/**
 * src/ui/UIManager.js
 * Manages game UI: loading screen, main menu, HUD, overlays, and user interactions.
 * Responsibility: UI & Game Effects (Ariadna)
 */

/**
 * Universal safe image loader.
 * Uses base64 data URIs from UIAssetData when available for 100% offline file:/// compatibility,
 * falling back to local file paths via HTMLImageElement.
 */
function loadSafeImage(key, relativePath) {
  const dataUri = (typeof UIAssetData !== 'undefined' && UIAssetData && UIAssetData[key])
    ? UIAssetData[key]
    : null;

  const img = new Image();
  const wrapper = {
    elt: img,
    src: dataUri || relativePath,
    isReady: false,
    get width() { return img.naturalWidth || img.width || 0; },
    get height() { return img.naturalHeight || img.height || 0; },
  };

  img.onload = () => {
    wrapper.isReady = true;
  };
  img.onerror = () => {
    // If relative path failed (e.g. strict CORS), retry with data URI if available
    if (dataUri && img.src !== dataUri) {
      img.src = dataUri;
    }
  };

  // Assign source (data URI or relative)
  img.src = dataUri || relativePath;

  if (img.complete && img.naturalWidth > 0) {
    wrapper.isReady = true;
  }

  return wrapper;
}

/**
 * Universal safe draw helper that draws images onto the HTML5 Canvas context.
 * Bypasses CORS restrictions and automatically respects p5 transformations (translate, rotate, scale).
 */
function drawSafe(imgObj, x, y, w, h, isCenter = false) {
  if (!imgObj) return false;
  const elt = imgObj.elt || (imgObj instanceof HTMLImageElement ? imgObj : null);
  if (!elt) return false;
  if (!elt.complete || (elt.naturalWidth === 0 && imgObj.width === 0)) return false;

  const natW = elt.naturalWidth || imgObj.width;
  const natH = elt.naturalHeight || imgObj.height;
  const targetW = (w !== undefined && w !== null) ? w : natW;
  const targetH = (h !== undefined && h !== null) ? h : natH;
  const targetX = isCenter ? (x - targetW / 2) : x;
  const targetY = isCenter ? (y - targetH / 2) : y;

  try {
    if (typeof drawingContext !== 'undefined' && drawingContext && drawingContext.drawImage) {
      drawingContext.drawImage(elt, targetX, targetY, targetW, targetH);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

const UIAssets = {
  menuBgr: null,
  menuShadow: null,
  btnNormal: null,
  btnPressed: null,
  omnomIdle: null,
  omnomSupport: null,
  candySwirl: null,
  spinner: null,
  loaderbar: null,
  cardboardBg: null,
  apptivityBanner: null,
  apptivityStars: null,
  menuCandySwirl: null,
  loaded: false,

  preload() {
    this.menuBgr = loadSafeImage('menuBgr', 'assets/ui/menu_bgr_opt.jpg');
    this.menuShadow = loadSafeImage('menuShadow', 'assets/ui/menu_shadow.png');
    this.btnNormal = loadSafeImage('btnNormal', 'assets/ui/btn_default_normal.png');
    this.btnPressed = loadSafeImage('btnPressed', 'assets/ui/btn_default_pressed.png');
    this.omnomIdle = loadSafeImage('omnomIdle', 'assets/ui/omnom_idle.png');
    this.omnomSupport = loadSafeImage('omnomSupport', 'assets/ui/omnom_support.png');
    this.candySwirl = loadSafeImage('candySwirl', 'assets/ui/candy_swirl.png');
    this.menuCandySwirl = loadSafeImage('menuCandySwirl', 'assets/ui/menu_candy_swirl.png');
    this.spinner = loadSafeImage('spinner', 'assets/ui/spinner.png');
    this.loaderbar = loadSafeImage('loaderbar', 'assets/ui/loaderbar_full.png');
    this.cardboardBg = loadSafeImage('cardboardBg', 'assets/ui/background_cardboard_clean.jpg');
    this.apptivityBanner = loadSafeImage('apptivityBanner', 'assets/ui/apptivity_banner.png');
    this.apptivityStars = loadSafeImage('apptivityStars', 'assets/ui/apptivity_stars.png');
    this.loaded = true;
  }
};

class UIManager {
  constructor(gameState, levelManager, audioManager = null) {
    this.gameState = gameState;
    this.levelManager = levelManager;
    this.audioManager = audioManager;

    // Loading screen state (calibrated for ~3.3s smooth load time, +1s longer)
    this.loadingProgress = 0;
    this.loadingSpeed = 1;
    this.fadeAlpha = 0;

    // Main Menu Start button bounding box (proportional to 455x102 sprite)
    this.startButton = {
      x: 0,
      y: 0,
      w: 236,
      h: 53,
      isHovered: false,
      isPressed: false
    };

    // Ensure assets are initialized
    if (!UIAssets.loaded) {
      UIAssets.preload();
    }
  }

  /**
   * 1. LOADING SCREEN
   * Animated Apptivity Om Nom banner, candy-striped progress bar, and rotating spinner
   */
  drawLoading() {
    // Advance progress smoothly
    if (this.loadingProgress < 1.0) {
      this.loadingProgress = Math.min(1.0, this.loadingProgress + this.loadingSpeed);
    } else {
      // Completed loading: transition to MENU
      if (this.gameState && typeof this.gameState.changeState === 'function') {
        this.gameState.changeState('MENU');
      }
      if (this.audioManager && typeof this.audioManager.playMenuMusic === 'function') {
        this.audioManager.playMenuMusic();
      }
      return;
    }

    push();
    const progress = this.loadingProgress;

    // Base background color
    background(245, 240, 230);

    // Cardboard background texture
    if (UIAssets.cardboardBg && UIAssets.cardboardBg.isReady) {
      drawingContext.save();
      drawingContext.globalAlpha = 0.35;
      drawSafe(UIAssets.cardboardBg, 0, 0, width, height, false);
      drawingContext.restore();
    }

    // Apptivity Banner: Om Nom looking upwards with open mouth and falling candies
    const breathe = Math.sin(frameCount * 0.06) * 3;
    const bannerY = height * 0.38 + breathe;
    const targetW = Math.min(width * 0.90, 420);
    const targetH = Math.round(targetW * (350 / 600)); // Aspect ratio 600:350

    const pulseX = 1 + Math.sin(frameCount * 0.06) * 0.015;
    const pulseY = 1 - Math.sin(frameCount * 0.06) * 0.015;

    if (!drawSafe(UIAssets.apptivityBanner, width / 2, bannerY, targetW * pulseX, targetH * pulseY, true)) {
      // Fallback character
      drawSafe(UIAssets.omnomSupport, width / 2, bannerY + 50, 160, 68, true);
      drawSafe(UIAssets.omnomIdle, width / 2, bannerY, 130, 135, true);
    }

    // Decorative stars from banner
    if (UIAssets.apptivityStars && UIAssets.apptivityStars.isReady) {
      push();
      translate(width / 2 + 105, height * 0.65 + Math.sin(frameCount * 0.07 + 1) * 2);
      rotate(Math.sin(frameCount * 0.05) * 0.1);
      drawSafe(UIAssets.apptivityStars, 0, 0, 42, 31, true);
      pop();
    }

    // Progress Bar Construction
    const barWidth = 280;
    const barHeight = 22;
    const barX = (width - barWidth) / 2;
    const barY = height * 0.72;

    // Outer bar casing
    stroke(80, 50, 30);
    strokeWeight(3);
    fill(235, 225, 210);
    rect(barX, barY, barWidth, barHeight, 11);

    // Inner progress fill
    const fillW = Math.max(0, (barWidth - 6) * progress);
    if (fillW > 0) {
      if (UIAssets.loaderbar && UIAssets.loaderbar.isReady) {
        drawingContext.save();
        drawingContext.beginPath();
        if (typeof drawingContext.roundRect === 'function') {
          drawingContext.roundRect(barX + 3, barY + 3, fillW, barHeight - 6, 8);
        } else {
          drawingContext.rect(barX + 3, barY + 3, fillW, barHeight - 6);
        }
        drawingContext.clip();
        drawingContext.drawImage(UIAssets.loaderbar.elt, barX + 3, barY + 3, barWidth - 6, barHeight - 6);
        drawingContext.restore();
      } else {
        noStroke();
        fill(100, 205, 50);
        rect(barX + 3, barY + 3, fillW, barHeight - 6, 8);
      }
    }

    // Rotating spinner candy beside loading text
    push();
    translate(width / 2 - 62, barY + barHeight + 35);
    rotate(frameCount * 0.1);
    if (!drawSafe(UIAssets.spinner, 0, 0, 26, 26, true)) {
      fill(120, 80, 40);
      noStroke();
      circle(0, 0, 16);
    }
    pop();

    // Loading Percentage Text
    fill(90, 60, 35);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(16);
    textStyle(BOLD);
    text(`Loading... ${Math.floor(progress * 100)}%`, width / 2 - 38, barY + barHeight + 35);

    pop();
  }

  /**
   * 2. MAIN MENU SCREEN
   * Cardboard backdrop, ambient vignette, title banner, animated Om Nom, and Start button
   */
  drawMenu() {
    push();

    // 1. Background image
    if (!drawSafe(UIAssets.menuBgr, 0, 0, width, height, false)) {
      if (!drawSafe(UIAssets.cardboardBg, 0, 0, width, height, false)) {
        background(215, 160, 95);
      }
    }

    // 2. Ambient drop shadow / vignette overlay
    drawSafe(UIAssets.menuShadow, 0, 0, width, height, false);

    // 3. Hanging decorative rope & candy pendulum on the right
    this.drawMenuHangingCandy();

    // 4. Title Logo Banner (hung from ceiling by ropes)
    const logoYOffset = Math.sin(frameCount * 0.05) * 4;
    const logoX = width / 2;
    const logoY = height * 0.18 + logoYOffset;
    this.drawTitleBanner(logoX, logoY);

    // 5. Center Figure: Om Nom on Pedestal
    const charBreathe = Math.sin(frameCount * 0.07) * 3;
    const charCenterY = height * 0.52 + charBreathe;

    // Support pedestal
    drawSafe(UIAssets.omnomSupport, width / 2, charCenterY + 54, 180, 78, true);

    // Om Nom character (smooth continuous breathing, zero jumps/artifacts)
    const squashX = 1 + Math.sin(frameCount * 0.07) * 0.025;
    const squashY = 1 - Math.sin(frameCount * 0.07) * 0.025;
    drawSafe(UIAssets.omnomIdle, width / 2, charCenterY, 140 * squashX, 146 * squashY, true);

    // 6. Interactive "Start" Button
    this.drawStartButton();

    pop();
  }

  /**
   * Stylized wooden signboard title banner with rope hangers and candy typography
   */
  drawTitleBanner(x, y) {
    push();
    translate(x, y);

    // Hanging ropes connecting wooden sign to ceiling
    stroke(80, 50, 25);
    strokeWeight(3.5);
    line(-80, -y, -80, -32);
    line(80, -y, 80, -32);

    // Rope attachment rivets/pins
    fill(210, 180, 115);
    stroke(60, 35, 15);
    strokeWeight(1.5);
    circle(-80, -32, 8);
    circle(80, -32, 8);

    // Ambient drop shadow under wooden signboard
    noStroke();
    fill(40, 25, 15, 60);
    rectMode(CENTER);
    rect(0, 5, 280, 90, 18);

    // Wooden signboard base plank (width 276, height 86)
    stroke(90, 55, 25);
    strokeWeight(4);
    fill(200, 140, 75);
    rect(0, 0, 276, 86, 16);

    // Inner bevel border
    stroke(225, 175, 110, 180);
    strokeWeight(2);
    noFill();
    rect(0, 0, 264, 74, 12);

    // Corner rivets
    fill(140, 95, 45);
    noStroke();
    circle(-124, -28, 5);
    circle(124, -28, 5);
    circle(-124, 28, 5);
    circle(124, 28, 5);

    // Cut the Rope Typography (perfect vertical centering)
    textAlign(CENTER, CENTER);
    textStyle(BOLD);

    // Line 1: "CUT THE" (centered vertically at -17)
    textSize(18);
    stroke(55, 25, 10);
    strokeWeight(4);
    fill(255, 245, 225);
    text('CUT THE', 0, -17);

    // Line 2: "ROPE" (centered vertically at +12)
    textSize(32);
    noStroke();
    fill(35, 20, 10, 140);
    text('ROPE', 1, 14);

    stroke(30, 70, 15);
    strokeWeight(4.5);
    fill(120, 215, 45);
    text('ROPE', 0, 12);

    // Highlight on ROPE
    noStroke();
    fill(200, 255, 150, 150);
    textSize(32);
    text('ROPE', 0, 11);

    pop();
  }

  /**
   * Hanging candy pendulum decoration in main menu.
   * Features the iconic swirl candy from menu_logo_hd.png attached to the rope cord.
   */
  drawMenuHangingCandy() {
    push();
    const anchorX = width * 0.86;
    const anchorY = 0;
    const ropeLen = 130;
    const swingAngle = Math.sin(frameCount * 0.035) * 0.15;

    const candyX = anchorX + Math.sin(swingAngle) * ropeLen;
    const candyY = anchorY + Math.cos(swingAngle) * ropeLen;

    // Draw rope cord entering the candy top hole
    stroke(75, 45, 20);
    strokeWeight(3.5);
    line(anchorX, anchorY, candyX, candyY - 26);

    // Hanging hook dot at top ceiling
    fill(210, 180, 120);
    stroke(60, 35, 15);
    strokeWeight(1.5);
    circle(anchorX, anchorY + 4, 10);

    // Draw 3D swirl candy from menu_logo_hd.png
    const candyImg = (UIAssets.menuCandySwirl && UIAssets.menuCandySwirl.isReady)
      ? UIAssets.menuCandySwirl
      : UIAssets.candySwirl;

    push();
    translate(candyX, candyY);
    rotate(swingAngle * 1.15 + Math.sin(frameCount * 0.02) * 0.04);
    if (!drawSafe(candyImg, 0, 0, 70, 70, true)) {
      noStroke();
      fill(235, 60, 60);
      circle(0, 0, 48);
      fill(255);
      circle(0, 0, 20);
    }
    pop();

    pop();
  }

  /**
   * Renders the interactive Start button
   */
  drawStartButton() {
    this.startButton.x = width / 2;
    this.startButton.y = height * 0.78;
    this.startButton.w = 236;
    this.startButton.h = 53;

    const btn = this.startButton;
    // Hover check
    btn.isHovered = (
      mouseX >= btn.x - btn.w / 2 &&
      mouseX <= btn.x + btn.w / 2 &&
      mouseY >= btn.y - btn.h / 2 &&
      mouseY <= btn.y + btn.h / 2
    );

    const isPressed = btn.isHovered && mouseIsPressed;
    btn.isPressed = isPressed;

    push();
    translate(btn.x, btn.y);

    // Subtle scale bounce on hover/press
    const hoverScale = btn.isHovered ? (isPressed ? 0.95 : 1.04) : 1.0;
    scale(hoverScale);

    // Select sprite (pressed or normal)
    const btnSprite = (btn.isHovered || isPressed)
      ? UIAssets.btnPressed
      : UIAssets.btnNormal;

    if (!drawSafe(btnSprite, 0, 0, btn.w, btn.h, true)) {
      stroke(40);
      strokeWeight(3);
      fill(isPressed ? color(255, 200, 50) : color(240, 80, 40));
      rectMode(CENTER);
      rect(0, 0, btn.w, btn.h, 28);
    }

    // Button label: "START" - centered vertically inside glossy capsule
    noStroke();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(25);

    // Drop shadow on text
    fill(60, 20, 10, 180);
    text('START', 1, -2);

    // Crisp white foreground text
    fill(255, 255, 255);
    text('START', 0, -3);

    pop();
  }

  /**
   * 3. PLAYING SCREEN BACKGROUND
   */
  drawBackground() {
    push();
    if (!drawSafe(UIAssets.cardboardBg, 0, 0, width, height, false)) {
      if (!drawSafe(UIAssets.menuBgr, 0, 0, width, height, false)) {
        background(215, 160, 95);
      }
    }

    // Subtle top vignette
    if (UIAssets.menuShadow && UIAssets.menuShadow.isReady) {
      drawingContext.save();
      drawingContext.globalAlpha = 0.55;
      drawSafe(UIAssets.menuShadow, 0, 0, width, height, false);
      drawingContext.restore();
    }
    pop();
  }

  /**
   * 4. HUD during gameplay
   */
  drawHUD() {
    push();
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(18);
    textStyle(BOLD);
    text('Level 1', 20, 20);
    pop();
  }

  /**
   * 5. GAME OVER / WIN OVERLAYS
   */
  drawOverlay(state) {
    push();
    fill(20, 20, 25, 210);
    rect(0, 0, width, height);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    textStyle(BOLD);

    if (state === 'LEVEL_WON') {
      fill(255, 215, 0);
      text('LEVEL COMPLETE!', width / 2, height / 2 - 30);
    } else {
      fill(255, 90, 80);
      text('LEVEL FAILED', width / 2, height / 2 - 30);
    }

    textSize(16);
    fill(220);
    text('Click anywhere to try again', width / 2, height / 2 + 25);
    pop();
  }

  /**
   * 6. CLICK / TOUCH INTERACTION HANDLER
   */
  handleClick(x, y) {
    const currentState = this.gameState ? this.gameState.currentState : null;

    if (currentState === 'MENU') {
      const btn = this.startButton;
      const clickedStart = (
        x >= btn.x - btn.w / 2 &&
        x <= btn.x + btn.w / 2 &&
        y >= btn.y - btn.h / 2 &&
        y <= btn.y + btn.h / 2
      );

      if (clickedStart) {
        // Trigger spark effect if cursor is available
        if (typeof customCursor !== 'undefined' && customCursor && typeof customCursor.addSparkle === 'function') {
          for (let i = 0; i < 14; i++) {
            customCursor.addSparkle(x, y, 255, 215, 50);
          }
        }

        // Switch state to PLAYING
        if (this.gameState && typeof this.gameState.changeState === 'function') {
          this.gameState.changeState('PLAYING');
        }
        if (this.audioManager && typeof this.audioManager.fadeOutMenuMusic === 'function') {
          this.audioManager.fadeOutMenuMusic(500);
        }
        return true;
      }
    } else if (currentState === 'LEVEL_WON' || currentState === 'LEVEL_LOST') {
      if (this.levelManager && typeof this.levelManager.loadLevel === 'function') {
        this.levelManager.loadLevel(1);
      }
      if (this.gameState && typeof this.gameState.changeState === 'function') {
        this.gameState.changeState('PLAYING');
      }
      return true;
    }

    return false;
  }
}

// Global scope export
if (typeof window !== 'undefined') {
  window.UIAssets = UIAssets;
  window.UIManager = UIManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIAssets, UIManager };
}
