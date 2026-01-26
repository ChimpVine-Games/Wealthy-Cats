# Wealthy Cats - Development Rules & Project Status

## 🏗️ Technology Stack
*   **Engine**: Phaser 3 (Javascript / TypeScript)
*   **Architecture**: Feature/Component-based. Avoid "god files."
*   **Design**: Premium aesthetics, Google Fonts (Outfit), smooth tweens, glassmorphism elements.

## 🗺️ Game Board & Rooms
*   **Coordinate System**: Fixed coordinates for rooms defined in `RoomDefinitions.ts`.
*   **Edit Mode**: Hold **'E'** to drag room nodes and redefine polygons in real-time.
*   **Valid Spawning**: `BoardRoom.getRandomPoint()` ensures items (coins) spawn 45px away from any border.
*   **Room Mapping**:
    *   `cash` -> Starter wallet / player cash.
    *   `maintenance` -> Mapped to `basic` room.
    *   `indulgence` -> Mapped to `candy` room.
    *   `production` -> Mapped to `goods` room (with 3 specific slot circles).
    *   `emergency` -> Reserve funds.
    *   `longTerm` -> Long term investments.

## 💰 Coin Mechanics
*   **Denominations**: 1 (Green), 2 (Purple), 5 (Yellow), 10 (Blue).
*   **Styling**: 3D-bevel look with gradients and shadows.
*   **Tactile Interaction**:
    *   Fully draggable with `input.setDraggable`.
    *   Uses `dragX/dragY` for smooth movement.
    *   Brought to top depth when dragged.
*   **Spawning**: Initial 30 cash is a mix: (1x10, 2x5, 3x2, 4x1).

## 🃏 Card & Turn Sequence
*   **Draw Deck**: Randomized stack from `decks.json`.
*   **States**: Managed via `GameState` (IDLE, CARD_SHOWN, OVERLAY_PENDING, ANIMATING).
*   **Visual Sequence** (Strict Order):
    1.  **Draw Click**: User clicks "DRAW" button. (State: `CARD_SHOWN`).
    2.  **Card Pop**: Black overlay and card slide up.
    3.  **Card Interaction**:
        *   **Auto-Effect Cards**: On click, card/overlay slide away. Coin action triggers after slide-out.
        *   **Interactive Cards** (Investment/Production): On click, the card **dismisses immediately** and slides away. **THEN** the selection panel pops up. (State: `OVERLAY_PENDING`).
    4.  **Confirmation**: User makes selection and clicks "OK". The panel closes and the coin movement starts **immediately**. (State: `IDLE`).

## 🧼 Workspace Cleanliness
*   **Overlay Stacking**: To prevent UI clutter, an Action Card is always dismissed (slides out) **before** an interactive Selection Panel (like the Investment or Production pop-up) is displayed.
*   **State Locking**: While a card or overlay is active, other world interactions (like drawing another card) are disabled until the current action is fully resolved.

## 🛠️ Specialized Components
*   **DepositPanel**: Quick +/- buttons for investing/saving cash.
*   **ProductionPanel**: Visual "Slot" selector for buying goods (Max 3 slots).
*   **pendingAction**: A system in `Game.ts` that buffers card effects until the user is ready to see the board changes.

## 📦 File Structure
*   `src/game/components/`: Reusable game objects (Coin, BoardRoom, Card).
*   `src/game/ui/`: Reusable UI panels (DepositPanel, ProductionPanel, GameOver).
*   `src/game/scenes/`: Main logic flow (Game, UIScene).
*   `src/game/services/`: Data management (DeckManager).
