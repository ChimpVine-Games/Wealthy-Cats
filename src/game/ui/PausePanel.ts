import { GameObjects, Scene } from 'phaser';
import { SpriteTextButton } from './SpriteTextButton';
import { UILayers } from '../utils/UILayers';

export class PausePanel {
    private container: GameObjects.Container;
    private overlay: GameObjects.Rectangle;
    private panel: GameObjects.Image;
    private resumeBtn: SpriteTextButton;
    private restartBtn: SpriteTextButton;
    private quitBtn: SpriteTextButton;

    constructor(
        scene: Scene,
        onResume: () => void,
        onRestart: () => void,
        onQuit: () => void
    ) {
        const { width, height } = scene.scale;

        // Semi-transparent overlay (high depth to block all input)
        this.overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
            .setInteractive()
            .setDepth(UILayers.MODAL_BACKGROUND)
            .setScrollFactor(0);

        // Main container
        this.container = scene.add.container(width / 2, height / 2)
            .setDepth(UILayers.MODAL_PANEL)
            .setScrollFactor(0);

        // Panel background
        this.panel = scene.add.image(0, 0, 'paused_bg');

        // Button layout settings
        const buttonSpacing = 110;
        const buttonsYOffset = -50;

        // Buttons
        this.resumeBtn = new SpriteTextButton(
            scene,
            0,
            buttonsYOffset,
            'pause_panel_btn',
            'RESUME',
            32,
            () => {
                this.destroy();
                onResume();
            },
            undefined,
            undefined,
            -4
        );

        this.restartBtn = new SpriteTextButton(
            scene,
            0,
            buttonsYOffset + buttonSpacing,
            'pause_panel_btn',
            'RESTART',
            32,
            () => {
                this.destroy();
                onRestart();
            },
            undefined,
            undefined,
            -4
        );

        this.quitBtn = new SpriteTextButton(
            scene,
            0,
            buttonsYOffset + (buttonSpacing * 2),
            'pause_panel_btn',
            'QUIT',
            32,
            () => {
                this.destroy();
                onQuit();
            },
            undefined,
            undefined,
            -4
        );

        this.container.add([
            this.panel,
            this.resumeBtn.container,
            this.restartBtn.container,
            this.quitBtn.container
        ]);
    }

    public destroy() {
        this.overlay.destroy();
        this.resumeBtn.destroy();
        this.restartBtn.destroy();
        this.quitBtn.destroy();
        this.container.destroy();
    }
}
