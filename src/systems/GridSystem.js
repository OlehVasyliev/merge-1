import { createCellEntity, createItemEntity, getTextureKey } from '../ecs/Components';
import Config from '../ecs/MergeConfig';
import Utils from '../../core/framework/Utils';

export default class GridSystem {
    constructor(scene, boardContainer) {
        this.scene = scene;
        this.boardContainer = boardContainer;
        this.cells = [];  // 2D array [col][row]
        this.items = [];  // flat list of all ItemEntities
    }

    init() {
        this.cells = [];
        for (let col = 0; col < Config.COLS; col++) {
            this.cells[col] = [];
            for (let row = 0; row < Config.ROWS; row++) {
                const cell = createCellEntity(col, row);
                const px = this.cellToX(col);
                const py = this.cellToY(row);

                const tex = (col + row) % 2 === 0 ? 'cell_1' : 'cell_2';
                cell.sprite = this.scene.add.image(px, py, tex)
                    .setDisplaySize(Config.CELL_SIZE, Config.CELL_SIZE)
                    .setDepth(0);
                this.boardContainer.add(cell.sprite);

                const item = this.createRandomItem(col, row);
                cell.item = item;
                this.items.push(item);

                this.cells[col][row] = cell;
            }
        }
    }

    

    createRandomItem(col, row) {
        const type  = Math.floor(Math.random() * Config.PRODUCT_TYPES) + 1;
        const level = 1;  // all items start at level 1
        const item  = createItemEntity(col, row, type, level);

        const px = this.cellToX(col);
        const py = this.cellToY(row);

        item.sprite = this.scene.add.image(px, py, getTextureKey(type, level))
            .setDisplaySize(Config.CELL_SIZE - 4, Config.CELL_SIZE - 4)
            .setDepth(1)
            .setInteractive()
            .setAlpha(0);

        const targetScaleX = item.sprite.scaleX;
        const targetScaleY = item.sprite.scaleY;
        const startScaleX = targetScaleX * 0.25;
        const startScaleY = targetScaleY * 0.25;
        item.sprite.setScale(startScaleX, startScaleY);

        this.boardContainer.add(item.sprite); 

        item.sprite.itemEntity = item;

        const delay = Math.random() * 800; // Random delay 0-500ms
        this.scene.tweens.add({
            targets: item.sprite,
            alpha: 1,
            scaleX: targetScaleX,
            scaleY: targetScaleY,
            duration: 200,
            delay: delay,
            ease: 'Back.easeOut',
            onStart: () => {
                Utils.addAudio(this.scene, 'product_spawn', 0.1);
            }
        });
        
        return item;
    }

    weightedRandomLevel() {
        const w = Config.LEVEL_WEIGHTS;
        const total = w.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < w.length; i++) {
            r -= w[i];
            if (r <= 0) return i + 1;
        }
        return 1;
    }

    cellToX(col) {
        return (col - (Config.COLS - 1) / 2) * Config.CELL_SIZE;
    }

    cellToY(row) {
        return (row - (Config.ROWS - 1) / 2) * Config.CELL_SIZE;
    }

    getCell(col, row) {
        if (col < 0 || col >= Config.COLS || row < 0 || row >= Config.ROWS) return null;
        return this.cells[col][row];
    }

    placeItem(item, col, row) {
        const cell = this.getCell(col, row);
        if (!cell) return;
        cell.item = item;
        item.col = col;
        item.row = row;
        item.originCol = col;
        item.originRow = row;
        item.sprite.setPosition(this.cellToX(col), this.cellToY(row));
        item.sprite.setDepth(1);
    }

    removeItem(item) {
        const cell = this.getCell(item.col, item.row);
        if (cell && cell.item === item) cell.item = null;
        const idx = this.items.indexOf(item);
        if (idx !== -1) this.items.splice(idx, 1);
        if (item.sprite) item.sprite.destroy();
    }

    
    pointToCell(bx, by) {
        const col = Math.round(bx / Config.CELL_SIZE + (Config.COLS - 1) / 2);
        const row = Math.round(by / Config.CELL_SIZE + (Config.ROWS - 1) / 2);
        if (col < 0 || col >= Config.COLS || row < 0 || row >= Config.ROWS) return null;
        return { col, row };
    }

    
    findMatchingPair() {
        const map = {};
        for (const item of this.items) {
            if (item.level >= Config.MAX_LEVEL) continue;
            const key = `${item.type}_${item.level}`;
            if (map[key]) return [map[key], item];
            map[key] = item;
        }
        return null;
    }

    
    findItemByTypeAndLevel(type, level) {
        return this.items.find(i => i.type === type && i.level === level) || null;
    }
}

