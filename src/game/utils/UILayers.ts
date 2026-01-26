/**
 * UI Layer Depth System
 * Provides a clean, organized depth hierarchy for all UI elements across scenes
 */

export class UILayers {
    // ===== LAYER 0: Game Elements =====
    // Base game objects (sprites, obstacles, rings, backgrounds)
    static readonly GAME_BACKGROUND = 0;
    static readonly GAME_WALLS = 1;
    static readonly GAME_OBSTACLES = 2;
    static readonly GAME_RINGS = 3;
    static readonly GAME_PLAYER = 10;
    static readonly GAME_EFFECTS = 20;

    // ===== LAYER 1: Non-Blocking UI =====
    // HUD elements that don't cover the screen (buttons, score, health, etc.)
    static readonly UI_BACKGROUND_PANELS = 100;
    static readonly UI_TEXT = 110;
    static readonly UI_BUTTONS = 120;
    static readonly UI_ICONS = 130;

    // ===== LAYER 2: Full-Screen Overlays =====
    // Tutorial, hints, and other blocking overlays with transparent backgrounds
    static readonly OVERLAY_BACKGROUND = 1000;    // Black transparent backdrop
    static readonly OVERLAY_PANEL = 1010;         // Panel graphics
    static readonly OVERLAY_TEXT = 1020;          // Text content
    static readonly OVERLAY_BUTTONS = 1030;       // Interactive buttons
    static readonly OVERLAY_BLOCKER = 900;        // Invisible click blocker for layers below

    // ===== LAYER 3: Top Modal Panels =====
    // Pause, Settings, GameOver panels - topmost priority
    static readonly MODAL_BACKGROUND = 10000;     // Modal overlay (semi-transparent black)
    static readonly MODAL_PANEL = 10010;          // Modal panel graphics
    static readonly MODAL_TEXT = 10020;           // Modal text
    static readonly MODAL_BUTTONS = 10030;        // Modal buttons (Resume, Restart, etc.)
    static readonly MODAL_CONTROLS = 10040;       // Sliders, toggles, etc.
}
