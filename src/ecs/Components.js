let _entityId = 0;

export function createItemEntity(col, row, type, level) {
    return {
        id: ++_entityId,

        col,
        row,

        type,       // 1..8
        level,      // 1..4

        isDragging: false,
        isLocked: false,
        originCol: col,
        originRow: row,

        sprite: null,
        checkSprite: null
    };
}

export function createCellEntity(col, row) {
    return {
        col,
        row,
        item: null,
        sprite: null
    };
}

export function createGlobalState(idleThreshold) {
    return {

        lastInputTime: Date.now(),
        idleThreshold,

        ordersCompleted: 0,

        totalCoins: 0,
        currentCustomerIndex: 0
    };
}

export function getTextureKey(type, level) {
    return `product_${type}_lv_${level}`;
}

