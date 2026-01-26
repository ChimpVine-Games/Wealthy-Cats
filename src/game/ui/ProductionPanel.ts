import { GameObjects, Scene } from 'phaser';
import { UILayers } from '../utils/UILayers';
import { GameConfig } from '../utils/GameConfig';

export class ProductionPanel {
    private scene: Scene;
    private container: GameObjects.Container;
    private overlay: GameObjects.Rectangle;

    private selectedSlots: number = 0;
    private maxSlots: number;
    private costPerSlot: number;
    private currentCash: number;

    private unitsText: GameObjects.Text;
    private totalCostText: GameObjects.Text;
    private infoText: GameObjects.Text;

    constructor(
        scene: Scene,
        costPerSlot: number,
        currentCash: number,
        maxSlots: number,
        onConfirm: (slots: number, totalCost: number) => void
    ) {
        this.scene = scene;
        this.costPerSlot = costPerSlot;
        this.currentCash = currentCash;
        this.maxSlots = maxSlots;
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
        bg.fillStyle(0x1a252f, 1);
        bg.fillRoundedRect(-350, -280, 700, 560, 30);
        bg.lineStyle(6, 0x3498db, 1);
        bg.strokeRoundedRect(-350, -280, 700, 560, 30);
        this.container.add(bg);

        // Title
        const titleText = scene.add.text(0, -210, 'PRODUCTION', {
            fontFamily: 'Outfit, Arial Black, Arial',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.container.add(titleText);

        // Info Text
        this.infoText = scene.add.text(0, -140, `Fill slots to produce goods.\nCost: \u0E3F${costPerSlot} per slot`, {
            fontFamily: 'Outfit, Arial',
            fontSize: '24px',
            color: '#bdc3c7',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(this.infoText);

        // Slot Visualizer
        this.createSlotVisuals();

        // Selection Controls
        this.unitsText = scene.add.text(0, 60, '0 Slots Selected', {
            fontFamily: 'Outfit, Arial',
            fontSize: '32px',
            color: '#ecf0f1'
        }).setOrigin(0.5);
        this.container.add(this.unitsText);

        this.totalCostText = scene.add.text(0, 110, 'Total Cost: \u0E3F0', {
            fontFamily: 'Outfit, Arial',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#f1c40f'
        }).setOrigin(0.5);
        this.container.add(this.totalCostText);

        // Add/Remove Buttons
        this.createControlBtn(-180, 85, '-', () => this.changeSlots(-1));
        this.createControlBtn(180, 85, '+', () => this.changeSlots(1));

        // Confirm Button
        const okBtn = scene.add.container(0, 190);
        const okBg = scene.add.graphics();
        okBg.fillStyle(0x3498db, 1);
        okBg.fillRoundedRect(-140, -40, 280, 80, 15);
        okBg.lineStyle(2, 0xffffff, 1);
        okBg.strokeRoundedRect(-140, -40, 280, 80, 15);
        okBtn.add(okBg);

        const okTxt = scene.add.text(0, 0, 'PRODUCE', {
            fontFamily: 'Outfit, Arial',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        okBtn.add(okTxt);

        okBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -30, 200, 60), Phaser.Geom.Rectangle.Contains);
        okBtn.on('pointerdown', () => {
            const total = this.selectedSlots * this.costPerSlot;
            if (total <= currentCash && this.selectedSlots > 0) {
                onConfirm(this.selectedSlots, total);
                this.destroy();
            } else if (this.selectedSlots > 0) {
                // Shake if not enough cash
                scene.tweens.add({ targets: this.container, x: width / 2 + 10, duration: 50, yoyo: true, repeat: 2 });
            }
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

    private slotGraphics: GameObjects.Graphics[] = [];

    private createSlotVisuals() {
        const spacing = 140;
        const totalWidth = (this.maxSlots - 1) * spacing;
        const startX = -totalWidth / 2;

        for (let i = 0; i < this.maxSlots; i++) {
            const slot = this.scene.add.graphics();
            this.drawSlot(slot, false);
            slot.x = startX + (i * spacing);
            slot.y = -30;
            this.container.add(slot);
            this.slotGraphics.push(slot);
        }
    }

    private drawSlot(g: GameObjects.Graphics, active: boolean) {
        g.clear();
        if (active) {
            g.fillStyle(0x3498db, 1);
            g.fillCircle(0, 0, 45);
            g.lineStyle(4, 0xffffff, 1);
            g.strokeCircle(0, 0, 45);

            // Add a small "coin" icon look
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(0, 0, 20);
        } else {
            g.fillStyle(0x000000, 0.5);
            g.fillCircle(0, 0, 45);
            g.lineStyle(3, 0x34495e, 1);
            g.strokeCircle(0, 0, 45);
        }
    }

    private createControlBtn(x: number, y: number, label: string, callback: () => void) {
        const btn = this.scene.add.container(x, y);
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x34495e, 1);
        bg.fillCircle(0, 0, 35);
        bg.lineStyle(3, 0xffffff, 1);
        bg.strokeCircle(0, 0, 35);
        btn.add(bg);

        const txt = this.scene.add.text(0, 0, label, {
            fontFamily: 'Arial',
            fontSize: '44px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        btn.add(txt);

        btn.setInteractive(new Phaser.Geom.Circle(0, 0, 25), Phaser.Geom.Circle.Contains);
        btn.on('pointerdown', callback);
        this.container.add(btn);
    }

    private changeSlots(delta: number) {
        // Clamp by physical max slots AND what the player can actually afford
        const affordableSlots = Math.floor(this.currentCash / this.costPerSlot);
        const limit = Math.min(this.maxSlots, affordableSlots);

        const newVal = Phaser.Math.Clamp(this.selectedSlots + delta, 0, limit);
        if (newVal === this.selectedSlots) {
            if (delta > 0 && newVal === affordableSlots) {
                // Shake to show we can't afford more
                this.scene.tweens.add({ targets: this.container, x: this.scene.scale.width / 2 + 5, duration: 50, yoyo: true, repeat: 1 });
            }
            return;
        }

        this.selectedSlots = newVal;
        this.unitsText.setText(`${this.selectedSlots} Slots Selected`);
        this.totalCostText.setText(`Total Cost: \u0E3F${this.selectedSlots * this.costPerSlot}`);

        // Update visuals
        this.slotGraphics.forEach((g, i) => {
            this.drawSlot(g, i < this.selectedSlots);
        });

        this.scene.tweens.add({
            targets: [this.unitsText, this.totalCostText],
            scale: 1.1,
            duration: 50,
            yoyo: true
        });
    }

    public destroy() {
        this.overlay.destroy();
        this.container.destroy();
    }
}
