import Config from '../ecs/MergeConfig';

export default class HelperSystem {
    constructor(scene, gridSystem, boardContainer, globalState) {
        this.scene = scene;
        this.grid = gridSystem;
        this.boardContainer = boardContainer;
        this.globalState = globalState;

        this.fingerSprite = null;

        this.productFingerScale = 0.8;
        this.buttonFingerScale = 1.3;

        this.customerTargetType = null;
        this.customerTargetLevel = null;
        this.customerWaiting = false;
        this.onlyPointToGiveButton = false; // когда заказ готов, только кнопка
        this.targetGiveButton = null;

        this.suggestionPair = null;
        this.isPointingAtButton = false;

        this.wiggleTimer = null;
        this.fingerTimer = null;
        this.btnPointerTimer = null;
        this.wiggleTween = null;
        this.growTween = null;
        this.fingerTween = null;

        this._resizing = false;
    }

    init() {
        this.fingerSprite = this.scene.add.image(0, 0, 'helper_finger')
            .setDisplaySize(50, 50)
            .setDepth(9999)
            .setAlpha(0)
            .setOrigin(0.2, 0.1);


        if (this.scene.mainContainer) {
            this.scene.mainContainer.add(this.fingerSprite);
        }
    }

    
    setCustomerOrder(type, level) {
        if (this.onlyPointToGiveButton) {
            // Когда заказ готов, не предлагаем мерж — продолжаем указывать на кнопку.
            if (this.targetGiveButton) {
                this.pointToGiveButton(this.targetGiveButton);
            }
            return;
        }

        console.log('[Helper] setCustomerOrder:', type, level);
        this.clearHint();

        this.customerTargetType = type;
        this.customerTargetLevel = level;
        this.customerWaiting = true;

        this.wiggleTimer = this.scene.time.delayedCall(500, this.startWiggleCycle, [], this);
        console.log('[Helper] wiggleTimer set for 0.5s');

        this.fingerTimer = this.scene.time.delayedCall(1500, this.showFinger, [], this);
        console.log('[Helper] fingerTimer set for 1.5s');
    }

    
    clearCustomerOrder() {
        this.customerWaiting = false;
        this.isPointingAtButton = false;
        this.onlyPointToGiveButton = false;
        if (this.btnPointerTimer) {
            this.btnPointerTimer.remove(false);
            this.btnPointerTimer = null;
        }
        this.clearHint();
    }

    
    pointToGiveButton(button) {
        if (!button) return;
        if (this.isPointingAtButton && this.targetGiveButton === button) return;

        this.onlyPointToGiveButton = true;
        this.targetGiveButton = button;
        this.customerWaiting = true;
        this.clearHint();
        this.isPointingAtButton = true;

        this.ensureFingerOnTop();

        const btnWorld = button.getWorldTransformMatrix();
        const mainMatrix = this.scene.mainContainer.getWorldTransformMatrix();
        const invMain = mainMatrix.invert();
        const localBtn = invMain.transformPoint(btnWorld.tx, btnWorld.ty);

        this.fingerSprite.setPosition(localBtn.x, localBtn.y).setAlpha(1);
        this.fingerSprite.setScale(1.3);

        if (this.fingerTween) {
            this.fingerTween.stop();
            this.fingerTween = null;
        }

        this.fingerTween = this.scene.tweens.add({
            targets: this.fingerSprite,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 200,
            yoyo: true,
            repeat: -1,
            repeatDelay: 300
        });

        // Через 1 секунду оставляем цикл, если пользователю не хватает мгновенного эффекта.
        this.btnPointerTimer = this.scene.time.delayedCall(1000, () => {
            if (!this.isPointingAtButton) return;
            this.ensureFingerOnTop();
            this.fingerSprite.setPosition(localBtn.x, localBtn.y).setAlpha(1);
        });
    }

