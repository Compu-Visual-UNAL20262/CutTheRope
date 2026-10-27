# Documento de Auditoría y Plan de Acción — Ariadna
**Rol:** Estados del Juego, Interfaz (UI/HUD), Audio Ambiental y Partículas  
**Fecha:** 27 de Octubre, 2026  
**Documento base:** `ComputacionVisual.md`  
**Estado:** Documento temporal de revisión interna (no versionar en README).

---

## 1. Estructura de Archivos bajo tu Responsabilidad

Como responsable de la experiencia de usuario, interfaz visual y audio del juego, eres dueña exclusiva de los siguientes archivos:

```text
CutTheRope/
├── style.css               # Estilos globales, centrado de canvas y carga de fuentes tipográficas
├── src/ui/
│   ├── GameState.js        # Máquina de estados (LOADING, MENU, PLAYING, LEVEL_WON, LEVEL_LOST)
│   ├── UIManager.js        # Menú principal, HUD superior, fondos de nivel y overlays modales
│   ├── ParticleSystem.js   # Sistema ligero de partículas (chispas de estrella, corte y confeti)
│   ├── AudioManager.js     # Gestor central de audio: música de fondo, volumen y estado de muteo
│   ├── CustomCursor.js     # Cursor interactivo de Cut the Rope con estela de partículas
│   └── UIAssetData.js      # Datos de respaldo en base64 para compatibilidad offline
└── assets/
    ├── 06.-Menu-Music-Theme.wav # Música de fondo del menú (Mover a assets/ui/)
    ├── fonts/Fredoka/      # Tipografía Fredoka para títulos y HUD
    └── ui/
        ├── *.png / *.jpg   # Sprites de fondo, botones normal/pressed, Om Nom en reposo, etc.
        ├── btn_click.mp3   # Audio: clic en botones de interfaz (FALTA AGREGAR)
        ├── level_won.mp3   # Audio: fanfarria de nivel ganado (FALTA AGREGAR)
        └── level_lost.mp3  # Audio: sonido de nivel perdido (FALTA AGREGAR)
```

### Organización y Arquitectura del Sistema de Sonido Global:
* **`AudioManager.js` es el núcleo central de audio:**
  * Eres la administradora del estado global de sonido del videojuego.
  * Tu clase expone `audioManager.isMuted` y el método `audioManager.toggleMute()`.
  * Todo el equipo (Farid al cortar sogas o reventar burbujas, y Nicolás al comer o agarrar estrellas) consulta tu propiedad `isMuted` antes de reproducir sus efectos.
* **Organización de archivos de sonido bajo tu control (`assets/ui/`):**
  * La música ambiental debe trasladarse desde la raíz de `assets/` a `assets/ui/menu_theme.mp3` (o `.wav`).
  * Efectos de interfaz propios de UI: `assets/ui/btn_click.mp3`, `assets/ui/level_won.mp3` y `assets/ui/level_lost.mp3`.
  * Integrar la reproducción de victoria y derrota en `AudioManager` o `UIManager.drawOverlay()`.

---

## 2. Lo que está Bien Implementado

1. **`UIManager.js` (Nivel de detalle visual sobresaliente):**
   * Menú principal auténtico: letrero de madera colgado por sogas, Om Nom respirando con escala elástica, péndulo decorativo de caramelo y botón START interactivo con estados hover y click.
   * Pantalla de carga (`LOADING`) animada con barra de progreso, spinner rotatorio y porcentaje.
   * Helper defensivo `drawSafe()` que sortea restricciones de CORS y dibuja imágenes de forma nativa en el contexto 2D.
2. **`AudioManager.js` (Diseño técnico muy profesional):**
   * Manejo de políticas de autoplay de navegadores modernos mediante escuchadores globales (`pointerdown`, `keydown`, `touchstart`).
   * Atenuación suave de volumen (`fadeOutMenuMusic`) al pasar del Menú al Juego.
   * Pausa automática si la pestaña del navegador pasa a segundo plano (`visibilitychange`).
