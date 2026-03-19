import { createItemEntity, getTextureKey } from '../ecs/Components';
import Config from '../ecs/MergeConfig';

export default class MergeSystem {
    constructor(scene, gridSystem, boardContainer) {
        this.scene = scene;
        this.grid = gridSystem;
        this.boardContainer = boardContainer;

        /** @type {function(Object):void|null} */
        this.onMergeSuccess = null;
    }

    /**
     * Try to merge dragItem into targetCell.
     * Returns true if the action was handled (merge or simple move).
     */
    tryMerge(dragItem, targetCell) {
        const targetItem = targetCell.item;

        // Empty cell → just place the item
        if (!targetItem) {
            this.grid.placeItem(dragItem, targetCell.col, targetCell.row);
            return true;
        }

        // Same type + same level + not max → merge
        if (
            dragItem.type === targetItem.type &&
            dragItem.level === targetItem.level &&
            dragItem.level < Config.MAX_LEVEL
        ) {
            const newLevel = dragItem.level + 1;
            const type = dragItem.type;
            const col = targetCell.col;
            const row = targetCell.row;

            // Destroy both old items
            this.grid.removeItem(targetItem);
            this.grid.removeItem(dragItem);

            // Spawn the upgraded item
            const newItem = createItemEntity(col, row, type, newLevel);
            const px = this.grid.cellToX(col);
            const py = this.grid.cellToY(row);

            newItem.sprite = this.scene.add.image(px, py, getTextureKey(type, newLevel))
                .setDisplaySize(Config.CELL_SIZE - 4, Config.CELL_SIZE - 4)
                .setDepth(1)
                .setInteractive();
            this.boardContainer.add(newItem.sprite);
            newItem.sprite.itemEntity = newItem;

            const cell = this.grid.getCell(col, row);
            cell.item = newItem;
            this.grid.items.push(newItem);

            // Pop animation
            this.scene.tweens.add({
                targets: newItem.sprite,
                scaleX: newItem.sprite.scaleX * 1.3,
                scaleY: newItem.sprite.scaleY * 1.3,
                duration: 100,
                yoyo: true,
                ease: 'Cubic'
            });

            if (this.onMergeSuccess) this.onMergeSuccess(newItem);
            return true;
        }

        // Conditions not met → caller should snap back
        return false;
    }
}
