import { getTextureKey } from '../ecs/Components';
import Config from '../ecs/MergeConfig';

export default class CustomerSystem {
    constructor(scene, container, boardContainer, tableTopY, tableHeight) {
        this.scene = scene;
        this.container = container;
        this.boardContainer = boardContainer;
        this.tableTopY = tableTopY;
        this.tableHeight = tableHeight;

        // CustomerData + OrderRequirement
        this.portraitId   = 0;
        this.targetType   = 0;
        this.targetLevel  = 0;
        this.isSatisfied  = false;

        // Sprites
        this.portraitSprite = null;
        this.cloudSprite   = null;
        this.orderSprite   = null;
        this.giveButton    = null;

        /** @type {function():void|null} */
        this.onOrderFulfilled = null;

        /** @type {function(number, number):void|null} */
        this.onNewCustomer = null;
        /** @type {function(boolean, Object):void|null} */
        this.onOrderStatusChanged = null;
    }

    init() {
        // Start the customer area off-screen to the right so the card can slide in.
        this.container.x = this.scene.game.size.right + 150;

        // Build animation sequences from loaded textures or atlases (customer_1_0.., customer_2_0.., etc.)
        this.createCustomerAnimations();

        // Animated portrait (uses a looping animation for the current customer type)
        const initial = this.getCustomerInitialFrame(1);
        this.portraitSprite = this.scene.add.sprite(-100, 0, initial.textureKey, initial.frame)
            .setScale(1.5)
            .setDepth(5);
        this.container.add(this.portraitSprite);

        // Cloud: placed on the table (not inside the customer container)
        const cloudHeight = 60;
        const cloudY = (this.tableTopY || -200) + (cloudHeight / 2);
        this.cloudSprite = this.scene.add.image(-110, cloudY - cloudHeight * 0.7, 'customer_cloude_of_proucts')
            .setDisplaySize(120, cloudHeight)
            .setDepth(5);
        (this.boardContainer || this.container).add(this.cloudSprite);

        this.orderSprite = this.scene.add.image(this.cloudSprite.x, this.cloudSprite.y, 'product_1_lv_1')
            .setDisplaySize(35, 35)
            .setDepth(6)
            .setAlpha(0);
        (this.boardContainer || this.container).add(this.orderSprite);

        // Button: placed on the table near the cloud (not inside customer container)
        const buttonWidth = 90;
        const buttonHeight = 45;
        const buttonX = this.cloudSprite.x;
        const buttonY = this.cloudSprite.y - (cloudHeight / 2) - (buttonHeight / 2);

        this.giveButton = this.scene.add.image(buttonX+120, buttonY+60, 'btn_give_to_customer')
            .setDisplaySize(buttonWidth, buttonHeight)
            .setDepth(7)
            .setAlpha(0.4);
        this.giveButton.setInteractive();
        this.giveButton.on('pointerdown', this.onGiveClicked, this);
        (this.boardContainer || this.container).add(this.giveButton);

        this.generateNewCustomer();
    }

    getCustomerAtlasKey(type) {
        return `customer_${type}`;
    }

    getCustomerFrameNames(type) {
        const atlasKey = this.getCustomerAtlasKey(type);
        if (this.scene.textures.exists(atlasKey)) {
            const atlas = this.scene.textures.get(atlasKey);
            const frameNames = atlas && typeof atlas.getFrameNames === 'function'
                ? atlas.getFrameNames().filter(name => name.startsWith(`customer_${type}_`))
                : atlas && atlas.frames
                    ? Object.keys(atlas.frames).filter(name => name.startsWith(`customer_${type}_`))
                    : [];

            // Sort by numeric suffix (customer_1_0, customer_1_1, ...)
            return frameNames.sort((a, b) => {
                const aNum = parseInt(a.split('_').pop(), 10);
                const bNum = parseInt(b.split('_').pop(), 10);
                return aNum - bNum;
            });
        }

        // Fallback to individual texture keys.
        return Object.keys(this.scene.textures.list)
            .filter(key => key.startsWith(`customer_${type}_`))
            .sort((a, b) => {
                const aNum = parseInt(a.split('_').pop(), 10);
                const bNum = parseInt(b.split('_').pop(), 10);
                return aNum - bNum;
            });
    }

