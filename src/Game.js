import ParentScene from "../core/framework/components/Scene";
import Background from "./Background";
import Config from "./ecs/MergeConfig";
import Utils from "../core/framework/Utils";
import { createGlobalState } from "./ecs/Components";
import GridSystem from "./systems/GridSystem";
import InputSystem from "./systems/InputSystem";
import MergeSystem from "./systems/MergeSystem";
import CustomerSystem from "./systems/CustomerSystem";
import HelperSystem from "./systems/HelperSystem";
import UIManager from "./systems/UIManager";
import EconomySystem from "./systems/EconomySystem";

export default class Game extends ParentScene {
    create() {
        this.globalState = createGlobalState(Config.IDLE_THRESHOLD);
        this.ctaShown = false;
        this.initScene();
    }

    initScene() {
        this.createCustomerArea();
        this.createBoard();
        this.createCTA();
        this.createFinalPopup();
        this.initSystems();

        Utils.addAudio(this, 'music_bg', 1.0, true);

        setTimeout(() => {
            this.handleResize();
            this.scale.on("resize", () => {
                if (this._resizeFromSelf) return;
                setTimeout(() => this.handleResize(), 11);
            });
        }, 11);
    }

    

    createBoard() {
        const gridW = Config.COLS * Config.CELL_SIZE;
        const gridH = Config.ROWS * Config.CELL_SIZE;

        this.boardContainer = this.add.container(0, 0);
        this.boardContainer.addProperties(["pos", "scale"]);
        this.boardContainer.setCustomPosition(0, 0).setAlign("Bottom");
        this.boardContainer.setDepth(10);


        const UNDERLAY_RATIO = Config.UNDERLAY_RATIO;
        const availW = this.game.size.right - this.game.size.left;
        const availH = this.game.size.bottom - this.game.size.top;
        const usableW = availW * 0.95;
        const maxBoardH = availH * UNDERLAY_RATIO;
        const scaleW = usableW / gridW;
        const scaleH = maxBoardH / gridH;
        const boardScale = Math.min(scaleW, scaleH);

        this.boardContainer.px = 0;

        const targetUnderlayDrawHeight = availH * UNDERLAY_RATIO;
        const boardBottomPadding = Config.BOARD_BOTTOM_PADDING || 40;

        // смещаем игровое поле вверх от нижнего края на boardBottomPadding
        const yOffset = -((gridH + 15) / 2 * boardScale + boardBottomPadding);
        this.boardContainer.py = yOffset;
        this.boardContainer.ly = yOffset;
        this.boardContainer.pScaleX = boardScale;
        this.boardContainer.pScaleY = boardScale;
        this.boardContainer.lScaleX = boardScale;
        this.boardContainer.lScaleY = boardScale;
        this.boardContainer.lx = 0;
        this.boardContainer.ly = yOffset;

        // green underlay is kept in boardContainer so it can reach the top of the board
        this.boardUnderlay = this.add.graphics();
        this.boardUnderlay.setDepth(-3);
        this.boardContainer.add(this.boardUnderlay);

        this.boardBg = this.add.image(0, 0, 'board_bg')
            .setDisplaySize(gridW + 22, gridH + 15)
            .setDepth(-2);
        this.boardContainer.add(this.boardBg);

        const boardTopY = -(gridH + 15) / 2;
        const boardBottomY = (gridH + 15) / 2;
        const underlayHeightLocal = (gridH + 15) + 80; // extra coverage under board
        this.boardUnderlay.clear();
        this.boardUnderlay.fillStyle(0x9eb982, 1);
        this.boardUnderlay.fillRect(-availW / 2 / boardScale, boardTopY, availW / boardScale, underlayHeightLocal); // width in local units, to cover full width after board scale

        const tableTex = this.textures.get('table');
        const tableImage = this.add.image(0, 10, 'table');
        const topOfBoard = -((gridH) / 2);

        if (tableTex && tableTex.getSourceImage) {
            const source = tableTex.getSourceImage();
            const tableW = availW / boardScale;
            const tableH = source && source.height ? source.height : 200;
            tableImage.setDisplaySize(tableW, tableH);

            tableImage.setPosition(0, topOfBoard - tableH / 2);

            this.tableHeight = tableH;
            this.tableTopY = topOfBoard - tableH - 10;
        } else {

            const tableH = 200;
            tableImage.setDisplaySize(gridW + 20, tableH);
            tableImage.setPosition(0, topOfBoard - tableH / 2);

            this.tableHeight = tableH;
            this.tableTopY = topOfBoard - tableH;
        }

        tableImage.setDepth(-1);
        this.tableImage = tableImage;
        this.boardContainer.add(this.tableImage);

        this.updateCustomerBgSize();

        this.mainContainer.add(this.boardContainer);
    }

