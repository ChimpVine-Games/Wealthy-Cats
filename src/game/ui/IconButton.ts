import { GameObjects, Scene } from 'phaser';
import { AudioManager } from '../services/AudioManager';

export class IconButton {
    public sprite: GameObjects.Image;
    private scene: Scene;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        texture: string,
        callback: () => void,
        frame?: string | number
    ) {
        this.scene = scene;

        // Create pure image render
        this.sprite = scene.add.image(x, y, texture, frame);

        // Use original height and width (default for images in Phaser)
        this.sprite.setInteractive({ useHandCursor: true });

        // Interaction logic
        this.sprite.on('pointerover', () => this.onHover(true));
        this.sprite.on('pointerout', () => this.onHover(false));
        this.sprite.on('pointerdown', () => {
            this.onPress();
            AudioManager.getInstance().playSFX('click');
            callback();
        });
        this.sprite.on('pointerup', () => this.onRelease());
    }

    private onHover(isHovering: boolean) {
        const targetScale = isHovering ? 1.05 : 1;

        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 100,
            ease: 'Power2'
        });
    }

    private onPress() {
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 50,
            ease: 'Power2'
        });
    }

    private onRelease() {
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1,
            scaleY: 1,
            duration: 50,
            ease: 'Power2'
        });
    }

    public setPosition(x: number, y: number) {
        this.sprite.setPosition(x, y);
        return this;
    }

    public setDepth(depth: number) {
        this.sprite.setDepth(depth);
        return this;
    }

    public setScrollFactor(sf: number) {
        this.sprite.setScrollFactor(sf);
        return this;
    }

    public disable() {
        this.sprite.disableInteractive();
        this.sprite.setAlpha(0.5);
        return this;
    }

    public enable() {
        this.sprite.setInteractive({ useHandCursor: true });
        this.sprite.setAlpha(1);
        return this;
    }

    public setVisible(visible: boolean) {
        this.sprite.setVisible(visible);
        return this;
    }

    public destroy() {
        this.sprite.destroy();
    }
}
