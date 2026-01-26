import { GameObjects, Scene } from 'phaser';
import { AudioManager } from '../services/AudioManager';

export class Button {
    public container: GameObjects.Container;
    public bg: GameObjects.Graphics;
    private bgShadow: GameObjects.Graphics;
    private bgGlow: GameObjects.Graphics;
    public label: GameObjects.Text;
    private labelShadow: GameObjects.Text;

    private normalColor: number = 0x1E3A8A;
    private hoverColor: number = 0x2563EB;
    private strokeColor: number = 0x60A5FA;

    private radius: number = 15;
    private width: number;
    private height: number;
    private hoverEnabled: boolean = false;
    private scene: Scene;

    constructor(scene: Scene, x: number, y: number, text: string, fontSize: number, callback: () => void, width: number = 240, height: number = 60) {
        this.scene = scene;
        this.width = width;
        this.height = height;

        this.container = scene.add.container(x, y);

        // Outer glow layer
        this.bgGlow = scene.add.graphics({ x: 0, y: 0 });

        // Shadow layer for depth
        this.bgShadow = scene.add.graphics({ x: 2, y: 4 });

        // Main background
        this.bg = scene.add.graphics({ x: 0, y: 0 });

        // Text shadow
        this.labelShadow = scene.add.text(2, 2, text, {
            fontFamily: 'Arial Black',
            fontSize: fontSize,
            color: '#000000'
        })
            .setOrigin(0.5)
            .setAlpha(0.3);

        // Main text
        this.label = scene.add.text(0, 0, text, {
            fontFamily: 'Arial Black',
            fontSize: fontSize,
            color: '#ffffff',
            stroke: '#3B82F6',
            strokeThickness: 2
        })
            .setOrigin(0.5);

        this.container.add([this.bgGlow, this.bgShadow, this.bg, this.labelShadow, this.label]);
        this.container.setScrollFactor(0).setDepth(100);

        this.draw(false);

        // Interaction
        this.bg.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => this.onHover(true))
            .on('pointerout', () => this.onHover(false))
            .on('pointerdown', () => {
                this.onPress();
                AudioManager.getInstance().playSFX('click');
                callback();
            })
            .on('pointerup', () => this.onRelease());

        scene.time.delayedCall(100, () => {
            this.hoverEnabled = true;
        });
    }

    private draw(isHovered: boolean) {
        const color = isHovered ? this.hoverColor : this.normalColor;

        this.bg.clear();
        this.bg.fillStyle(color, 0.85);
        this.bg.lineStyle(3, this.strokeColor, 0.8);
        this.bg.fillRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, this.radius);
        this.bg.strokeRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, this.radius);

        this.bgShadow.clear();
        this.bgShadow.fillStyle(0x000000, 0.25);
        this.bgShadow.fillRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, this.radius);

        this.bgGlow.clear();
        this.bgGlow.fillStyle(this.strokeColor, isHovered ? 0.5 : 0.3);
        this.bgGlow.fillRoundedRect(-(this.width + 8) / 2, -(this.height + 8) / 2, this.width + 8, this.height + 8, this.radius + 4);
    }

    private onHover(isHovering: boolean) {
        if (!this.hoverEnabled || !this.container.scene) return;
        this.draw(isHovering);
        this.scene.tweens.add({
            targets: this.container,
            scaleX: isHovering ? 1.05 : 1,
            scaleY: isHovering ? 1.05 : 1,
            duration: 150,
            ease: 'Power2'
        });
    }

    private onPress() {
        if (!this.container.scene) return;
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 100,
            ease: 'Power2'
        });
        this.bgGlow.setAlpha(0.7);
    }

    private onRelease() {
        if (!this.container.scene) return;
        this.scene.tweens.add({
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

    public setVisible(visible: boolean) {
        this.container.setVisible(visible);
        return this;
    }

    public setText(text: string) {
        this.label.setText(text);
        this.labelShadow.setText(text);
        return this;
    }

    public setStyles(backgroundColor: number, strokeColor: number) {
        this.normalColor = backgroundColor;
        this.strokeColor = strokeColor;
        const color = Phaser.Display.Color.IntegerToColor(backgroundColor);
        color.brighten(15);
        this.hoverColor = color.color;
        this.draw(false);
        return this;
    }

    public destroy() {
        this.container.destroy();
    }
}
