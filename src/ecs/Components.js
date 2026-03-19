let _entityId = 0;

export function createItemEntity(col, row, type, level) {
    return {
        id: ++_entityId,
        // GridMember
        col,
        row,
        // MergeData
        type,       // 1..8
        level,      // 1..4
        // Draggable
        isDragging: false,
        originCol: col,
        originRow: row,
        // Visual (assigned after creation)
        sprite: null
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
        // InteractionTracker
        lastInputTime: Date.now(),
        idleThreshold,
        // Game state
        ordersCompleted: 0
    };
}

export function getTextureKey(type, level) {
    return `product_${type}_lv_${level}`;
}
