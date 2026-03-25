export default {
    COLS: 7,
    ROWS: 9,
    CELL_SIZE: 44,
    BOARD_OFFSET_Y: 40,
    UNDERLAY_RATIO: 0.62,
    BOARD_BOTTOM_PADDING: 40,
    CUSTOMER_HEIGHT_RATIO: 0.30,
    CUSTOMER_BASE_HEIGHT: 180,
    PRODUCT_TYPES: 8,
    MAX_LEVEL: 4,

    CUSTOMER_COUNT: 3,
    CUSTOMER_SPINE_KEYS: ['B01_Luna', 'B02_Fisherman', 'B03_SushiChef'],

    ORDER_MIN_LEVEL: 2,
    ORDER_MAX_LEVEL: 3,

    IDLE_THRESHOLD: 3000,
    HINT_MOVE_DURATION: 600,

    LEVEL_WEIGHTS: [60, 25, 12, 3],

    CTA_AFTER_ORDERS: 3,

    CUSTOMER_PROGRESSION: [
        { orderRequirements: [{ targetLevel: 2 }], rewardAmount: 5 },
        { orderRequirements: [{ targetLevel: 3 }], rewardAmount: 10 },
        { orderRequirements: [{ targetLevel: 2 }, { targetLevel: 3 }], rewardAmount: 15 }
    ],

    PROCEDURAL_ORDER_MIN_ITEMS: 1,
    PROCEDURAL_ORDER_MAX_ITEMS: 3,
    PROCEDURAL_REWARD_BASE: 10,
    PROCEDURAL_REWARD_PER_ITEM: 5
};

