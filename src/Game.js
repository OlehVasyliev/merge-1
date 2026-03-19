import ParentScene from "../core/framework/components/Scene";
import Background from "./Background";
import Config from "./ecs/MergeConfig";
import { createGlobalState } from "./ecs/Components";
import GridSystem from "./systems/GridSystem";
import InputSystem from "./systems/InputSystem";
import MergeSystem from "./systems/MergeSystem";
import CustomerSystem from "./systems/CustomerSystem";
import HelperSystem from "./systems/HelperSystem";

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

        setTimeout(() => {
            this.handleResize();
            this.scale.on("resize", () => {
                if (this._resizeFromSelf) return;
                setTimeout(() => this.handleResize(), 11);
            });
        }, 11);
    }

    /* ---- Layout ---- */

    createBoard() {
        const gridW = Config.COLS * Config.CELL_SIZE;
        const gridH = Config.ROWS * Config.CELL_SIZE;

        this.boardContainer = this.add.container(0, 0);
        this.boardContainer.addProperties(["pos", "scale"]);
        this.boardContainer.setCustomPosition(0, 0).setAlign("Bottom");
        this.boardContainer.setDepth(10);

        // Calculate scale in the game's designed coordinate space (scaled by game.size.scale)
        // so that the board fills the visible width, and its height stays <= 80% of the visible height.
        const availW = this.game.size.right - this.game.size.left;
        const availH = this.game.size.bottom - this.game.size.top;
        const maxBoardH = availH * 0.75;
        const scaleW = availW / gridW;
        const scaleH = maxBoardH / gridH;
        const boardScale = Math.min(scaleW, scaleH);

        this.boardContainer.px = 0;
        // Position the board so its bottom edge is flush with the screen bottom.
        // The visual height includes a small background padding (+20), so compute half-height
        // in container-local units and offset upward (negative py) by that amount.
        this.boardContainer.py = -((Config.ROWS * Config.CELL_SIZE + 20) * boardScale) / 2;
        this.boardContainer.lx = 0;
        this.boardContainer.ly = 0;
        this.boardContainer.pScaleX = boardScale;
        this.boardContainer.pScaleY = boardScale;
        this.boardContainer.lScaleX = boardScale;
        this.boardContainer.lScaleY = boardScale;


        // Underlay behind the board (full screen width, height matches board_bg)
        const underlayWidth = availW / boardScale;
        const underlayHeight = gridH + 20;
        this.boardUnderlay = this.add.graphics({ x: 0, y: 0 });
        this.boardUnderlay.fillStyle(0x9eb982, 1);
        this.boardUnderlay.fillRect(-underlayWidth / 2, -underlayHeight / 2, underlayWidth, underlayHeight);
        this.boardUnderlay.setDepth(-3);
        this.boardContainer.add(this.boardUnderlay);

        // Board background (behind cells)
        this.boardBg = this.add.image(0, 0, 'board_bg')
            .setDisplaySize(gridW + 20, gridH + 20)
            .setDepth(-2);
        this.boardContainer.add(this.boardBg);

        // Table (behind the board but above the board background)
        const tableTex = this.textures.get('table');
        const tableImage = this.add.image(0, 0, 'table');
        const topOfBoard = -((gridH) / 2);

        if (tableTex && tableTex.getSourceImage) {
            const source = tableTex.getSourceImage();
            const tableW = availW / boardScale;
            const tableH = source && source.height ? source.height : 200;
            tableImage.setDisplaySize(tableW, tableH);

            // Position table above the board: table's bottom aligns with board top
            tableImage.setPosition(0, topOfBoard - tableH / 2);

            this.tableHeight = tableH;
            this.tableTopY = topOfBoard - tableH;
        } else {
            // Fallback: stretch to full width of the board container
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
        const customerHeight = availH * 0.2;

        this.customerContainer.px = 0;
        this.customerContainer.py = customerHeight / 2;
        this.customerContainer.lx = 0;
        this.customerContainer.ly = customerHeight / 2;
        this.customerContainer.pScaleX = 1;
        this.customerContainer.pScaleY = 1;
        this.customerContainer.lScaleX = 0.8;
        this.customerContainer.lScaleY = 0.8;
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

    /* ---- Systems wiring ---- */

    initSystems() {
        // Grid
        this.gridSystem = new GridSystem(this, this.boardContainer);
        this.gridSystem.init();
        // Merge
        this.mergeSystem = new MergeSystem(this, this.gridSystem, this.boardContainer);
        this.mergeSystem.onMergeSuccess = () => {
            this.customerSystem.checkOrder(this.gridSystem);
        };

        // Helper (customer hints)
        this.helperSystem = new HelperSystem(this, this.gridSystem, this.boardContainer, this.globalState);
        this.helperSystem.init();

        // Input
        this.inputSystem = new InputSystem(this, this.gridSystem, this.boardContainer, this.globalState);
        this.inputSystem.onMergeAttempt = (dragItem, targetCell) => {
            return this.mergeSystem.tryMerge(dragItem, targetCell);
        };
        this.inputSystem.onInputActivity = () => {
            this.helperSystem.resetIdle();
        };
        this.inputSystem.init();

        // Customer
        this.customerSystem = new CustomerSystem(this, this.customerContainer, this.boardContainer, this.tableTopY, this.tableHeight);
        this.customerSystem.onOrderFulfilled = () => {
            this.helperSystem.clearCustomerOrder();
            this.customerSystem.fulfillOrder(this.gridSystem);
            this.globalState.ordersCompleted++;
            if (this.globalState.ordersCompleted >= Config.CTA_AFTER_ORDERS) {
                this.showCTA();
            }
        };
        this.customerSystem.onNewCustomer = (type, level) => {
            this.helperSystem.setCustomerOrder(type, level);
        };
        this.customerSystem.onOrderStatusChanged = (isSatisfied, button) => {
            if (isSatisfied) {
                this.helperSystem.pointToGiveButton(button);
            } else {
                this.helperSystem.clearCustomerOrder();
            }
        };
        this.customerSystem.init();
        this.customerSystem.checkOrder(this.gridSystem);
    }

    /* ---- CTA ---- */

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

    /* ---- Resize ---- */

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
            const maxBoardH = availH * 0.8;
            const scaleW = availW / gridW;
            const scaleH = maxBoardH / gridH;
            const boardScale = Math.min(scaleW, scaleH);

            this.boardContainer.pScaleX = boardScale;
            this.boardContainer.pScaleY = boardScale;
            this.boardContainer.lScaleX = boardScale;
            this.boardContainer.lScaleY = boardScale;

            const yOffset = -((gridH + 20) * boardScale) / 2;
            this.boardContainer.py = yOffset;
            this.boardContainer.ly = yOffset;
            // Resize underlay + table to new width (keep table height original texture height)
            const underlayWidth = availW / boardScale;
            const underlayHeight = gridH + 20;
            if (this.boardUnderlay) {
                this.boardUnderlay.clear();
                this.boardUnderlay.fillStyle(0x9eb982, 1);
                this.boardUnderlay.fillRect(-underlayWidth / 2, -underlayHeight / 2, underlayWidth, underlayHeight);
            }

            if (this.tableImage) {
                const tableTex = this.textures.get('table');
                const tableH = tableTex && tableTex.getSourceImage ? tableTex.getSourceImage().height : this.tableHeight || 200;
                this.tableImage.setDisplaySize(underlayWidth, tableH);

                const topOfBoard = -((gridH + 20) / 2);
                this.tableImage.setPosition(0, topOfBoard - tableH / 2);

                this.tableHeight = tableH;
                this.tableTopY = topOfBoard - tableH;
            }        }

        if (this.customerContainer) {
            const availH = this.game.size.bottom - this.game.size.top;
            const customerHeight = availH * 0.2;
            this.customerContainer.py = customerHeight / 2;
            this.customerContainer.ly = customerHeight / 2;
        }

        this._resizeFromSelf = true;
        this.game.size.resize();
        this._resizeFromSelf = false;
        this._inResize = false;
    }
}

