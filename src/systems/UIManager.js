export default class UIManager {
    constructor(scene, globalState) {
        this.scene = scene;
        this.globalState = globalState;

        this.coinContainer = null;
        this.coinIcon = null;
        this.coinText = null;
    }

    init() {

        this.coinContainer = this.scene.add.container(0, 0);
        this.coinContainer.addProperties(['pos', 'scale']);
        this.coinContainer.setCustomPosition(-50, 40).setAlign('Top Rigth');
        this.coinContainer.setDepth(1000);

        this.coinContainer.px = -52;
        this.coinContainer.py = 40;
        this.coinContainer.lx = -52;
        this.coinContainer.ly = 40;
        this.coinContainer.pScaleX = 1;
        this.coinContainer.pScaleY = 1;
        this.coinContainer.lScaleX = 1;
        this.coinContainer.lScaleY = 1;






        this.coinIcon = this.scene.add.image(-26, 3, 'gold_1').setDisplaySize(30, 30);

        this.coinText = this.scene.add.text(0, -12, '0', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.coinContainer.add([this.coinIcon, this.coinText]);
        this.scene.mainContainer.add(this.coinContainer);

        this.baseScales = {
            iconX: this.coinIcon.scaleX,
            iconY: this.coinIcon.scaleY,
            textX: this.coinText.scaleX,
            textY: this.coinText.scaleY
        };
    }

    
    updateCoinDisplay() {
        if (!this.coinText) return;
        this.coinText.setText(String(this.globalState.totalCoins));

        this.scene.tweens.killTweensOf([this.coinIcon, this.coinText]);

        this.coinIcon.setScale(this.baseScales.iconX, this.baseScales.iconY);
        this.coinText.setScale(this.baseScales.textX, this.baseScales.textY);

        this.scene.tweens.add({
            targets: this.coinIcon,
            scaleX: this.baseScales.iconX * 1.25,
            scaleY: this.baseScales.iconY * 1.25,
            duration: 100,
            yoyo: true,
            repeat: 0,
            ease: 'Back.easeOut'
        });
        this.scene.tweens.add({
            targets: this.coinText,
            scaleX: this.baseScales.textX * 1.25,
            scaleY: this.baseScales.textY * 1.25,
            duration: 100,
            yoyo: true,
            repeat: 0,
            ease: 'Back.easeOut'
        });
    }

    
    getCoinTargetPosition() {
        const mat = this.coinContainer.getWorldTransformMatrix();
        return { x: mat.tx, y: mat.ty };
    }
}