3. **`CustomCursor.js`:**
   * Cursor temático blanco con animación de estela de doble pasada y chispas al presionar.
4. **`GameState.js`:**
   * Máquina de estados desacoplada con patrón de escuchadores (`listeners`).
5. **`style.css`:**
   * Centrado visual impecable mediante Flexbox, canvas con ajuste dinámico (`max-height: 94vh`) y ocultación del puntero estándar del sistema operativo.

---

## 3. Lo que está Mal Implementado (Bugs Críticos y Faltantes)

1. 🔴 **FALTA CRÍTICA — `src/ui/ParticleSystem.js` ESTÁ COMPLETAMENTE VACÍO (0 bytes):**
   * El archivo fue creado pero no tiene una sola línea de código.
   * **Consecuencia:** Cuando Farid corta una cuerda y llama a `particleSystem.emitRopeCut(x, y)`, o cuando Nicolás recolecta una estrella y llama a `particleSystem.emitStarBurst(x, y)`, las partículas no se generan porque la clase no existe. Tampoco existe el confeti de victoria (`emitConfetti()`).
2. 🔴 **Falta el botón de Reiniciar Nivel (Restart) en el HUD:**
   * La especificación exigía que durante la partida (`PLAYING`) el HUD tuviera un botón de reinicio rápido. Actualmente solo tienes el botón de mute de audio y el contador de estrellas.
3. 🔴 **Lógica de navegación de niveles rota en `UIManager.handleClick` (L684-692):**
   ```javascript
   } else if (currentState === 'LEVEL_WON' || currentState === 'LEVEL_LOST') {
     if (this.levelManager && typeof this.levelManager.loadLevel === 'function') {
       this.levelManager.loadLevel(1); // <-- SIEMPRE REINICIA EL NIVEL 1
     }
     this.gameState.changeState('PLAYING');
     return true;
   }
   ```
   * Al ganar el Nivel 1 y hacer clic para continuar, **vuelve a cargar el Nivel 1** en lugar de avanzar al siguiente nivel (`levelManager.currentLevel + 1`).
4. 🟡 **Inconsistencia de ruta tipográfica en `style.css` (L43):**
   * `@font-face { src: url("../assets/fonts/Fredoka/..."); }` asume que `style.css` está en una subcarpeta. Dado que está en la raíz, la ruta debe ser `./assets/fonts/...`.

---

## 4. Lo que debe ser Eliminado en Producción, pero que en Desarrollo Funciona

1. **Overlay genérico de texto en `UIManager.drawOverlay()` (L628-650):**
   * Actualmente muestra un texto básico: `"Click anywhere to try again"`.
   * En producción debe sustituirse por los dos modales que pide el documento:
     * **Modal de Victoria:** Muestra las 3 estrellas iluminadas según las recolectadas y botón `"SIGUIENTE NIVEL"`.
     * **Modal de Derrota:** Muestra Om Nom triste y botón `"REINTENTAR"`.

---

## 5. Lo que No Fue Considerado Inicialmente, pero Debe ser Agregado Sí o Sí

1. 🔴 **Programar `src/ui/ParticleSystem.js`:**
   * El sistema debe correr en p5.js puro (sin Matter.js) con arreglos de partículas livianas que se actualicen y dibujen en cada frame.
2. 🔴 **Progresión de Niveles:**
   * En `handleClick()`, si el estado es `LEVEL_WON`, avanzar `levelManager.loadLevel(levelManager.currentLevel + 1)`.
3. 🔴 **Botón de Reinicio en el HUD superior:**
   * Dibujar el ícono de reinicio (flecha circular) junto al botón de audio para que el usuario pueda reiniciar si el caramelo queda atascado.

---

## 6. Lo que Puede Quedar como Deuda Técnica (No Afecta al Usuario Directamente)

1. **Archivo WAV pesado (`06.-Menu-Music-Theme.wav`):**
   * El archivo pesa varios megabytes. En desarrollo local funciona al instante, pero para entrega final web convendría comprimirlo a `.mp3`.
