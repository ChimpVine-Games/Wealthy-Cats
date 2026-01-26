import { GameObjects, Scene } from 'phaser';
import { UILayers } from '../utils/UILayers';
import { GameConfig } from '../utils/GameConfig';

export class DepositPanel {
    private scene: Scene;
    private container: GameObjects.Container;
    private overlay: GameObjects.Rectangle;

    private selectedAmount: number = 0;
    private maxAmount: number = 0;

    private amountText: GameObjects.Text;
    private titleText: GameObjects.Text;
    private infoText: GameObjects.Text;

    constructor(
        scene: Scene,
        title: string,
        maxAmount: number,
        onConfirm: (amount: number) => void
    ) {
        this.scene = scene;
        this.maxAmount = maxAmount;
        const { width, height } = scene.scale;

        // Overlay
        this.overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setDepth(UILayers.MODAL_BACKGROUND)
            .setInteractive();

        // Main Container
        this.container = scene.add.container(width / 2, height / 2)
            .setDepth(UILayers.MODAL_PANEL);

        // Panel Background
        const bg = scene.add.graphics();
        bg.fillStyle(0x2c3e50, 1);
        bg.fillRoundedRect(-350, -280, 700, 560, 30);
        bg.lineStyle(6, 0xecf0f1, 1);
        bg.strokeRoundedRect(-350, -280, 700, 560, 30);
        this.container.add(bg);

        // Title
        this.titleText = scene.add.text(0, -210, title, {
            fontFamily: 'Outfit, Arial Black, Arial',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.container.add(this.titleText);

        // Info Text (Available Cash)
        this.infoText = scene.add.text(0, -130, `Available Cash: \u0E3F${maxAmount}`, {
            fontFamily: 'Outfit, Arial',
            fontSize: '28px',
            color: '#bdc3c7'
        }).setOrigin(0.5);
        this.container.add(this.infoText);

        // Amount Display Room
        const displayBg = scene.add.graphics();
        displayBg.fillStyle(0x000000, 0.3);
        displayBg.fillRoundedRect(-150, -50, 300, 120, 15);
        this.container.add(displayBg);

        this.amountText = scene.add.text(0, 10, `\u0E3F${this.selectedAmount}`, {
            fontFamily: 'Outfit, Arial',
            fontSize: '72px',
            fontStyle: 'bold',
            color: '#f1c40f'
        }).setOrigin(0.5);
        this.container.add(this.amountText);

        // Minus Button
        this.createControlBtn(-220, 10, '-', () => this.changeAmount(-1));
        this.createControlBtn(-290, 10, '--', () => this.changeAmount(-5));

        // Plus Button
        this.createControlBtn(220, 10, '+', () => this.changeAmount(1));
        this.createControlBtn(290, 10, '++', () => this.changeAmount(5));

        // OK Button
        const okBtn = scene.add.container(0, 190);
        const okBg = scene.add.graphics();
        okBg.fillStyle(0x27ae60, 1);
        okBg.fillRoundedRect(-120, -40, 240, 80, 15);
        okBg.lineStyle(2, 0xffffff, 1);
        okBg.strokeRoundedRect(-120, -40, 240, 80, 15);
        okBtn.add(okBg);

        const okTxt = scene.add.text(0, 0, 'DEPOSIT', {
            fontFamily: 'Outfit, Arial',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        okBtn.add(okTxt);

        okBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -30, 160, 60), Phaser.Geom.Rectangle.Contains);
        okBtn.on('pointerdown', () => {
            onConfirm(this.selectedAmount);
            this.destroy();
        });

        okBtn.on('pointerover', () => {
            scene.tweens.add({ targets: okBtn, scale: 1.05, duration: 100 });
        });
        okBtn.on('pointerout', () => {
            scene.tweens.add({ targets: okBtn, scale: 1, duration: 100 });
        });

        this.container.add(okBtn);

        // Entrance Animation
        this.container.setScale(0);
        scene.tweens.add({
            targets: this.container,
            scale: 1,
            duration: GameConfig.visuals.panelPopDuration,
            ease: 'Back.easeOut'
        });
    }

    private createControlBtn(x: number, y: number, label: string, callback: () => void) {
        const btn = this.scene.add.container(x, y);
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x34495e, 1);
        bg.fillCircle(0, 0, 30);
        bg.lineStyle(2, 0xffffff, 1);
        bg.strokeCircle(0, 0, 30);
        btn.add(bg);

        const txt = this.scene.add.text(0, 0, label, {
            fontFamily: 'Arial',
            fontSize: label.length > 1 ? '24px' : '32px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        btn.add(txt);

        btn.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
        btn.on('pointerdown', callback);

        btn.on('pointerover', () => bg.clear().fillStyle(0x5d6d7e, 1).fillCircle(0, 0, 20).lineStyle(2, 0xffffff, 1).strokeCircle(0, 0, 20));
        btn.on('pointerout', () => bg.clear().fillStyle(0x34495e, 1).fillCircle(0, 0, 20).lineStyle(2, 0xffffff, 1).strokeCircle(0, 0, 20));

        this.container.add(btn);
    }

    private changeAmount(delta: number) {
        this.selectedAmount = Phaser.Math.Clamp(this.selectedAmount + delta, 0, this.maxAmount);
        this.amountText.setText(`\u0E3F${this.selectedAmount}`);

        // Punch effect on text
        this.scene.tweens.add({
            targets: this.amountText,
            scale: 1.2,
            duration: 50,
            yoyo: true
        });
    }

    public destroy() {
        this.overlay.destroy();
        this.container.destroy();
    }
}
