class EntitiesAssets {
    constructor(){
        this.candyImg = null;
        this.supportImg = null;
    }

    async preload(){
        this.candyImg = await loadImage('assets/entities/candy_sprite.png');
        candySprites = CANDY_SPRITES.map(({ x, y, w, h }) => this.candyImg.get(x, y, w, h));

        this.supportImg = await loadImage('assets/entities/support_sprite.png');
        supportSprite = SUPPORT_SPRITE.map(({ x, y, w, h }) => this.supportImg.get(x, y, w, h))
    }
}