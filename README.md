# Wealthy Cats - Educational Financial Board Game

**Wealthy Cats** is a premium educational game designed to teach players the fundamentals of asset allocation, cash flow management, and strategic investing. Built with **Phaser 3** and **TypeScript**, it offers a tactile and engaging experience for learning financial literacy.

![Wealthy Cats Game](screenshot.png)

## 🎮 Gameplay Overview
Players compete to accumulate the highest total wealth by strategically moving coins between different financial "rooms." The game follows a structured stage-based progression where every decision impacts the final outcome.

### 🗝️ Core Mechanics
*   **Room-Based Management**: Categorize your wealth into specialized areas:
    *   **Cash (Wallet)**: Your primary liquid assets for daily transactions.
    *   **Production**: Invest in business slots to generate future revenue.
    *   **Emergency Fund**: A safety net that generates modest returns (10% interest).
    *   **Long-Term Investment**: High-growth assets generating significant returns (20% interest).
    *   **Maintenance & Indulgence**: Necessary and discretionary spending categories.
*   **Tactile Interaction**: Satisfying drag-and-drop coin physics with 3D-beveled looks and smooth animations.
*   **Turn-Based Progression**:
    *   **4 Stages**, each consisting of **7 rounds**.
    *   **Entry Fees**: At the start of each stage, players must cover a mandatory cost.
    *   **Market Returns**: At the end of each stage, coins in *Emergency* and *Investment* rooms generate interest and return to your *Cash* wallet.
*   **Dynamic Action Cards**: Draw from various decks (Action, Wealthy/Lucky, Orders) to trigger windfall rewards or market challenges.
*   **Multiplayer Support**: Two-player competitive mode with smooth turn transitions and individual board states.

## 🛠️ Technology Stack
*   **Engine**: [Phaser 3.90.0](https://phaser.io/)
*   **Language**: TypeScript 5.7.2
*   **Tooling**: Vite 6.3.1 for fast bundling and hot-reloading.
*   **Design Ethics**: Premium aesthetics using the *Outfit* Google Font, smooth tweens, and glassmorphism UI elements.

## 📂 Project Structure
| Path | Description |
| :--- | :--- |
| `src/game/scenes` | Core game logic and UI layering (Game, UIScene, GlobalUI). |
| `src/game/components` | Reusable game objects like Coins, BoardRooms, and Action Cards. |
| `src/game/logic` | State management for rooms, coin movement, and card effects. |
| `src/game/ui` | Interactive panels (Deposit, Production, Order Selection, GameOver). |
| `src/game/services` | Data-driven managers for Decks and Game State. |
| `public/assets` | High-quality sprites, audio, and visual assets. |

## 🚀 Getting Started

### Requirements
[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

### Commands
| Command | Description |
|---------|-------------|
| `npm install` | Install all project dependencies |
| `npm run dev` | Launch the local development server |
| `npm run build` | Create a production-optimized build in the `dist` folder |

### Development URL
By default, the development server runs on: `http://localhost:8080`

## ⌨️ Developer Shortcuts
*   **'E' (Hold)**: Enter Room Edit Mode to drag and redefine room polygons/slots in real-time.
*   **'L'**: Dev shortcut to trigger a "Wealthy!" card.
*   **'P'**: Dev shortcut to trigger a "Production" card.
*   **'S'**: Dev shortcut to trigger a "Sales/Market" card.

---
*Created as part of the **CV-Phaser** Educational Games series.*
