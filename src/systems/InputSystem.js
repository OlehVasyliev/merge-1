import Utils from '../../core/framework/Utils';

export default class InputSystem {
    constructor(scene, gridSystem, boardContainer, globalState) {
        this.scene = scene;
        this.grid = gridSystem;
        this.boardContainer = boardContainer;
        this.globalState = globalState;

        this.dragItem = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.dragSound = null;
        this.shakeTweens = [];
        this.activeShakeTargets = new Set();
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
        
        Utils.addAudio(this.scene, 'click', 0.4);

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

        // Loop drag sound while item is being dragged
        if (this.dragSound) {
            this.dragSound.stop();
            this.dragSound.destroy();
        }
        this.dragSound = Utils.addAudio(this.scene, 'drag-and-drop', 2.5, true);

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

        const targetPos = this.grid.pointToCell(
            local.x + this.dragOffsetX,
            local.y + this.dragOffsetY
        );

        if (targetPos) {
            const targetCell = this.grid.getCell(targetPos.col, targetPos.row);
            if (targetCell && targetCell.item && this.dragItem.type === targetCell.item.type && this.dragItem.level === targetCell.item.level && this.dragItem.level < 4) {
                this.startShake(this.dragItem.sprite);
                this.startShake(targetCell.item.sprite);
            } else {
                this.stopShakeAll();
            }
        } else {
            this.stopShakeAll();
        }
    }

    startShake(sprite) {
        if (!sprite || !sprite.scene) return;
        if (this.activeShakeTargets.has(sprite)) return;

        const tween = this.scene.tweens.add({
            targets: sprite,
            angle: { from: -4, to: 4 },
            duration: 70,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.shakeTweens.push(tween);
        this.activeShakeTargets.add(sprite);
    }

    stopShake(sprite) {
        if (!sprite) return;
        this.activeShakeTargets.delete(sprite);

        const index = this.shakeTweens.findIndex(t => t.targets && Array.isArray(t.targets) && t.targets.includes(sprite));
        if (index !== -1) {
            const tween = this.shakeTweens[index];
            tween.stop();
            this.shakeTweens.splice(index, 1);
            sprite.setAngle(0);
        }
    }

    stopShakeAll() {
        this.shakeTweens.forEach(t => {
            if (t.targets && Array.isArray(t.targets)) {
                t.targets.forEach(obj => obj.setAngle(0));
            }
            t.stop();
        });
        this.shakeTweens = [];
        this.activeShakeTargets.clear();
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

        const mc = this.scene.mainContainer;
        const bc = this.boardContainer;

        let handled = false;
        if (targetPos) {
            const targetCell = this.grid.getCell(targetPos.col, targetPos.row);
            if (targetCell && this.onMergeAttempt) {
                handled = this.onMergeAttempt(item, targetCell);
            }
        }

        this.stopShakeAll();

        if (this.dragSound) {
            this.dragSound.stop();
            this.dragSound.destroy();
            this.dragSound = null;
        }

        if (!handled) {
            // Merge failed - play fail sound
            Utils.addAudio(this.scene, 'merge_fail', 0.5);
            
            // Animate return to origin cell if merge didn't succeed
            const originX = bc.x + this.grid.cellToX(item.originCol) * bc.scaleX;
            const originY = bc.y + this.grid.cellToY(item.originRow) * bc.scaleY;

            this.scene.tweens.add({
                targets: item.sprite,
                x: originX,
                y: originY,
                duration: 400,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    // Put sprite back in board container and restore cell state
                    mc.remove(item.sprite, false);
                    bc.add(item.sprite);
                    this.grid.placeItem(item, item.originCol, item.originRow);
                }
            });
        } else {
            // Clean up immediately for successful merge scenario (handled by MergeSystem)
            mc.remove(item.sprite, false);
            bc.add(item.sprite);
        }

    }
}