    clearHint() {
        console.log('[Helper] clearHint called');
        if (this.wiggleTimer) {
            this.wiggleTimer.remove(false);
            this.wiggleTimer = null;
            console.log('[Helper] wiggleTimer removed');
        }
        if (this.fingerTimer) {
            this.fingerTimer.remove(false);
            this.fingerTimer = null;
            console.log('[Helper] fingerTimer removed');
        }
        if (this.wiggleTween) {
            this.wiggleTween.stop();
            this.wiggleTween = null;
            console.log('[Helper] wiggleTween stopped');
        }
        if (this.growTween) {
            this.growTween.stop();
            this.growTween = null;
            console.log('[Helper] growTween stopped');
        }
        if (this.fingerTween) {
            this.fingerTween.stop();
            this.fingerTween = null;
            console.log('[Helper] fingerTween stopped');
        }
        if (this.suggestionPair) {
            this.suggestionPair.forEach(i => {
                if (i.sprite) { i.sprite.setAngle(0); }
            });
            this.suggestionPair = null;
            console.log('[Helper] suggestionPair reset');
        }
        this.hideFinger();
    }

    startWiggleCycle() {
        console.log('[Helper] startWiggleCycle called, customerWaiting:', this.customerWaiting);
        if (!this.customerWaiting || this.onlyPointToGiveButton) return;

        const pair = this.findSuggestionPair();
        if (!pair) {
            console.log('[Helper] No suggestion pair found');
            return;
        }

        console.log('[Helper] Found suggestion pair:', pair.map(i => `(${i.type}${i.level})`).join('-'));
        this.suggestionPair = pair;
        const sprites = pair.map(i => i.sprite).filter(Boolean);
        if (!sprites.length) {
            console.log('[Helper] No sprites in pair');
            return;
        }

        console.log('[Helper] Starting wiggle animation with', sprites.length, 'sprites');

        if (this.wiggleTween) {
            this.wiggleTween.stop();
            this.wiggleTween = null;
        }
        if (this.growTween) {
            this.growTween.stop();
            this.growTween = null;
        }

        sprites.forEach(s => {
            s.setAngle(0);

            s._helperBaseScaleX = s.scaleX;
            s._helperBaseScaleY = s.scaleY;
        });

        this.growTween = this.scene.tweens.timeline({
            targets: sprites,
            ease: 'Linear',
            tweens: [
                {
                    scaleX: (t) => t._helperBaseScaleX * 1.2,
                    scaleY: (t) => t._helperBaseScaleY * 1.2,
                    duration: 90
                },
                {
                    scaleX: (t) => t._helperBaseScaleX,
                    scaleY: (t) => t._helperBaseScaleY,
                    duration: 130
                },
                {
                    angle: 10,
                    duration: 133,
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => {
                        sprites.forEach(s => s.setAngle(0));
                        if (this.customerWaiting) {
                            this.wiggleTimer = this.scene.time.delayedCall(500, this.startWiggleCycle, [], this);
                        }
                    }
                }
            ]
        });
    }

    showFinger() {
        console.log('[Helper] showFinger called, customerWaiting:', this.customerWaiting);
        if (!this.customerWaiting || this.onlyPointToGiveButton) return;

        const pair = this.suggestionPair || this.findSuggestionPair();
        if (!pair) {
            console.log('[Helper] showFinger: no pair found');
            return;
        }

        console.log('[Helper] showFinger: showing finger animation');
        const [a, b] = pair;
        const ax = this.grid.cellToX(a.col);
        const ay = this.grid.cellToY(a.row);
        const bx = this.grid.cellToX(b.col);
        const by = this.grid.cellToY(b.row);

        this.ensureFingerOnTop();
        this.fingerSprite.setScale(this.productFingerScale);
        this.setFingerToBoardPoint(ax, ay);

        if (this.fingerTween) {
            this.fingerTween.stop();
            this.fingerTween = null;
        }

        this.fingerTween = this.scene.tweens.add({
            targets: this.fingerSprite,
            x: this.toMainX(bx),
            y: this.toMainY(by),
            duration: Config.HINT_MOVE_DURATION,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            repeatDelay: 400
        });
    }

    restoreAfterResize(giveButton) {
        console.log('[Helper] restoreAfterResize, giveButton:', !!giveButton, 'customerWaiting:', this.customerWaiting);
        this._resizing = false;
        if (!this.customerWaiting) {
            console.log('[Helper] restoreAfterResize: no customer waiting');
            return;
        }

        if (giveButton) {
            console.log('[Helper] Pointing to give button');
            this.isPointingAtButton = false;
            this.pointToGiveButton(giveButton);
        } else {
            console.log('[Helper] Restarting customer order hints');
            this.setCustomerOrder(this.customerTargetType, this.customerTargetLevel);
        }
    }

