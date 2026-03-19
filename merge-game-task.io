Task: Merge Game Core Architecture Implementation

Overview
The objective is to implement the core mechanics of a merge game utilizing an Entity-Component-System logic structure. This will be built over the existing playable ad template, focusing strictly on the game loop: the grid, the merge mechanics, the customer order fulfillment, and the idle helper. All necessary visual assets are located in the assets/textures directory.

Asset Utilization
Helper system: helper_finger
Customer characters: customer_1, customer_2, customer_3, customer_4, customer_5
Products: product_1_lv_1 through product_8_lv_4. There are 8 distinct product types, each having 4 upgrade levels.
User Interface: customer_cloude_of_proucts to display the requested item, and btn_give_to_customer to complete the order.

Core Components (Data Structures)
Grid Component: Maintains the state of a 9x16 grid. It stores the column and row index for each cell and a reference to the item currently occupying it.
Item Component: Stores the product type property (1 through 8) and the level property (1 through 4). This component dynamically resolves which product texture to display.
Customer Component: Contains the active customer portrait ID and the order requirements, specifically the target product type and target product level.
Idle Tracker Component: A timer variable that resets on any user input and counts upwards during inactivity.

Core Systems (Logic Execution)

Grid System
This system initializes the play area. Upon starting, it generates the 9x16 grid and populates every cell with an initial product entity, ensuring the board is completely filled from the start. It updates the occupancy status of cells whenever an item is picked up, moved, or destroyed.

Merge System
This system processes all drag and drop interactions. When the player releases a dragged item over a target cell, the system compares the Item Component of both the dragged item and the item currently in the target cell. If both items share the exact same product type and the exact same level, and are not at the maximum level of 4, a merge is triggered. Both original entities are removed, and a new entity is spawned in the target cell with its level incremented by one. If the requirements are not met, the dragged item snaps back to its original grid cell.

Customer System
This system controls the flow of orders. It selects a random customer texture from customer_1 to customer_5 and displays the customer_cloude_of_proucts texture next to them, placing the required product texture inside the cloud. The system continuously validates the board state against the active order. If the player merges items to create the exact product requested, the btn_give_to_customer becomes visible and active. Once the user clicks this button, the requested product is consumed and removed from the board, the customer leaves, and a new customer entity is generated with a new order.

Helper System
This system serves as an idle monitor to guide the player. It observes the Idle Tracker Component. If the player does not interact with the screen for a specific amount of time, the system scans the Grid Component to find any two items on the board that have matching types and levels. Once a valid pair is identified, the system activates the helper_finger texture and runs a looping animation moving the finger from the first item to the second item, visually demonstrating the merge action. Any touch input immediately hides the helper finger and resets the idle timer.

Development Steps

Define the component data structures for the board, items, and customers.

Initialize the 9x16 grid and render the initial layout using the provided product textures.

Program the drag and drop input logic and the merge validation rules.

Implement the customer generation, integrating the cloud and button textures for order fulfillment.

Create the idle tracker and implement the logic to trigger the finger animation over a valid merge pair.