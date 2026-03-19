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
    CTA_AFTER_ORDERS: 3
};
