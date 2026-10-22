class EntitiesAssets {
    constructor(){
        this.CandyImg = null;
    }

    async preload(){
        this.CandyImg = await loadImage('assets/entities/candy_sprite.png');
        candySprites = CANDY_SPRITES.map(({ x, y, w, h }) => this.CandyImg.get(x, y, w, h));
    }
}