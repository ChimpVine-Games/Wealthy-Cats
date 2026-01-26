import { GameObjects, Scene } from 'phaser';
import { GameConfig } from '../utils/GameConfig';

export class Coin extends GameObjects.Container {
    private coinData: { value: number, color: number, colorStr: string };
    private baseCircle: GameObjects.Graphics;
    private valueText: GameObjects.Text;
    private shadow: GameObjects.Graphics;

    private readonly RADIUS: number;

    constructor(scene: Scene, x: number, y: number, value: number) {
        super(scene, x, y);
        this.RADIUS = GameConfig.coins.radius;
        this.coinData = GameConfig.coins.configs[value] || GameConfig.coins.configs[1];

        this.createCoin();
        this.setupInteractions();

        scene.add.existing(this);
    }

    private createCoin() {
        // Shadow
        this.shadow = this.scene.add.graphics();
        this.shadow.fillStyle(0x000000, 0.3);
        this.shadow.fillCircle(4, 4, this.RADIUS);
        this.add(this.shadow);

        // Base Coin Circle
        this.baseCircle = this.scene.add.graphics();
        this.drawCoinBase();
        this.add(this.baseCircle);

        // Outer Border (Darker for contrast)
        const border = this.scene.add.graphics();
        border.lineStyle(2, 0x000000, 0.2);
        border.strokeCircle(0, 0, this.RADIUS);
        this.add(border);

        // Bevel/Rim effect
        const rim = this.scene.add.graphics();
        const rimColor = this.coinData.value === 5 ? 0x000000 : 0xffffff;
        const rimAlpha = this.coinData.value === 5 ? 0.15 : 0.3;
        rim.lineStyle(3, rimColor, rimAlpha);
        rim.strokeCircle(0, 0, this.RADIUS - 2);
        this.add(rim);

        // Value Text (Embossed look)
        this.valueText = this.scene.add.text(0, 0, this.coinData.value.toString(), {
            fontFamily: 'Outfit, Arial',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.add(this.valueText);

        // Initialize interactivity
        this.setInteractive(new Phaser.Geom.Circle(0, 0, this.RADIUS), Phaser.Geom.Circle.Contains);
    }

    private drawCoinBase() {
        const graphics = this.baseCircle;
        graphics.clear();

        // Main Color fill
        graphics.fillStyle(this.coinData.color, 1);
        graphics.fillCircle(0, 0, this.RADIUS);

        // Simple gradient/shine effect
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillCircle(-this.RADIUS * 0.3, -this.RADIUS * 0.3, this.RADIUS * 0.5);
    }

    private setupInteractions() {
        this.scene.input.setDraggable(this);

        this.on('pointerover', () => {
            if (!this.input?.enabled) return;
            this.scene.tweens.add({
                targets: this,
                scale: 1.2,
                duration: 200,
                ease: 'Back.easeOut'
            });
        });

        this.on('pointerout', () => {
            if (!this.input?.enabled) return;
            this.scene.tweens.add({
                targets: this,
                scale: 1,
                duration: 200,
                ease: 'Power2'
            });
        });

        // Drag events
        this.on('dragstart', () => {
            const game = this.scene.scene.get('Game') as any;
            // Only allow dragging if a card is being shown (interaction needed)
            // or if we are in a special state. If IDLE, you must draw a card first.
            if (!game || game.isIdle || game.isAnimating) {
                return;
            }

            this.scene.children.bringToTop(this);
            this.setAlpha(0.8);
            this.scene.tweens.add({
                targets: this,
                scale: 1.3,
                duration: 100
            });
        });

        this.on('drag', (_pointer: any, dragX: number, dragY: number) => {
            const game = this.scene.scene.get('Game') as any;
            if (!game || game.isIdle || game.isAnimating) return;

            this.x = dragX;
            this.y = dragY;
        });

        this.on('dragend', () => {
            const game = this.scene.scene.get('Game') as any;
            if (!game || game.isIdle || game.isAnimating) {
                this.setAlpha(1);
                this.setScale(1);
                return;
            }

            this.setAlpha(1);
            this.scene.tweens.add({
                targets: this,
                scale: 1,
                duration: 200,
                ease: 'Back.easeOut'
            });
            this.emit('coin-dropped', this);
        });
    }

    public getValue(): number {
        return this.coinData.value;
    }
}