    createCustomerArea() {
        // Фон позади кастомера (customer_bg), масштабируется на ширину экрана,
        // высота от топа до верхнего края стола.
        this.customerBg = this.add.image(0, 0, 'customer_bg')
            .setOrigin(0.5, 0)
            .setDepth(-5);

        // Нужные свойства, чтобы App.scaleContainer не затирал позицию в процессе resize
        this.customerBg.addProperties(["pos", "scale"]);
        this.customerBg.setCustomPosition(0, 0).setAlign("Top");
        this.customerBg.px = 0;
        this.customerBg.py = 0;
        this.customerBg.lx = 0;
        this.customerBg.ly = 0;
        this.customerBg.pScaleX = 1;
        this.customerBg.pScaleY = 1;
        this.customerBg.lScaleX = 1;
        this.customerBg.lScaleY = 1;

        this.mainContainer.add(this.customerBg);
        this.updateCustomerBgSize();

        this.customerContainer = this.add.container(0, 0);
        this.customerContainer.addProperties(["pos", "scale"]);
        this.customerContainer.setCustomPosition(0, 0).setAlign("Top");
        this.customerContainer.setDepth(0);

        const availH = this.game.size.bottom - this.game.size.top;
        const customerHeightRatio = Config.CUSTOMER_HEIGHT_RATIO;
        const customerHeight = availH * customerHeightRatio;
        const customerScale = customerHeight / Config.CUSTOMER_BASE_HEIGHT;

        this.customerContainer.px = 0;
        this.customerContainer.py = customerHeight / 2;
        this.customerContainer.lx = 0;
        this.customerContainer.ly = customerHeight / 2;
        this.customerContainer.pScaleX = customerScale;
        this.customerContainer.pScaleY = customerScale;
        this.customerContainer.lScaleX = customerScale;
        this.customerContainer.lScaleY = customerScale;
        this.mainContainer.add(this.customerContainer);
    }

    updateCustomerBgSize() {
        if (!this.customerBg) return;

        const topY = this.game.size.top;
        const targetY = this.tableImage ? this.tableImage.getBounds().top : this.game.size.bottom;
        const width = this.game.size.right - this.game.size.left;
        const height = Math.max(0, targetY - topY);

        this.customerBg
            .setPosition(this.game.size.x, topY)
            .setDisplaySize(width, height);
    }

    createCTA() {
        this.ctaButton = this.add.image(0, 0, 'btnFin')
            .setDisplaySize(200, 70)
            .setDepth(30)
            .setAlpha(0)
            .setInteractive();
        this.ctaButton.addProperties(["pos", "scale"]);
        this.ctaButton.setCustomPosition(0, 0).setAlign("Center");
        this.ctaButton.px = 0;
        this.ctaButton.py = 0;
        this.ctaButton.lx = 0;
        this.ctaButton.ly = 0;
        this.ctaButton.pScaleX = 1;
        this.ctaButton.pScaleY = 1;
        this.ctaButton.lScaleX = 1;
        this.ctaButton.lScaleY = 1;
        this.ctaButton.on('pointerdown', () => {
            if (window.App.network) window.App.network.ctaClick();
        });
        this.mainContainer.add(this.ctaButton);
    }

    createFinalPopup() {
        this.finalPopupContainer = this.add.container(0, 0);
        this.finalPopupContainer.addProperties(["pos", "scale"]);
        this.finalPopupContainer.setCustomPosition(0, 0).setAlign("Center");
        this.finalPopupContainer.setDepth(1000);
        this.finalPopupContainer.setVisible(false);

        this.popupOverlay = this.add.rectangle(0, 0, 4000, 4000, 0x000000, 0.7);
        this.popupOverlay.setInteractive();
        this.finalPopupContainer.add(this.popupOverlay);

        this.popupContent = this.add.container(0, 0);
        this.finalPopupContainer.add(this.popupContent);

        this.finalCard = this.add.image(0, 0, 'final_card');
        this.popupContent.add(this.finalCard);

        const cW = this.finalCard.width || 800;
        const cH = this.finalCard.height || 1000;

        // Кнопка 40% от ширины карточки с сохранением пропорций
        const btnTargetW = cW * 0.4;
        const btnNativeW = 400; // fallback, реальный размер узнаём после добавления
        const btnY = cH * 0.25;

        this.continueBtn = this.add.image(0, btnY, 'btn_continue');
        const btnScale = btnTargetW / (this.continueBtn.width || btnNativeW);
        this.continueBtn.setScale(btnScale);
        this.continueBtn.setInteractive();
        this.continueBtn.on('pointerdown', () => {
            this.game.network.complete();
            this.game.network.openStore();
        });
        this.popupContent.add(this.continueBtn);

        this.popupFinger = this.add.image(0, btnY, 'helper_finger').setOrigin(0.2, 0.1).setAlpha(0).setScale(3.2);
        this.popupContent.add(this.popupFinger);

        this.mainContainer.add(this.finalPopupContainer);
    }

