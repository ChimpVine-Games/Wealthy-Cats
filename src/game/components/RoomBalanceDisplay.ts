import { GameObjects, Scene } from 'phaser';

export class RoomBalanceDisplay extends GameObjects.Container {
    private bg: GameObjects.Graphics;
    private text: GameObjects.Text;

    constructor(scene: Scene, x: number, y: number, _roomId: string) {
        super(scene, x, y);

        this.bg = scene.add.graphics();
        this.bg.fillStyle(0x000000, 0.7);
        this.bg.fillRoundedRect(-110, -27.5, 220, 55, 12);
        this.bg.lineStyle(3, 0xffffff, 0.9);
        this.bg.strokeRoundedRect(-110, -27.5, 220, 55, 12);
        this.add(this.bg);

        this.text = scene.add.text(0, 0, '\u0E3F0', {
            fontFamily: 'Tahoma, Outfit, Arial',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.add(this.text);

        scene.add.existing(this);
        this.setDepth(100); // Above rooms and coins
    }

    public updateBalance(balance: number) {
        const currentText = this.text.text;
        const newText = `\u0E3F${balance}`;

        if (currentText !== newText) {
            this.text.setText(newText);

            // Animation for change
            this.scene.tweens.add({
                targets: this,
                scale: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut'
            });
        }
    }
}
