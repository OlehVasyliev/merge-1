import { getTextureKey } from '../ecs/Components';
import Config from '../ecs/MergeConfig';
import Utils from '../../core/framework/Utils';

export default class EconomySystem {
    constructor(scene, gridSystem, customerSystem, uiManager, globalState) {
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.customerSystem = customerSystem;
        this.uiManager = uiManager;
        this.globalState = globalState;
    }

    init() {
        // Nothing to initialise yet – wiring happens in Game.js
    }

    /** Called when the player clicks the "Give" button and the order is valid */
    processOrder() {
        const cs = this.customerSystem;
        const rewardAmount = cs.rewardAmount;

        const matched = cs.getRequiredItems(this.gridSystem);
        if (matched && matched.length) {
            this.animateProductsToCustomer(matched).then(() => {
                matched.forEach(item => this.gridSystem.removeItem(item));

                // Step 2 – hide customer UI (cloud, button, portrait slide-out)
                cs.fulfillOrder();

                // Step 3 – spawn coins at customer position and fly them to the HUD counter
                this.spawnFlyingCoins(rewardAmount);
            });
        } else {
            // Fallback: no matching items found, still fulfill order and spawn coins
            cs.fulfillOrder();
            this.spawnFlyingCoins(rewardAmount);
        }
    }

    animateProductsToCustomer(items) {
        const portrait = this.customerSystem.portraitSprite;
        const customerMat = portrait.getWorldTransformMatrix();
        const targetX = customerMat.tx;
        const targetY = customerMat.ty;

        return new Promise(resolve => {
            let completed = 0;
            if (!items.length) return resolve();

            items.forEach((item, index) => {
                const itemMat = item.sprite.getWorldTransformMatrix();
                const sourceX = itemMat.tx;
                const sourceY = itemMat.ty;

                const clone = this.scene.add.image(sourceX, sourceY, getTextureKey(item.type, item.level))
                    .setDisplaySize(Config.CELL_SIZE - 4, Config.CELL_SIZE - 4)
                    .setDepth(2500);

                item.sprite.setAlpha(0);

                const midX = sourceX + (targetX - sourceX) * 0.5;
                const midY = sourceY + (targetY - sourceY) * 0.5;

                this.scene.tweens.timeline({
                    targets: clone,
                    ease: 'Power2',
                    delay: index * 60,
                    onComplete: () => {
                        clone.destroy();
                        completed += 1;
                        if (completed === items.length) resolve();
                    },
                    tweens: [
                        {
                            x: midX,
                            y: midY,
                            scaleX: 0.2,
                            scaleY: 0.2,
                            alpha: 1,
                            duration: 400
                        },
                        {
                            x: targetX,
                            y: targetY,
                            scaleX: 0.1,
                            scaleY: 0.1,
                            alpha: 0,
                            duration: 500
                        }
                    ]
                });
            });
        });
    }

    /** Spawn gold_1 sprites and tween them to the coin counter */
    spawnFlyingCoins(amount) {
        // Play money sound
        Utils.addAudio(this.scene, 'money', 0.6);
        
        // Determine spawn origin (customer portrait world position)
        const portrait = this.customerSystem.portraitSprite;
        const portraitMat = portrait.getWorldTransformMatrix();
        const spawnX = portraitMat.tx + 50;
        const spawnY = portraitMat.ty - 65;

        // Coin counter target (world position)
        const target = this.uiManager.getCoinTargetPosition();

        // Limit visual coins to avoid performance issues; map reward to 5-10 sprites
        const coinCount = Math.min(amount, 10);
        const coinsPerSprite = amount / coinCount;
        let coinsAdded = 0;

        for (let i = 0; i < coinCount; i++) {
            // Burst spread: random offset
            const ox = (Math.random() - 0.5) * 8;
            const oy = (Math.random() - 0.5) * 8;

            const coin = this.scene.add.image(spawnX + ox, spawnY + oy, 'gold_1')
                .setDisplaySize(24, 24)
                .setDepth(2000);

            // Staggered fly-to-counter tween
            this.scene.tweens.add({
                targets: coin,
                x: target.x - 38,
                y: target.y,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 500 + Math.random() * 200,
                delay: i * 50,
                ease: 'Power2',
                onComplete: () => {
                    coin.destroy();

                    // Increment balance
                    const portion = (i === coinCount - 1)
                        ? amount - coinsAdded
                        : Math.round(coinsPerSprite);
                    coinsAdded += portion;
                    this.globalState.totalCoins += portion;

                    // Update HUD
                    this.uiManager.updateCoinDisplay();
                }
            });
        }
    }
}
