import ParentScene from "../core/framework/components/Scene";
import Utils from "../core/framework/Utils";
import { createGlobalState } from "./ecs/Components";
import UIManager from "./systems/UIManager";

const BUILD_LEVELS = ['build_lvl_1', 'build_lvl_2', 'build_lvl_3', 'build_lvl_4'];
const MAX_BUILD_LEVEL = 4;
const UPGRADE_COST = 100;
const START_COINS = 320;

export default class Game extends ParentScene {
    create() {
        this.globalState = createGlobalState(0);
        this.globalState.totalCoins = START_COINS;

        this.buildLevel = 1;
        this.interactionLocked = true;

        this.drawScene();

        this.uiManager = new UIManager(this, this.globalState);
        this.uiManager.init();
        this.uiManager.updateCoinDisplay();

        Utils.addAudio(this, 'music_bg', 0.3, true);

        this.time.delayedCall(600, () => this.startIntro());

        this.scale.on('resize', this.resize, this);
        
        this.time.delayedCall(10, () => this.resize(this.scale));
    }

    resize(gameSize) {
        if (!gameSize) gameSize = this.scale;
        const w = gameSize.width;
        const h = gameSize.height;

        if (this.bg) {
            this.bg.setPosition(w / 2, h / 2);
            const bgScale = Math.max(w / this.bg.width, h / this.bg.height);
            this.bg.setScale(bgScale);

            
            const centerX = w / 2;
            const centerY = h / 2 - 150;

            
            
            const landscapeOffset = w > h ? -225 : 0;

            if (this.building) {
                this.building.setPosition(centerX, centerY + landscapeOffset);

                
                const bScale = bgScale * 0.35;
                this.building.setScale(bScale);

                if (this.slot) {
                    this.slot.setPosition(centerX + 30, centerY - 20 + landscapeOffset);
                    this.slot.setScale(bScale * 0.9);
                }

                this.building.setDepth(2);
                if (this.slot) this.slot.setDepth(1);
            }
        }

        if (this.customer) {
            if (this.customerBackdrop && this.customerBackdrop.clear) {
                const customerTop = this.customer.y - (this.customer.displayHeight || this.customer.height || 0);
                const rectY = Math.max(0, customerTop);
                const rectH = Math.max(0, h - rectY);
                this.customerBackdrop.clear();
                this.customerBackdrop.fillStyle(0x333333, 1);
                this.customerBackdrop.fillRect(0, rectY, w, rectH);
                this.customerBackdrop.setDepth(45);
            }

            if (this.customerScale) {
                this.customer.setScale(this.customerScale);
            } else {
                const costW = this.customer.width || this.customer.displayWidth;
                const costH = this.customer.height || this.customer.displayHeight;
                if (costW && costH) {
                    this.customerScale = Math.min((w * 0.4) / costW, (h * 0.4) / costH);
                    this.customer.setScale(this.customerScale);
                }
            }
            this.alignDialogueBlock();
        }
    }

    drawScene() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.bg = this.add.image(w / 2, h / 2, 'build_bg');
        this.bg.setDepth(0);

        const buildingX = w / 2;
        const buildingY = h / 2;

        this.building = this.add.image(buildingX, buildingY, BUILD_LEVELS[0]);
        this.building.setDepth(2);
        this.building.setInteractive();
        this.building.on('pointerdown', () => this.handleBuildingClick());

        this.slot = this.add.image(buildingX, buildingY, 'build_slot');
        this.slot.setDepth(1);

