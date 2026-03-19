export default class InputSystem {
    constructor(scene, gridSystem, boardContainer, globalState) {
        this.scene = scene;
        this.grid = gridSystem;
        this.boardContainer = boardContainer;
        this.globalState = globalState;

        this.dragItem = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        /** @type {function(Object,Object):boolean|null} */
        this.onMergeAttempt = null;
        /** @type {function():void|null} */
        this.onInputActivity = null;
    }

    init() {
        this.scene.input.on('pointerdown', this.onPointerDown, this);
        this.scene.input.on('pointermove', this.onPointerMove, this);
        this.scene.input.on('pointerup',   this.onPointerUp,   this);
    }

    /* Convert pointer (game-pixel coords) → board-local coords */
    pointerToBoardLocal(pointer) {
        const mc = this.scene.mainContainer;
        const bc = this.boardContainer;
        const lx = (pointer.x - mc.x) / mc.scaleX;
        const ly = (pointer.y - mc.y) / mc.scaleY;
        return {
            x: (lx - bc.x) / bc.scaleX,
            y: (ly - bc.y) / bc.scaleY
        };
    }

    onPointerDown(pointer) {
        this.globalState.lastInputTime = Date.now();
        if (this.onInputActivity) this.onInputActivity();

        const local = this.pointerToBoardLocal(pointer);
        const cellPos = this.grid.pointToCell(local.x, local.y);
        if (!cellPos) return;

        const cell = this.grid.getCell(cellPos.col, cellPos.row);
        if (!cell || !cell.item) return;

        const item = cell.item;
        this.dragItem = item;
        item.isDragging = true;
        item.originCol = item.col;
        item.originRow = item.row;

        // Detach from cell
        cell.item = null;

        // Lift to mainContainer so dragged item renders above all other containers
        const bc = this.boardContainer;
        const mc = this.scene.mainContainer;
        const bx = this.grid.cellToX(item.col);
        const by = this.grid.cellToY(item.row);
        bc.remove(item.sprite, false);
        mc.add(item.sprite);
        item.sprite.setPosition(bx * bc.scaleX + bc.x, by * bc.scaleY + bc.y);
        item.sprite.setDepth(100);

        this.dragOffsetX = bx - local.x;
        this.dragOffsetY = by - local.y;
    }

    onPointerMove(pointer) {
        if (!this.dragItem) return;
        this.globalState.lastInputTime = Date.now();

        const local = this.pointerToBoardLocal(pointer);
        const bc = this.boardContainer;
        this.dragItem.sprite.setPosition(
            (local.x + this.dragOffsetX) * bc.scaleX + bc.x,
            (local.y + this.dragOffsetY) * bc.scaleY + bc.y
        );
    }

    onPointerUp(pointer) {
        if (!this.dragItem) return;
        this.globalState.lastInputTime = Date.now();

        const local = this.pointerToBoardLocal(pointer);
        const targetPos = this.grid.pointToCell(
            local.x + this.dragOffsetX,
            local.y + this.dragOffsetY
        );

        const item = this.dragItem;
        item.isDragging = false;
        this.dragItem = null;

        // Return sprite to boardContainer before placement / snap-back
        const mc = this.scene.mainContainer;
        const bc = this.boardContainer;
        mc.remove(item.sprite, false);
        bc.add(item.sprite);

        let handled = false;
        if (targetPos) {
            const targetCell = this.grid.getCell(targetPos.col, targetPos.row);
            if (targetCell && this.onMergeAttempt) {
                handled = this.onMergeAttempt(item, targetCell);
            }
        }

        if (!handled) {
            // Snap back to origin
            this.grid.placeItem(item, item.originCol, item.originRow);
        }
    }
}
