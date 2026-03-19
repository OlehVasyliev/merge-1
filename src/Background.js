export default class Background extends Phaser.GameObjects.Sprite{
    constructor({scene, pImage, lImage, pScaleX, pScaleY, lScaleX, lScaleY, container}) {
        super(scene, 0, 0, pImage);
        this.init(pImage, lImage, pScaleX, pScaleY, lScaleX, lScaleY)
        container.add(this);
    }

    init(pImage, lImage, pScaleX, pScaleY, lScaleX, lScaleY){
        this.setCustomPosition(0, 0);
        this.addProperties(["image", "scale"]);
        this.pImage = pImage; 
        this.lImage = lImage; 
        this.pScaleX = pScaleX;
        this.pScaleY = pScaleY;
        this.lScaleX = lScaleX;
        this.lScaleY = lScaleY;
    }

    

    changeImage(pImage, lImage){
        this.pImage = pImage; 
        this.lImage = lImage; 
    }
    
}