        this.resize();
    }

    

    getDialogueLayout() {
        const w = this.scale.width;
        const cW = (this.customer.displayWidth || this.customer.width || 0);

        const baseBw = Math.min(w > (this.scale.height || 0) ? w * 0.35 : w * 0.45, w - 40 - cW - 10); 
        let bw = baseBw;
        let scaleFactor = 1;

        if (w < 686) {
            scaleFactor = w / 686;
            bw = Math.max(160, baseBw * scaleFactor);
        }

        bw = Math.max(180, bw); 

        const totalWidth = cW + 10 + bw;
        const shiftX = -80; 
        const leftX = Math.max(20, (w - totalWidth) / 2) + shiftX;

        return {
            customerX: leftX + cW / 2,
            bubbleX: leftX + cW + 10,
            bw: bw,
            scaleFactor: scaleFactor
        };
    }

    startIntro() {
        const w = this.scale.width;
        const h = this.scale.height;
        const baseY = h - 20; 

        if (this.textures.exists('customer_1')) {
            const tex = this.textures.get('customer_1');
            let frameNames = tex.getFrameNames().filter(name => name.startsWith('customer_1_'));
            frameNames.sort((a, b) => {
                const aN = parseInt(a.split('_').pop(), 10);
                const bN = parseInt(b.split('_').pop(), 10);
                return aN - bN;
            });

            this.customer = this.add.sprite(-(w * 0.15), baseY, 'customer_1', frameNames[0] || null);

            if (frameNames.length && !this.anims.exists('customer_1_idle')) {
                this.anims.create({
                    key: 'customer_1_idle',
                    frames: frameNames.map(frame => ({ key: 'customer_1', frame })),
                    frameRate: 8,
                    repeat: -1
                });
            }

            if (this.anims.exists('customer_1_idle')) {
                this.customer.play('customer_1_idle');
            }

            this.customer.setFlipX(true);
        } else {
            this.customer = this.add.graphics();
            this.customer.fillStyle(0x818181, 1);
            this.customer.fillRect(-60, -100, 120, 200);
            this.customer.setPosition(-(w * 0.15), baseY);
            
            this.customer.scaleX = -1;
        }

        
        
        this.customerBackdrop = this.add.graphics();
        this.customerBackdrop.fillStyle(0x333333, 1);
        this.customerBackdrop.fillRect(0, baseY - 170, w, 190);
        this.customerBackdrop.setDepth(45);

        this.customer.setDepth(50);
        if (typeof this.customer.setOrigin === 'function') {
            this.customer.setOrigin(0.5, 1);
        }

        const costW = this.customer.width || this.customer.displayWidth;
        const costH = this.customer.height || this.customer.displayHeight;
        if (costW && costH) {
            this.customerScale = Math.min((w * 0.4) / costW, (h * 0.4) / costH);
            this.customer.setScale(this.customerScale);
        }

        const customerHalfHeight = (this.customer.displayHeight || this.customer.height || 0) * 0.5;
        const raiseCustomerBy = 18;
        this.customer.y = baseY + customerHalfHeight - raiseCustomerBy;

        const customerTop = this.customer.y - (this.customer.displayHeight || this.customer.height || 0);
        const rectY = Math.max(0, customerTop);
        const rectH = Math.max(0, this.scale.height - rectY);
        if (this.customerBackdrop) {
            this.customerBackdrop.clear();
            this.customerBackdrop.fillStyle(0x333333, 1);
            this.customerBackdrop.fillRect(0, rectY, w, rectH);
            this.customerBackdrop.setDepth(45);
        }

        const layout = this.getDialogueLayout();
        const finalCustomerX = layout.customerX;

        Utils.addAudio(this, 'customer_new', 0.7);

        this.tweens.add({
            targets: this.customer,
            x: finalCustomerX,
            duration: 700,
            ease: 'Cubic.easeOut',
            onComplete: () => this.time.delayedCall(350, () => this.showDialogue())
        });
    }

    showDialogue() {
        const w = this.scale.width;
        const h = this.scale.height;
        const baseY = h - 20;

        if (this.customer) {
            const customerHalfHeight = (this.customer.displayHeight || this.customer.height || 0) * 0.5;
            this.customer.setPosition(this.customer.x, baseY + customerHalfHeight);
        }

        this.bubble = this.add.graphics();
        this.bubble.setAlpha(0);
        this.bubble.setDepth(60);

        const layout = this.getDialogueLayout();
        const baseFontSize = w < 686 ? Math.max(12, Math.floor(24 * layout.scaleFactor)) : 24;

        this.dialogText = this.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: baseFontSize + 'px',
            color: '#66483c',
            lineSpacing: 4,
            align: 'center',
            wordWrap: { width: layout.bw - 32 }
        });
        this.dialogText.setOrigin(0, 0.5);
        this.dialogText.setDepth(61);
        this.dialogText.setAlpha(0);

        const message = "This port looks dreadful! It needs immediate repairs before I can even consider using it.";
        this.dialogText.setText(message);
        this.alignDialogueBlock();

        this.tweens.add({
            targets: [this.bubble, this.dialogText],
            alpha: 1,
            duration: 400,
            onComplete: () => {
                this.time.delayedCall(1800, () => {
                    this.interactionLocked = false;
                    this.showHelperFinger();
                });
            }
        });
    }

    updateDialogueText(message) {
        if (!this.dialogText || !this.bubble) return;

        this.dialogText.setText(message);
        this.alignDialogueBlock();

        this.dialogText.setAlpha(0);
        this.bubble.setAlpha(0);

        this.tweens.add({
            targets: [this.bubble, this.dialogText],
            alpha: 1,
            duration: 400,
            ease: 'Cubic.easeInOut'
        });
    }

    setUpgradeDialogue() {
        const messages = [
            "Better, but it's still just a shack. A real port needs a lookout tower!",
            "Now we’re talking! But look at that roof...\nIt's still broken. Let's make it grand!",
            "Incredible! This is the finest port in the whole kingdom. Great job! We must do more and do better!"
        ];
        const idx = this.buildLevel - 2;
        if (idx >= 0 && idx < messages.length) {
            this.fadeOutDialogue(() => {
                this.time.delayedCall(1000, () => {
                    this.updateDialogueText(messages[idx]);
                });
            });
        }
    }

    typeText(textObj, message, delayMs, cb) {
        if (!textObj) {
            if (cb) cb();
            return;
        }
        textObj.setText(message);
        textObj.setAlpha(1);
        this.bubble.setAlpha(1);
        if (cb) cb();
    }

    fadeOutDialogue(cb) {
        if (!this.dialogText || !this.bubble) {
            if (cb) cb();
            return;
        }
        this.tweens.add({
            targets: [this.bubble, this.dialogText],
            alpha: 0,
            duration: 300,
            onComplete: () => { if (cb) cb(); }
        });
    }

    setUpgradeDialogue() {
        const messages = [
            "Better, but it's still just a shack. A real port needs a lookout tower!",
            "Now we’re talking! But look at that roof...\nIt's still broken. Let's make it grand!",
            "Incredible! This is the finest port in the whole kingdom. Great job! We must do more and do better!"
        ];

        const idx = this.buildLevel - 2; 
        if (idx >= 0 && idx < messages.length) {
            this.fadeOutDialogue(() => {
                this.time.delayedCall(1000, () => {
                    this.typeText(this.dialogText, messages[idx], 25);
                });
            });
        }
    }

    

    showHelperFinger() {
        this.hideHelper();

        const bx = this.building.x + 418; // смещён правее
        const by = this.building.y + (this.building.displayHeight || 80) * 0.25;

        this.helperFinger = this.add.image(bx, by, 'helper_finger');
        this.helperFinger.setScale(4); // увеличен в 2 раза
        this.helperFinger.setDepth(100);

        // Плавная анимация с паузой и отскоком в левый верхний угол
        this.helperFingerTween = this.tweens.timeline({
            loop: -1,
            tweens: [
                {
                    targets: this.helperFinger,
                    x: bx - 90,
                    y: by - 90,
                    scaleX: this.helperFinger.scaleX * 0.75,
                    scaleY: this.helperFinger.scaleY * 0.75,
                    duration: 170,
                    ease: 'Cubic.easeOut'
                },
                {
                    targets: this.helperFinger,
                    x: bx - 18,
                    y: by - 18,
                    scaleX: this.helperFinger.scaleX * 0.88,
                    scaleY: this.helperFinger.scaleY * 0.88,
                    duration: 210,
                    ease: 'Back.easeOut',
                    offset: '+=120'
                },
                {
                    targets: this.helperFinger,
                    x: bx,
                    y: by,
                    scaleX: this.helperFinger.scaleX,
                    scaleY: this.helperFinger.scaleY,
                    duration: 180,
                    ease: 'Sine.easeOut',
                    offset: '+=130'
                },
                {
                    targets: this.helperFinger,
                    duration: 220,
                    onComplete: () => {}
                }
            ]
        });

        this.time.delayedCall(125, () => { this.interactionLocked = false; }); // показывает в 2 раза раньше
    }

    hideHelper() {
        if (this.helperFingerTween) { this.helperFingerTween.stop(); this.helperFingerTween = null; }
        if (this.helperFinger) { this.helperFinger.destroy(); this.helperFinger = null; }
    }

    alignDialogueBlock() {
        if (!this.bubble || !this.dialogText || !this.customer) return;

        const w = this.scale.width;
        const h = this.scale.height;
        const baseY = h - 20;

        const cW = (this.customer.displayWidth || this.customer.width || 0);
        const customerHalfHeight = (this.customer.displayHeight || this.customer.height || 0) * 0.5;

        const layout = this.getDialogueLayout();
        const customerX = layout.customerX;
        const bubbleX = layout.bubbleX;
        const bw = layout.bw;

        const raiseCustomerBy = 18; 
        const customerY = baseY + customerHalfHeight - raiseCustomerBy;
        this.customer.setPosition(customerX, customerY);

        const padding = 16;
        const textWidth = Math.max(120, bw - padding * 2);

        this.dialogText.setStyle({ wordWrap: { width: textWidth }, align: 'center' });

        const textHeight = this.dialogText.height;
        const minBubbleHeight = w >= 686 ? 80 : 80 * layout.scaleFactor;
        const bh = Math.max(textHeight + padding * 2, minBubbleHeight);
        const bubbleY = baseY - bh - 10;

        this.bubble.clear();

        this.bubble.fillStyle(0xffffff, 0.95);
        this.bubble.lineStyle(2, 0x444444, 1);
        const borderRadius = 44 * layout.scaleFactor;
        this.bubble.fillRoundedRect(bubbleX, bubbleY, bw, bh, borderRadius);
        this.bubble.strokeRoundedRect(bubbleX, bubbleY, bw, bh, borderRadius);
        this.bubble.fillTriangle(
            bubbleX + 8, bubbleY + bh * 0.3,
            bubbleX - 14 * layout.scaleFactor, bubbleY + bh * 0.5,
            bubbleX + 8, bubbleY + bh * 0.7
        );

        const baseFontSize = 54;
        const fontSize = Math.max(12, Math.floor(baseFontSize * layout.scaleFactor));
        this.dialogText.setFontSize(fontSize + 'px');

        
        const textX = bubbleX + bw / 2;
        const textY = bubbleY + bh / 2;
        this.dialogText.setPosition(textX, textY);
        this.dialogText.setOrigin(0.5, 0.5);

        setTimeout(() => {
            this.resize();
        }, 1);
    }

    

    handleBuildingClick() {
        if (this.interactionLocked) return;

        if (this.globalState.totalCoins < UPGRADE_COST || this.buildLevel >= MAX_BUILD_LEVEL) {
            this.showNotEnoughCoins();
            return;
        }

        this.interactionLocked = true;
        this.hideHelper();

        Utils.addAudio(this, 'click', 0.7);
        Utils.addAudio(this, 'money', 0.55);

        const startCoins = this.globalState.totalCoins;
        const endCoins = startCoins - UPGRADE_COST;

        this.animateCounter(startCoins, endCoins, 500);

        
        this.startRepairFX();

        this.flyCoinsToBuilding(20, () => {
            
            this.buildLevel++;
            this.updateBuildingTexture();

            const soundLevelIndex = Math.min(Math.max(this.buildLevel - 1, 1), 3);
            const soundKey = `merge_lvl_${soundLevelIndex}`;
            Utils.addAudio(this, soundKey, 0.5);

            this.finishRepairFX(() => {
                this.setUpgradeDialogue();
                this.time.delayedCall(500, () => this.showHelperFinger());
            });
        });
    }

    animateCounter(from, to, duration) {
        const proxy = { val: from };
        this.tweens.add({
            targets: proxy,
            val: to,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                this.globalState.totalCoins = Math.round(proxy.val);
                this.uiManager.coinText.setText(String(this.globalState.totalCoins));
            }
        });
    }

    flyCoinsToBuilding(count, onDone) {
        const src = this.uiManager.getCoinTargetPosition();
        const bW = this.building.displayWidth/2 || this.building.width/2 || 100;
        const bH = this.building.displayHeight/2 || this.building.height/2 || 100;
        let arrived = 0;

        for (let i = 0; i < count; i++) {
            const coin = this.add.image(src.x, src.y, 'gold_1')
                .setDepth(500);

            const sx = src.x;
            const sy = src.y;
            // распределяем приземление по площади здания
            const tx = this.building.x + (Math.random() - 0.5) * bW * 0.8;
            const ty = this.building.y + (Math.random() - 0.5) * bH * 0.6;
            const mx = (sx + tx) / 2 + (Math.random() - 0.5) * 100;
            const my = (sy + ty) / 2 - 50 - Math.random() * 40;

            this.tweens.add({
                targets: coin,
                scaleX: coin.scaleX * 0.5,
                scaleY: coin.scaleY * 0.5,
                duration: 420 + Math.random() * 120,
                delay: i * 45,
                ease: 'Power2',
                onUpdate: (tw) => {
                    const p = tw.progress;
                    const q = 1 - p;
                    coin.x = q * q * sx + 2 * q * p * mx + p * p * tx;
                    coin.y = q * q * sy + 2 * q * p * my + p * p * ty;
                },
                onComplete: () => {
                    coin.destroy();
                    arrived++;
                    if (arrived === count && onDone) onDone();
                }
            });
        }
    }

    

    
    startRepairFX() {
        const bx = this.building.x;
        const by = this.building.y;
        const bW = this.building.displayWidth || this.building.width;
        const bH = this.building.displayHeight || this.building.height;
        const dur = 1500; 

        

        this._repairDusts = [];
        for (let i = 0; i < 22; i++) {
            const dx = bx + (Math.random() - 0.5) * bW * 0.5;
            const dy = by + (Math.random() - 0.5) * bH * 0.5;
            const d = this.add.image(dx, dy, 'dust')
                .setDepth(200)
                .setAlpha(0)
                .setScale(2.35 + Math.random() * 0.2);
            this._repairDusts.push(d);
            this.tweens.add({
                targets: d,
                alpha: { from: 0.2, to: 0.95 },
                scaleX: d.scaleX * 2.2,
                scaleY: d.scaleY * 2.2,
                angle: (Math.random() - 0.5) * 120,
                y: dy - 30 - Math.random() * 30,
                duration: dur * 0.45,
                delay: i * 15,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onComplete: () => { if (d && d.active) d.destroy(); }
            });
        }

        const screenW = this.cameras.main.width;
        const margin = 20;
        const strikeDuration = 160;
        const strikeCycle = 320;
        const steps = 4;

        const makeHammer = () => this.add.image(bx, by, 'hammer')
            .setDepth(210).setScale(2.4).setAlpha(0);

        const getRandomPos = (isRightSide) => {
            const xOffset = (0.05 + Math.random() * 0.15) * bW;
            let x = bx + (isRightSide ? xOffset : -xOffset);
            x = Math.max(margin, Math.min(x, screenW - margin));
            const y = by - bH * 0.15 + Math.random() * bH * 0.3;
            return { x, y };
        };

        const doStrike = (hammer, isRightSide, stepNum, totalSteps) => {
            if (stepNum >= totalSteps) { hammer.destroy(); return; }
            const pos = getRandomPos(isRightSide);
            hammer.setPosition(pos.x, pos.y);
            hammer.setAlpha(0.9);
            hammer.setFlipX(!isRightSide);
            hammer.setAngle(isRightSide ? 25 : -25);
            const startAngle = hammer.angle;
            if (this._hammerSound) this._hammerSound();
            this.tweens.add({
                targets: hammer,
                angle: startAngle + (isRightSide ? -55 : 55),
                yoyo: true,
                duration: strikeDuration,
                ease: 'Quad.easeInOut',
                onComplete: () => {
                    hammer.setAlpha(0);
                    this.time.delayedCall(strikeCycle - strikeDuration * 2, () => {
                        doStrike(hammer, !isRightSide, stepNum + 1, totalSteps);
                    });
                }
            });
        };

        const h1 = makeHammer();
        const h2 = makeHammer();
        doStrike(h1, false, 0, steps);
        this.time.delayedCall(strikeCycle / 2, () => doStrike(h2, true, 0, steps));

        
        const hammerSound = () => Utils.addAudio(this, 'merge_fail', 0.5);
        this._hammerSound = hammerSound;
    }

    
    finishRepairFX(onDone) {
        const bx = this.building.x;
        const by = this.building.y;
        const finDur = 700; 

        
        const curKey = BUILD_LEVELS[this.buildLevel - 1];
        const prevKey = BUILD_LEVELS[this.buildLevel - 2];
        let ghost = null;
        if (prevKey && this.textures.exists(prevKey)) {
            ghost = this.add.image(bx, by, prevKey)
                .setDepth(this.building.depth - 1)
                .setAlpha(0.6)
                .setScale(this.building.scaleX, this.building.scaleY);
        }

        
        this.building.setAlpha(0);
        this.tweens.add({
            targets: this.building,
            alpha: 1,
            duration: finDur * 0.5,
            ease: 'Sine.easeOut'
        });

        if (ghost) {
            this.tweens.add({
                targets: ghost,
                alpha: 0,
                duration: finDur * 0.5,
                ease: 'Sine.easeIn',
                onComplete: () => ghost.destroy()
            });
        }

        this.time.delayedCall(finDur, () => {
            if (onDone) onDone();
        });
    }

    updateBuildingTexture() {
        if (this.buildLevel < 1 || this.buildLevel > MAX_BUILD_LEVEL) return;
        const key = BUILD_LEVELS[this.buildLevel - 1];
        if (this.textures.exists(key)) {
            this.building.setTexture(key);
        }
    }

    

    showNotEnoughCoins() {
        this.interactionLocked = true;
        this.hideHelper();

        Utils.addAudio(this, 'order_give', 0.6);
        this.shakeCoinUI();

        const w = this.scale.width;
        const h = this.scale.height;

        const ebX = w * 0.12;
        const ebY = h * 0.34;
        const ebW = w * 0.76;
        const ebH = h * 0.09;

        const errBubble = this.add.graphics().setDepth(300);
        errBubble.fillStyle(0xffffff, 0.95);
        errBubble.lineStyle(2, 0xcc0000, 1);
        errBubble.fillRoundedRect(ebX, ebY, ebW, ebH, 14);
        errBubble.strokeRoundedRect(ebX, ebY, ebW, ebH, 14);
        errBubble.setAlpha(0);

        const errFontSize = Math.max(16, Math.floor(w * 0.038));
        const errText = this.add.text(w / 2, ebY + ebH / 2, 'Not enough coins for this upgrade!', {
            fontFamily: 'Arial',
            fontSize: errFontSize + 'px',
            color: '#cc0000',
            stroke: '#ffffff',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(301).setAlpha(0);

        this.tweens.add({
            targets: [errBubble, errText],
            alpha: 1,
            duration: 200
        });

        
        this.updateDialogueText("We need more gold to expand further. Go earn some coins!");

        this.time.delayedCall(2500, () => {
            this.tweens.add({
                targets: [errBubble, errText],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    errBubble.destroy();
                    errText.destroy();
                    this.interactionLocked = false;
                }
            });
        });
    }

    shakeCoinUI() {
        const icon = this.uiManager.coinIcon;
        const text = this.uiManager.coinText;
        if (!icon || !text) return;

        const ox = icon.x;
        const otx = text.x;

        this.tweens.add({
            targets: icon, x: ox + 4,
            duration: 50, yoyo: true, repeat: 5,
            ease: 'Sine.easeInOut',
            onComplete: () => { icon.x = ox; }
        });
        this.tweens.add({
            targets: text, x: otx + 4,
            duration: 50, yoyo: true, repeat: 5,
            ease: 'Sine.easeInOut',
            onComplete: () => { text.x = otx; }
        });
    }
}

