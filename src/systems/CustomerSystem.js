import { getTextureKey } from '../ecs/Components';
import Config from '../ecs/MergeConfig';
import Utils from '../../core/framework/Utils';

export default class CustomerSystem {
    constructor(scene, container, boardContainer, tableTopY, tableHeight) {
        this.scene = scene;
        this.container = container;
        this.boardContainer = boardContainer;
        this.tableTopY = tableTopY;
        this.tableHeight = tableHeight;

        // CustomerData + OrderRequirement
        this.portraitId        = 0;
        this.orderRequirements = []; // [{ productType, targetLevel, isSatisfied }]
        this.rewardAmount      = 0;
        this.isSatisfied       = false;

        // Sprites
        this.portraitSprite = null;
        this.cloudSprite    = null;
        this.orderSprites   = []; // multi product icons in cloud
        this.rewardGroup    = null;
        this.giveButton     = null;

        /** @type {function():void|null} */
        this.onOrderFulfilled = null;

        /** @type {function(number, number):void|null} */
        this.onNewCustomer = null;
        /** @type {function(boolean, Object):void|null} */
        this.onOrderStatusChanged = null;

        // external references (injected from Game)
        this.gridSystem = null;
        this.globalState = null;
    }

    init() {
        // Start the customer area off-screen to the right so the card can slide in.
        this.container.x = this.scene.game.size.right + 150;

        // Build animation sequences from loaded textures or atlases (customer_1_0.., customer_2_0.., etc.)
        this.createCustomerAnimations();

        // Animated portrait (uses a looping animation for the current customer type)
        const initial = this.getCustomerInitialFrame(1);
        // Shift the customer body slightly to the left for better layout
        this.portraitSprite = this.scene.add.sprite(-130, 0, initial.textureKey, initial.frame)
            .setScale(1.5)
            .setDepth(5);
        this.container.add(this.portraitSprite);

        // Cloud: placed on the table (not inside the customer container)
        const cloudHeight = 60;
        const cloudY = (this.tableTopY || -200) + (cloudHeight / 2);
        this.cloudSprite = this.scene.add.image(-110, cloudY - cloudHeight * 0.75, 'customer_cloude_of_proucts')
            .setDisplaySize(120, cloudHeight)
            .setDepth(5);
        (this.boardContainer || this.container).add(this.cloudSprite);

        // Placeholder for order icons: created per order dynamically
        this.orderSprites = [];

        // Reward tag container (gold icon + text)
        this.rewardGroup = this.scene.add.container(this.cloudSprite.x + 35, this.cloudSprite.y, []);
        this.rewardGroup.setDepth(6).setAlpha(0);
        
        // Background with rounded corners for reward tag
        // const rewardBgGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        // rewardBgGraphics.fillStyle(0x555555, 0.3); // Semi-transparent gray
        // rewardBgGraphics.fillRoundedRect(-18, -28, 54, 28, 6); // x, y, width, height, radius
        // this.rewardGroup.add(rewardBgGraphics);
        
        const rewardIcon = this.scene.add.image(0+12, 0 - 64, 'gold_1').setDisplaySize(18, 18);
        this.rewardText = this.scene.add.text(14+12, -8 - 64, 'x0', { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 });
        this.rewardGroup.add([rewardIcon, this.rewardText]);
        (this.boardContainer || this.container).add(this.rewardGroup);

        // Button: placed on the table near the cloud (not inside customer container)
        const buttonWidth = 90;
        const buttonHeight = 45;
        const buttonX = this.cloudSprite.x;
        const buttonY = this.cloudSprite.y - (cloudHeight / 2) - (buttonHeight / 2);

        this.giveButton = this.scene.add.image(buttonX+140, buttonY+60, 'btn_give_to_customer')
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

    setOrderRequirements(orderRequirements, rewardAmount) {
        this.orderRequirements = orderRequirements.map(item => ({ ...item, isSatisfied: false }));
        this.rewardAmount = rewardAmount;
        this.isSatisfied = false;
        this.giveButton.setAlpha(0.4);
        this.updateOrderIcons();

        if (this.rewardText) {
            this.rewardText.setText(`x${rewardAmount}`);
        }

        if (this.onNewCustomer && this.orderRequirements.length) {
            const firstReq = this.orderRequirements[0];
            this.onNewCustomer(firstReq.productType, firstReq.targetLevel);
        }
    }

    updateOrderIcons() {
        this.orderSprites.forEach(sprite => sprite.destroy());
        this.orderSprites = [];

        if (!this.orderRequirements.length) return;

        const count = this.orderRequirements.length;
        const spacing = 38;
        const startX = this.cloudSprite.x - (spacing * (count - 1)) / 2 - 4;

        for (let i = 0; i < count; i++) {
            const req = this.orderRequirements[i];
            const icon = this.scene.add.image(startX + i * spacing, this.cloudSprite.y, getTextureKey(req.productType, req.targetLevel))
                .setDisplaySize(35, 35)
                .setDepth(6)
                .setAlpha(0);
            (this.boardContainer || this.container).add(icon);
            this.orderSprites.push(icon);
            this.scene.tweens.add({
                targets: icon,
                alpha: 1,
                duration: 250,
                ease: 'Cubic',
                delay: 100 + i * 50
            });
        }

        this.rewardGroup.setPosition(this.cloudSprite.x + 48, this.cloudSprite.y - 2);
        
        // Animate reward group in
        this.rewardGroup.setAlpha(0);
        this.scene.tweens.add({
            targets: this.rewardGroup,
            alpha: 1,
            duration: 250,
            ease: 'Cubic',
            delay: 100 + count * 50
        });
    }

    generateProceduralOrder() {
        const minItems = Config.PROCEDURAL_ORDER_MIN_ITEMS;
        const maxItems = Config.PROCEDURAL_ORDER_MAX_ITEMS;
        const count = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;

        const boardItems = this.gridSystem && this.gridSystem.items ? this.gridSystem.items.slice() : [];
        const requirements = [];

        for (let i = 0; i < count; i++) {
            if (boardItems.length) {
                const random = boardItems[Math.floor(Math.random() * boardItems.length)];
                requirements.push({ productType: random.type, targetLevel: random.level, isSatisfied: false });
            } else {
                const productType = Math.floor(Math.random() * Config.PRODUCT_TYPES) + 1;
                const targetLevel = Math.floor(Math.random() * (Config.MAX_LEVEL - 1)) + 2;
                requirements.push({ productType, targetLevel, isSatisfied: false });
            }
        }

        return requirements;
    }

    getBoardItemTypes() {
        const boardItems = this.gridSystem && this.gridSystem.items ? this.gridSystem.items : [];
        const types = Array.from(new Set(boardItems.map(item => item.type)));
        return types.length ? types : [1];
    }

    getRequiredItems(gridSystem) {
        const matches = [];
        for (const req of this.orderRequirements) {
            const item = gridSystem.items.find(i =>
                i.type === req.productType && i.level === req.targetLevel && !matches.includes(i)
            );
            if (!item) return null;
            matches.push(item);
        }
        return matches;
    }

    getMissingRequirement(gridSystem) {
        if (!this.orderRequirements.length) return null;
        const matched = [];
        for (const req of this.orderRequirements) {
            const item = gridSystem.items.find(i =>
                i.type === req.productType && i.level === req.targetLevel && !matched.includes(i)
            );
            if (item) {
                matched.push(item);
            } else {
                return req;
            }
        }
        return null;
    }

    generateNewCustomer() {
        this.portraitId = Math.floor(Math.random() * Config.CUSTOMER_COUNT) + 1;

        const currentIndex = (this.globalState && this.globalState.currentCustomerIndex) || 0;
        if (currentIndex < Config.CUSTOMER_PROGRESSION.length) {
            const entry = Config.CUSTOMER_PROGRESSION[currentIndex];
            const boardTypes = this.getBoardItemTypes();
            const orderRequirements = entry.orderRequirements.map(req => {
                const productType = boardTypes[Math.floor(Math.random() * boardTypes.length)];
                return { productType, targetLevel: req.targetLevel, isSatisfied: false };
            });
            this.setOrderRequirements(orderRequirements, entry.rewardAmount);
        } else {
            const orderRequirements = this.generateProceduralOrder();
            const rewardAmount = Config.PROCEDURAL_REWARD_BASE + orderRequirements.length * Config.PROCEDURAL_REWARD_PER_ITEM;
            this.setOrderRequirements(orderRequirements, rewardAmount);
        }

        this.isSatisfied = false;

        const animKey = this.getCustomerAnimKey(this.portraitId);
        if (this.scene.anims.exists(animKey)) {
            this.portraitSprite.play(animKey);
        } else {
            const initial = this.getCustomerInitialFrame(this.portraitId);
            this.portraitSprite.setTexture(initial.textureKey, initial.frame);
        }

        this.giveButton.setAlpha(0.4);

        const targetX = this.scene.game.size.x;
        const startX = this.scene.game.size.right + 150;
        this.container.x = startX;

        this.scene.tweens.add({
            targets: this.container,
            x: targetX,
            duration: 450,
            ease: 'Back.easeOut',
            onStart: () => {
                Utils.addAudio(this.scene, 'customer_new', 1.2);
            },
            onComplete: () => {
                this.orderSprites.forEach((icon, idx) => {
                    this.scene.tweens.add({
                        targets: icon,
                        alpha: 1,
                        duration: 250,
                        ease: 'Cubic',
                        delay: idx * 50
                    });
                });
                this.rewardGroup.setAlpha(1);
            }
        });
    }

    /** Re-evaluate whether the current order can be fulfilled */
    checkOrder(gridSystem) {
        if (!this.orderRequirements.length) {
            this.isSatisfied = false;
            this.giveButton.setAlpha(0.4);
            if (this.onOrderStatusChanged) this.onOrderStatusChanged(false, this.giveButton);
            return;
        }

        const matched = [];
        for (const req of this.orderRequirements) {
            const item = gridSystem.items.find(i =>
                i.type === req.productType && i.level === req.targetLevel && !matched.includes(i)
            );
            if (!item) {
                this.orderRequirements.forEach(r => (r.isSatisfied = false));
                this.isSatisfied = false;
                this.giveButton.setAlpha(0.4);
                if (this.onOrderStatusChanged) this.onOrderStatusChanged(false, this.giveButton);
                return;
            }
            matched.push(item);
        }

        this.orderRequirements.forEach((r, idx) => (r.isSatisfied = idx < matched.length));
        this.isSatisfied = true;
        this.giveButton.setAlpha(1);
        if (this.onOrderStatusChanged) this.onOrderStatusChanged(true, this.giveButton);
    }

    onGiveClicked() {
        if (!this.isSatisfied) return;
        
        Utils.addAudio(this.scene, 'order_give', 0.6);
        
        if (this.onOrderFulfilled) this.onOrderFulfilled();
    }

    fulfillOrder() {
        this.giveButton.setAlpha(0.4);
        this.scene.tweens.add({
            targets: [this.portraitSprite, this.cloudSprite, this.rewardGroup, ...this.orderSprites],
            alpha: 0,
            duration: 250,
            onComplete: () => {
                this.portraitSprite.setAlpha(1);
                this.cloudSprite.setAlpha(1);
                this.rewardGroup.setAlpha(0);
                this.orderSprites.forEach(sprite => sprite.destroy());
                this.orderSprites = [];
                if (this.globalState) {
                    this.globalState.currentCustomerIndex = (this.globalState.currentCustomerIndex || 0) + 1;
                }
                this.generateNewCustomer();
                if (this.gridSystem) this.checkOrder(this.gridSystem);
            }
        });
    }
}
