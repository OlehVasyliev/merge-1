ECS Architecture: Merge Game
1. Entities
ItemEntity (On-field object)

CellEntity (Grid cell)

CustomerEntity (Customer in the queue)

OrderEntity (Specific request within a customer)

GlobalStateEntity (Singleton for scores, timers, and game state)

HelperEntity (Hint management singleton)

2. Components (Data / States)
Transform (position, scale, rotation)

GridMember (column: 0-8, row: 0-15, isLocked)

MergeData (itemType, level, isMaxLevel)

Draggable (isDragging, originX, originY)

CustomerData (portraitId, patienceTimer, moodState)

OrderRequirement (targetType, targetLevel, isSatisfied)

AnimationState (isPulsing, isShaking, hasArrow)

InteractionTracker (lastInputTime, idleThreshold, forcedTarget: EntityID)

3. Systems (Logic & Behavior)
🏗️ Core Systems
GridSystem

Dependencies: GridMember, Transform.

Role: Placing objects on a 9×16 grid.

InputSystem

Dependencies: Draggable, Transform.

Role: Processing taps and calculating drag coordinates.

MergeSystem

Dependencies: MergeData, GridMember.

Role: Comparing type + level during overlap and spawning a new ItemEntity.

CustomerSystem

Dependencies: CustomerData, OrderRequirement.

Role: Managing wait timers and checking order fulfillment.

🤖 Helper System (Hint Controller)
IdleObserverSystem

Dependencies: InteractionTracker, GlobalStateEntity.

Role: Monitoring inactivity time. If the threshold is exceeded, it marks HelperEntity with a ShowHint state.

HintGeneratorSystem

Dependencies: MergeData, OrderRequirement, InteractionTracker.

Role: * Searching for pairs on the field -> adds isPulsing to two ItemEntities.

Checking ready orders -> adds hasArrow to a CustomerEntity.

Forced mode -> adds isPulsing to a CTA_Button.

ContextFeedbackSystem

Dependencies: Draggable, MergeData.

Role: If isDragging == true, searches for a valid target under the cursor -> adds isShaking to both entities.

🎨 View Systems
RenderSystem

Dependencies: All entities with Transform.

Role: Drawing sprites in the engine (Cocos/Phaser).

AnimationSystem

Dependencies: AnimationState, Transform.

Role: Executing shaders or tweens (pulsing, shaking) based on component flags.

4. Resources (Global Configs)
MergeConfig (Level and type tables)

EconomyConfig (Order rewards)

HelperConfig (Idle timings, hint animation types)

Dependency Hierarchy (Flow)
InputSystem updates Draggable components and resets InteractionTracker.lastInputTime.

MergeSystem reacts to coordinate changes in Draggable, checks logic, and updates MergeData.

IdleObserverSystem detects inactivity in InteractionTracker and activates HintGeneratorSystem.

HintGeneratorSystem attaches flag components (isPulsing, isShaking) to the required Entities.

AnimationSystem detects these flags and triggers the visuals.