    showFinalPopup() {
        if (this.isFinalPopupShown) return;
        this.isFinalPopupShown = true;

        // Блокируем все хелперы на доске — ни мерж-подсказок, ни кнопки give
        if (this.helperSystem) {
            this.helperSystem.locked = true;
            this.helperSystem.clearHint();
        }

        this.finalPopupContainer.setVisible(true);
        this.popupContent.setScale(0);
        this.popupOverlay.setAlpha(0);

        this.tweens.add({
            targets: this.popupOverlay,
            alpha: 0.7,
            duration: 300
        });

        const btnBaseScaleX = this.continueBtn.scaleX;
        const btnBaseScaleY = this.continueBtn.scaleY;

        this.tweens.add({
            targets: this.popupContent,
            scaleX: 1,
            scaleY: 1,
            duration: 600,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: this.continueBtn,
                    scaleX: btnBaseScaleX * 1.06,
                    scaleY: btnBaseScaleY * 1.06,
                    yoyo: true,
                    repeat: -1,
                    duration: 600
                });

                this.time.delayedCall(2000, () => {
                    this.popupFinger.setAlpha(1);
                    const fx = this.continueBtn.x + this.continueBtn.displayWidth * 0.2;
                    const fy = this.continueBtn.y + this.continueBtn.displayHeight * 0.15;
                    this.popupFinger.setPosition(fx, fy);
                    const baseScale = 3.2;
                    this.tweens.add({
                        targets: this.popupFinger,
                        scaleX: baseScale * 0.82,
                        scaleY: baseScale * 0.82,
                        yoyo: true,
                        repeat: -1,
                        duration: 400
                    });
                });
            }
        });
    }

    

    initSystems() {

        this.gridSystem = new GridSystem(this, this.boardContainer);
        this.gridSystem.init();

        this.mergeSystem = new MergeSystem(this, this.gridSystem, this.boardContainer);
        this.mergeSystem.onMergeSuccess = () => {
            this.customerSystem.checkOrder(this.gridSystem);
        };

        this.helperSystem = new HelperSystem(this, this.gridSystem, this.boardContainer, this.globalState);
        this.helperSystem.init();

        this.inputSystem = new InputSystem(this, this.gridSystem, this.boardContainer, this.globalState);
        this.inputSystem.onMergeAttempt = (dragItem, targetCell) => {
            return this.mergeSystem.tryMerge(dragItem, targetCell);
        };
        this.inputSystem.onInputActivity = () => {
            this.helperSystem.resetIdle();
        };
        this.inputSystem.init();

        this.customerSystem = new CustomerSystem(this, this.customerContainer, this.boardContainer, this.tableTopY, this.tableHeight);
        this.customerSystem.gridSystem = this.gridSystem;
        this.customerSystem.globalState = this.globalState;

        this.uiManager = new UIManager(this, this.globalState);
        this.uiManager.init();

        this.economySystem = new EconomySystem(this, this.gridSystem, this.customerSystem, this.uiManager, this.globalState);
        this.economySystem.init();

        this.fulfilledOrdersCount = 0;
        this.customerSystem.onOrderFulfilled = () => {
            this.helperSystem.clearCustomerOrder();
            this.economySystem.processOrder();

            this.fulfilledOrdersCount++;
            if (this.fulfilledOrdersCount >= 3) {
                this.time.delayedCall(1500, () => {
                    this.showFinalPopup();
                });
            }
        };

        this.customerSystem.onNewCustomer = (type, level) => {
            this.helperSystem.setCustomerOrder(type, level);
        };

        this.customerSystem.onOrderStatusChanged = (isSatisfied, button) => {
            if (isSatisfied) {
                this.helperSystem.pointToGiveButton(button);
            } else if (!this.helperSystem.onlyPointToGiveButton) {
                const req = this.customerSystem.getMissingRequirement(this.gridSystem);
                if (req && (this.helperSystem.customerTargetType !== req.productType || 
                            this.helperSystem.customerTargetLevel !== req.targetLevel || 
                            !this.helperSystem.customerWaiting || 
                            this.helperSystem.isPointingAtButton)) {
                    this.helperSystem.isPointingAtButton = false;
                    this.helperSystem.setCustomerOrder(req.productType, req.targetLevel);
                }
            }
        };

        this.customerSystem.init();
        this.customerSystem.checkOrder(this.gridSystem);
    }

    

    showCTA() {
        if (this.ctaShown) return;
        this.ctaShown = true;
        this.tweens.add({
            targets: this.ctaButton,
            alpha: 1,
            duration: 400,
            ease: 'Cubic'
        });
    }

    

    handleResize() {
        if (this._inResize) return;
        this._inResize = true;

        if (this.helperSystem) {
            this.helperSystem._resizing = true;
            this.helperSystem.clearHint();
            if (this._resizeHelperTimeout) {
                clearTimeout(this._resizeHelperTimeout);
            }
            this._resizeHelperTimeout = setTimeout(() => {
                this._resizeHelperTimeout = null;
                if (!this.helperSystem) return;
                const btn = this.customerSystem && this.customerSystem.isSatisfied ? this.customerSystem.giveButton : null;
                console.log('[Game] Resize: restoring helper after 1s...');
                this.helperSystem.restoreAfterResize(btn);
            }, 1000);
        }

        const isPortrait = this.scale.height > this.scale.width;
        this.game.size.isPortrait = isPortrait;

        if (this.boardContainer) {
            const gridW = Config.COLS * Config.CELL_SIZE;
            const gridH = Config.ROWS * Config.CELL_SIZE;
            const availW = this.game.size.right - this.game.size.left;
            const availH = this.game.size.bottom - this.game.size.top;
            const usableW = availW * 0.95;
            const UNDERLAY_RATIO = Config.UNDERLAY_RATIO;
            const maxBoardH = availH * UNDERLAY_RATIO;
            const scaleW = usableW / gridW;
            const scaleH = maxBoardH / gridH;
            const boardScale = Math.min(scaleW, scaleH);

            this.boardContainer.pScaleX = boardScale;
            this.boardContainer.pScaleY = boardScale;
            this.boardContainer.lScaleX = boardScale;
            this.boardContainer.lScaleY = boardScale;

            const targetUnderlayDrawHeight = availH * UNDERLAY_RATIO;
            const boardBottomPadding = Config.BOARD_BOTTOM_PADDING || 40;
            const yOffset = -((gridH + 15) / 2 * boardScale + boardBottomPadding);
            this.boardContainer.py = yOffset;
            this.boardContainer.ly = yOffset;
            const underlayHeight = targetUnderlayDrawHeight + boardBottomPadding;
            if (this.boardUnderlay) {
                this.boardUnderlay.clear();
                this.boardUnderlay.fillStyle(0x9eb982, 1);

                const boardTopY = -(gridH + 15) / 2;
                const underlayHeightLocal = (gridH + 15) + 80;
                this.boardUnderlay.fillRect(-availW / 2 / boardScale, boardTopY, availW / boardScale, underlayHeightLocal);
            }

            const underlayWidth = availW / boardScale;
            if (this.tableImage) {
                const tableTex = this.textures.get('table');
                const tableH = tableTex && tableTex.getSourceImage ? tableTex.getSourceImage().height : this.tableHeight || 200;
                this.tableImage.setDisplaySize(underlayWidth, tableH);

                const topOfBoard = -((gridH + 20) / 2);
                this.tableImage.setPosition(0, (topOfBoard - tableH / 2) + 3);

                this.tableHeight = tableH;
                this.tableTopY = topOfBoard - tableH;
            }        }

        if (this.finalPopupContainer && this.finalCard) {
            const availW = this.game.size.right - this.game.size.left;
            const availH = this.game.size.bottom - this.game.size.top;
            
            const cardW = this.finalCard.width || 800;
            const cardH = this.finalCard.height || 1000;
            
            const sScale = Math.min((availW * 0.9) / cardW, (availH * 0.8) / cardH);
            
            this.finalPopupContainer.pScaleX = sScale;
            this.finalPopupContainer.pScaleY = sScale;
            this.finalPopupContainer.lScaleX = sScale;
            this.finalPopupContainer.lScaleY = sScale;
            this.finalPopupContainer.px = 0;
            this.finalPopupContainer.py = 0;
            this.finalPopupContainer.lx = 0;
            this.finalPopupContainer.ly = 0;
        }

        if (this.customerContainer) {
            const availH = this.game.size.bottom - this.game.size.top;
            const customerHeightRatio = Config.CUSTOMER_HEIGHT_RATIO;
            const customerHeight = availH * customerHeightRatio;
            const customerScale = customerHeight / Config.CUSTOMER_BASE_HEIGHT;

            this.customerContainer.py = customerHeight / 2;
            this.customerContainer.ly = customerHeight / 2;
            this.customerContainer.pScaleX = customerScale;
            this.customerContainer.pScaleY = customerScale;
            this.customerContainer.lScaleX = customerScale;
            this.customerContainer.lScaleY = customerScale;
        }

        this.updateCustomerBgSize();

        this._resizeFromSelf = true;
        this.game.size.resize();
        this._resizeFromSelf = false;
        this._inResize = false;
    }

    update(time, delta) {
        if (this.customerSystem && this.customerSystem.update) {
            this.customerSystem.update(time, delta);
        }
    }
}