    ensureFingerOnTop() {
        if (!this.fingerSprite) return;
        this.fingerSprite.setDepth(9999);
        if (this.scene.mainContainer) {
            this.scene.mainContainer.bringToTop(this.fingerSprite);
        }
    }

    toMainX(boardX) {

        const boardMatrix = this.boardContainer.getWorldTransformMatrix();
        const mainMatrix = this.scene.mainContainer.getWorldTransformMatrix();
        const invMain = mainMatrix.invert();
        const point = boardMatrix.transformPoint(boardX, 0);
        return invMain.transformPoint(point.x, point.y).x;
    }

    toMainY(boardY) {

        const boardMatrix = this.boardContainer.getWorldTransformMatrix();
        const mainMatrix = this.scene.mainContainer.getWorldTransformMatrix();
        const invMain = mainMatrix.invert();
        const point = boardMatrix.transformPoint(0, boardY);
        return invMain.transformPoint(point.x, point.y).y;
    }

    setFingerToBoardPoint(boardX, boardY) {
        const boardMatrix = this.boardContainer.getWorldTransformMatrix();
        const mainMatrix = this.scene.mainContainer.getWorldTransformMatrix();
        const invMain = mainMatrix.invert();
        const worldPoint = boardMatrix.transformPoint(boardX, boardY);
        const mainPoint = invMain.transformPoint(worldPoint.x, worldPoint.y);
        this.fingerSprite.setPosition(mainPoint.x, mainPoint.y).setAlpha(1);
    }

    hideFinger() {
        if (this.fingerTween) {
            this.fingerTween.stop();
            this.fingerTween = null;
        }

        this.fingerSprite.setScale(this.productFingerScale);
        this.fingerSprite.setAlpha(0);
    }

    
    findSuggestionPair() {
        if (!this.customerWaiting || !this.customerTargetType) return null;

        const maxLevel = Math.max(1, this.customerTargetLevel - 1);
        for (let level = maxLevel; level >= 1; level--) {
            const candidates = this.grid.items.filter(i => i.type === this.customerTargetType && i.level === level);
            const closest = this.findClosestPair(candidates);
            if (closest) return closest;
        }

        const allPairs = [];
        const items = this.grid.items.filter(i => i.level < Config.MAX_LEVEL);
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                const a = items[i];
                const b = items[j];
                if (a.type === b.type && a.level === b.level) {
                    allPairs.push([a, b]);
                }
            }
        }
        return this.findClosestPairFromList(allPairs);
    }

    findClosestPair(items) {
        if (!items || items.length < 2) return null;
        const pairs = [];
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                pairs.push([items[i], items[j]]);
            }
        }
        return this.findClosestPairFromList(pairs);
    }

    findClosestPairFromList(pairs) {
        let best = null;
        let bestDist = Infinity;
        for (const [a, b] of pairs) {
            const dx = a.col - b.col;
            const dy = a.row - b.row;
            const dist = dx * dx + dy * dy;
            if (dist < bestDist) {
                bestDist = dist;
                best = [a, b];
            }
        }
        return best;
    }

    resetIdle() {
        if (this._resizing) {
            console.log('[Helper] resetIdle blocked (_resizing=true)');
            return;
        }

        console.log('[Helper] resetIdle called');
        const hasOrder = this.customerWaiting;
        const type = this.customerTargetType;
        const level = this.customerTargetLevel;

        // чтобы не потерять состояние готового заказа
        if (hasOrder && this.onlyPointToGiveButton && this.targetGiveButton) {
            console.log('[Helper] resetIdle: keep pointing to give button');
            this.pointToGiveButton(this.targetGiveButton);
            this.globalState.lastInputTime = Date.now();
            return;
        }

        this.clearHint();
        this.globalState.lastInputTime = Date.now();

        if (hasOrder) {
            console.log('[Helper] Restarting helper for active customer');
            this.setCustomerOrder(type, level);
        }
    }
}


