class EntitiesAssets {
    constructor(){
        this.candyImg = null;
        this.supportImg = null;
        this.starImg=null;
        this.omNomImg = null;
    }

    async preload(){
        this.candyImg = await loadImage('assets/entities/candy_sprite.png');
        candySprites = CANDY_SPRITES.map(({ x, y, w, h }) => this.candyImg.get(x, y, w, h));

        this.supportImg = await loadImage('assets/entities/support_sprite.png');
        supportSprite = SUPPORT_SPRITE.map(({ x, y, w, h }) => this.supportImg.get(x, y, w, h))[0];

        this.starImg = await loadImage('assets/entities/star_sprite.png');
        starBgSprite = STAR_SPRITES.bg.map(({ x, y, w, h }) => this.starImg.get(x, y, w, h))[0];
        let starAnimSprites = STAR_SPRITES.animation.frames.map(({ x, y, w, h }) => this.starImg.get(x, y, w, h));
        starAnimation = new SpriteAnimation(starAnimSprites, STAR_SPRITES.animation.frameRate, STAR_SPRITES.animation.loop);

        this.omNomImg = await loadImage('assets/entities/sprite.png');
        let idleOnNomSprites = OMNOM_SPRITES.idle.frames.map(({ x, y, w, h }) => this.omNomImg.get(x, y, w, h));
        let openMouthOnNomSprites = OMNOM_SPRITES.openMouth.frames.map(({ x, y, w, h }) => this.omNomImg.get(x, y, w, h));
        let eatingOnNomSprites = OMNOM_SPRITES.eating.frames.map(({ x, y, w, h }) => this.omNomImg.get(x, y, w, h));
        let sadOnNomSprites = OMNOM_SPRITES.sad.frames.map(({ x, y, w, h }) => this.omNomImg.get(x, y, w, h));
        idleAnimation = new SpriteAnimation(idleOnNomSprites, OMNOM_SPRITES.idle.frameRate, OMNOM_SPRITES.idle.loop);
        openMouthAnimation = new SpriteAnimation(openMouthOnNomSprites, OMNOM_SPRITES.openMouth.frameRate, OMNOM_SPRITES.openMouth.loop);
        eatingAnimation = new SpriteAnimation(eatingOnNomSprites, OMNOM_SPRITES.eating.frameRate, OMNOM_SPRITES.eating.loop);
        sadAnimation = new SpriteAnimation(sadOnNomSprites, OMNOM_SPRITES.sad.frameRate, OMNOM_SPRITES.sad.loop);
    }
}