2. **`UIAssetData.js` con cadenas Base64:**
   * El archivo pesa más de 1 MB debido a imágenes en base64. Fue una gran decisión para compatibilidad local con `file://`, y puede quedarse como fallback permanente.

---

## 7. Instrucciones Paso a Paso para Ariadna

### Paso 1: Implementar `src/ui/ParticleSystem.js`
Copia e implementa la clase completa en `src/ui/ParticleSystem.js`:

```javascript
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Chispas doradas al recolectar estrella
  emitStarBurst(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 2.0 + Math.random() * 4.0;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        color: [255, 215 + Math.random() * 40, 50],
        alpha: 255,
        decay: 6 + Math.random() * 4,
        shape: 'star'
      });
    }
  }

  // Fibras marrones al cortar cuerda
  emitRopeCut(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.0;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        size: 3 + Math.random() * 3,
        color: [180, 130, 75],
        alpha: 255,
        decay: 8 + Math.random() * 4,
        shape: 'fiber'
      });
    }
  }

  // Confeti festivo en victoria
  emitConfetti() {
    const colors = [
      [255, 90, 95], [90, 220, 255], [255, 225, 75], [120, 230, 90], [210, 110, 255]
    ];
    for (let i = 0; i < 45; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -10 - Math.random() * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: 2.5 + Math.random() * 3.5,
        size: 6 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 255,
        decay: 2.5,
        shape: 'confetti',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.shape === 'confetti') {
        p.rotation += p.vRot;
      } else {
        p.vy += 0.15; // Gravedad suave
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    if (this.particles.length === 0) return;
    push();
    noStroke();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      fill(p.color[0], p.color[1], p.color[2], p.alpha);

      if (p.shape === 'confetti') {
        push();
        translate(p.x, p.y);
        rotate(p.rotation);
        rectMode(CENTER);
        rect(0, 0, p.size, p.size * 0.6);
        pop();
      } else {
        circle(p.x, p.y, p.size);
      }
    }
    pop();
  }
}

if (typeof window !== 'undefined') {
  window.ParticleSystem = ParticleSystem;
}
```

### Paso 2: Agregar botón de Restart en el HUD (`src/ui/UIManager.js`)
Agrega en el constructor de `UIManager`:
```javascript
this.restartButton = { x: 0, y: 0, size: 38 };
```
En `drawHUD()`:
```javascript
drawRestartButton() {
  const btn = this.restartButton;
  btn.x = width - 75 - btn.size / 2;
  btn.y = 28 + btn.size / 2;

  push();
  stroke(121, 85, 63);
  strokeWeight(2);
  fill(227, 206, 190);
  circle(btn.x, btn.y, btn.size);

  noStroke();
  fill(75, 45, 25);
  textAlign(CENTER, CENTER);
  textSize(20);
  text("↺", btn.x, btn.y - 1);
  pop();
}
```
Y en `handleClick()`:
```javascript
const rBtn = this.restartButton;
if (Math.hypot(x - rBtn.x, y - rBtn.y) <= rBtn.size / 2) {
  if (this.levelManager) this.levelManager.loadLevel(this.levelManager.currentLevel);
  return true;
}
```

### Paso 3: Corregir el avance de nivel tras la victoria
En `UIManager.handleClick()`:
```javascript
} else if (currentState === 'LEVEL_WON') {
  const nextLevel = (this.levelManager?.currentLevel || 1) + 1;
  if (this.levelManager) {
    this.levelManager.loadLevel(nextLevel);
  }
  this.gameState.changeState('PLAYING');
  return true;
} else if (currentState === 'LEVEL_LOST') {
  if (this.levelManager) {
    this.levelManager.loadLevel(this.levelManager.currentLevel);
  }
  this.gameState.changeState('PLAYING');
  return true;
}
```

### Paso 4: Corregir `@font-face` en `style.css` (L43)
Cambia:
```css
src: url("../assets/fonts/Fredoka/static/Fredoka_Condensed-Bold.ttf") format("truetype");
```
por:
```css
src: url("./assets/fonts/Fredoka/static/Fredoka_Condensed-Bold.ttf") format("truetype");
```
