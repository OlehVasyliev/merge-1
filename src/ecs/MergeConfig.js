export default {
    COLS: 9,
    ROWS: 16,
    CELL_SIZE: 44,
    BOARD_OFFSET_Y: 40,

    PRODUCT_TYPES: 8,
    MAX_LEVEL: 4,

    CUSTOMER_COUNT: 3,
    // Orders require levels 2-4 so the player must merge
    ORDER_MIN_LEVEL: 2,
    ORDER_MAX_LEVEL: 3,

    IDLE_THRESHOLD: 3000,
    HINT_MOVE_DURATION: 600,

    // Probability weights for initial board fill (level 1 most common)
    LEVEL_WEIGHTS: [60, 25, 12, 3],

    // How many fulfilled orders before showing the CTA
    CTA_AFTER_ORDERS: 3,

    // Default customer progression curve (first 5 customers)
    CUSTOMER_PROGRESSION: [
        { orderRequirements: [{ productType: 1, targetLevel: 2 }], rewardAmount: 5 },
        { orderRequirements: [{ productType: 1, targetLevel: 3 }], rewardAmount: 10 },
        { orderRequirements: [{ productType: 1, targetLevel: 2 }, { productType: 1, targetLevel: 2 }], rewardAmount: 15 },
        { orderRequirements: [{ productType: 1, targetLevel: 2 }, { productType: 1, targetLevel: 3 }], rewardAmount: 20 },
        { orderRequirements: [{ productType: 1, targetLevel: 3 }, { productType: 1, targetLevel: 3 }], rewardAmount: 30 }
    ],

    // Procedural order settings after customer 5
    PROCEDURAL_ORDER_MIN_ITEMS: 1,
    PROCEDURAL_ORDER_MAX_ITEMS: 3,
    PROCEDURAL_REWARD_BASE: 10,
    PROCEDURAL_REWARD_PER_ITEM: 5
};
