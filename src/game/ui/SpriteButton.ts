import { GameObjects, Scene } from 'phaser';
import { AudioManager } from '../services/AudioManager';

export class SpriteButton {
    public sprite: GameObjects.Sprite;

    private hoverEnabled: boolean = false;
    private baseScaleX: number;
    private baseScaleY: number;

    constructor(scene: Scene, x: number, y: number, texture: string, callback: () => void, width?: number, height?: number, frame?: string | number) {
        // Create the sprite first
        this.sprite = scene.add.sprite(x, y, texture, frame)
            .setScrollFactor(0)
            .setDepth(101);

        // Set dimensions: use provided values or sprite's natural size
        if (width) this.sprite.displayWidth = width;
        if (height) this.sprite.displayHeight = height;

        // Store the calculated scales to use as a baseline for animations
        this.baseScaleX = this.sprite.scaleX;
        this.baseScaleY = this.sprite.scaleY;

        // Interaction - scale internal hit area to match display size
        this.sprite.setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.onHover(true))
            .on('pointerout', () => this.onHover(false))
            .on('pointerdown', () => {
                this.onPress();
                AudioManager.getInstance().playSFX('click');
                callback();
            })
            .on('pointerup', () => this.onRelease());

        // Prevent instant hover on scene start if mouse is already over the button position
        scene.time.delayedCall(100, () => {
            if (!this.sprite.active) return;
            this.hoverEnabled = true;
            if (this.sprite.input && (this.sprite.input as any).isOver) {
                this.onHover(true);
            }
        });
    }

    private onHover(isHovering: boolean) {
        if (!this.hoverEnabled) return;
        if (!this.sprite.active || !this.sprite.scene || !this.sprite.scene.sys.isActive()) return;

        const factor = isHovering ? 1.05 : 1;

        this.sprite.scene.tweens.add({
            targets: [this.sprite],
            scaleX: this.baseScaleX * factor,
            scaleY: this.baseScaleY * factor,
            duration: 150,
            ease: 'Power2'
        });
    }

    private onPress() {
        if (!this.sprite.active || !this.sprite.scene || !this.sprite.scene.sys.isActive()) return;

        this.sprite.scene.tweens.add({
            targets: [this.sprite],
            scaleX: this.baseScaleX * 0.95,
            scaleY: this.baseScaleY * 0.95,
            duration: 100,
            ease: 'Power2'
        });
    }

    private onRelease() {
        if (!this.sprite.active || !this.sprite.scene || !this.sprite.scene.sys.isActive()) return;

        this.sprite.scene.tweens.add({
            targets: [this.sprite],
            scaleX: this.baseScaleX * 1.05,
            scaleY: this.baseScaleY * 1.05,
            duration: 100,
            ease: 'Power2'
        });
    }

    public setDepth(depth: number) {
        this.sprite.setDepth(depth);
        return this;
    }

    public setScrollFactor(sf: number) {
        this.sprite.setScrollFactor(sf);
        return this;
    }

    public setVisible(visible: boolean) {
        this.sprite.setVisible(visible);
        return this;
    }

    public setAlpha(alpha: number) {
        this.sprite.setAlpha(alpha);
        return this;
    }

    public setScale(scale: number) {
        this.sprite.setScale(scale);
        this.baseScaleX = this.sprite.scaleX;
        this.baseScaleY = this.sprite.scaleY;
        return this;
    }

    public destroy() {
        this.sprite.destroy();
    }
}