    getCustomerInitialFrame(type) {
        const frameNames = this.getCustomerFrameNames(type);
        const atlasKey = this.getCustomerAtlasKey(type);

        if (atlasKey && this.scene.textures.exists(atlasKey) && frameNames.length) {
            return { textureKey: atlasKey, frame: frameNames[0] };
        }

        if (frameNames.length) {
            return { textureKey: frameNames[0], frame: null };
        }

        // Fallback: use the atlas key as texture key (may be missing, but avoids undefined)
        return { textureKey: atlasKey, frame: null };
    }

    getCustomerAnimKey(type) {
        return `customer_${type}_idle`;
    }

    createCustomerAnimations() {
        for (let type = 1; type <= Config.CUSTOMER_COUNT; type++) {
            const animKey = this.getCustomerAnimKey(type);
            if (this.scene.anims.exists(animKey)) continue;

            const frameNames = this.getCustomerFrameNames(type);
            if (!frameNames.length) continue;

            const atlasKey = this.getCustomerAtlasKey(type);
            const frames = frameNames.map(name => atlasKey && this.scene.textures.exists(atlasKey)
                ? { key: atlasKey, frame: name }
                : { key: name });

            this.scene.anims.create({
                key: animKey,
                frames,
                frameRate: 12,
                repeat: -1
            });
        }
    }

    generateNewCustomer() {
        this.portraitId  = Math.floor(Math.random() * Config.CUSTOMER_COUNT) + 1;
        this.targetType  = Math.floor(Math.random() * Config.PRODUCT_TYPES) + 1;
        this.targetLevel = Config.MAX_LEVEL;  // always demand the highest level
        this.isSatisfied = false;

        const animKey = this.getCustomerAnimKey(this.portraitId);
        if (this.scene.anims.exists(animKey)) {
            this.portraitSprite.play(animKey);
        } else {
            // Fallback to first frame if animation missing
            const initial = this.getCustomerInitialFrame(this.portraitId);
            this.portraitSprite.setTexture(initial.textureKey, initial.frame);
        }

        this.orderSprite.setTexture(getTextureKey(this.targetType, this.targetLevel));
        this.orderSprite.setAlpha(0);

        this.giveButton.setAlpha(0.4);

        // Entrance slide-in from right edge with slight bounce
        const targetX = this.scene.game.size.x;
        const startX = this.scene.game.size.right + 150;
        this.container.x = startX;
        this.scene.tweens.add({
            targets: this.container,
            x: targetX,
            duration: 450,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Fade in the order icon inside the table cloud after customer has arrived
                this.scene.tweens.add({
                    targets: this.orderSprite,
                    alpha: 1,
                    duration: 250,
                    ease: 'Cubic'
                });
            }
        });

        if (this.onNewCustomer) {
            this.onNewCustomer(this.targetType, this.targetLevel);
        }
    }

    /** Re-evaluate whether the current order can be fulfilled */
    checkOrder(gridSystem) {
        const found = gridSystem.findItemByTypeAndLevel(this.targetType, this.targetLevel);
        if (found && !this.isSatisfied) {
            this.isSatisfied = true;
            this.giveButton.setAlpha(1);
            if (this.onOrderStatusChanged) this.onOrderStatusChanged(true, this.giveButton);
        } else if (!found && this.isSatisfied) {
            this.isSatisfied = false;
            this.giveButton.setAlpha(0.4);
            if (this.onOrderStatusChanged) this.onOrderStatusChanged(false, this.giveButton);
        }
    }

    onGiveClicked() {
        if (!this.isSatisfied) return;
        if (this.onOrderFulfilled) this.onOrderFulfilled();
    }

    fulfillOrder(gridSystem) {
        const item = gridSystem.findItemByTypeAndLevel(this.targetType, this.targetLevel);
        if (item) gridSystem.removeItem(item);

        // Customer leaves (cloud stays visible)
        this.scene.tweens.add({
            targets: [this.portraitSprite, this.orderSprite],
            alpha: 0,
            duration: 250,
            onComplete: () => {
                this.portraitSprite.setAlpha(1);
                this.orderSprite.setAlpha(0);
                this.generateNewCustomer();
                this.checkOrder(gridSystem);
            }
        });
    }
}
