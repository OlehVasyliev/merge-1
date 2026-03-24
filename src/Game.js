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
        this.mainContainer.add(this.boardContainer);
    }

    createCustomerArea() {
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

        this.customerSystem.onOrderFulfilled = () => {
            this.helperSystem.clearCustomerOrder();
            this.economySystem.processOrder();
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


