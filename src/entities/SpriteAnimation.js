
class SpriteAnimation {
  constructor(frames, frameRate = 10, loop = true) {
    this.frames = frames;
    this.frameRate = frameRate;
    this.loop = loop;

    this.currentFrame = 0;
    this.elapsed = 0;
    this.finished = false;
  }

  reset() {
    this.currentFrame = 0;
    this.elapsed = 0;
    this.finished = false;
  }

  update(deltaTime=ANIMATION_TIME) {
    if (this.finished || this.frames.length <= 1) return;

    this.elapsed += deltaTime;

    const frameDuration = 1000 / this.frameRate;

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.currentFrame++;

      if (this.currentFrame >= this.frames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frames.length - 1;
          this.finished = true;
          break;
        }
      }
    }
  }

  draw(x, y, w, h) {
    const frame = this.frames[this.currentFrame];

    if (!frame) return;

    imageMode(CENTER);
    image(frame, x, y, w, h);
  }

  get isFinished() {
    return this.finished;
  }
}
