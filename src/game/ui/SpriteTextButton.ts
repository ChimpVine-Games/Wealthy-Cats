import { GameObjects, Scene } from 'phaser';
import { AudioManager } from '../services/AudioManager';

export class SpriteTextButton {
    public sprite: GameObjects.Sprite;
    public label: GameObjects.Text;
    public container: GameObjects.Container;

    private hoverEnabled: boolean = false;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        texture: string,
        text: string,
        fontSize: number,
        callback: () => void,
        width?: number,
        height?: number,
        labelOffsetY: number = 0
    ) {
        // Create a local container for the button parts
        this.container = scene.add.container(x, y);

        // Create the sprite at local (0,0)
        this.sprite = scene.add.sprite(0, 0, texture)
            .setInteractive({ useHandCursor: true });

        if (width) this.sprite.displayWidth = width;
        if (height) this.sprite.displayHeight = height;

        // Main text label
        this.label = scene.add.text(0, labelOffsetY, text, {
            fontFamily: 'Arial Black',
            fontSize: fontSize + 'px',
            color: '#FFFFFF',
            stroke: '#4D240E',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.container.add([this.sprite, this.label]);

        // Interaction
        this.sprite.on('pointerover', () => this.onHover(true));
        this.sprite.on('pointerout', () => this.onHover(false));
        this.sprite.on('pointerdown', () => {
            this.onPress();
            AudioManager.getInstance().playSFX('click');
            callback();
        });
        this.sprite.on('pointerup', () => this.onRelease());

        // Initial setup
        scene.time.delayedCall(100, () => {
            if (!this.container.active) return;
            this.hoverEnabled = true;
        });
    }

    private onHover(isHovering: boolean) {
        if (!this.hoverEnabled) return;
        const targetScale = isHovering ? 1.05 : 1;

        this.container.scene.tweens.add({
            targets: this.container,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 150,
            ease: 'Power2'
        });
    }

    private onPress() {
        this.container.scene.tweens.add({
            targets: this.container,
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 100,
            ease: 'Power2'
        });
    }

    private onRelease() {
        this.container.scene.tweens.add({
            targets: this.container,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100,
            ease: 'Power2'
        });
    }

    public setDepth(depth: number) {
        this.container.setDepth(depth);
        return this;
    }

    public setScrollFactor(sf: number) {
        this.container.setScrollFactor(sf);
        return this;
    }

    public destroy() {
        this.container.destroy();
    }
}
