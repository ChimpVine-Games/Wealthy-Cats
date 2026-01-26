import { GameObjects, Scene } from 'phaser';
import { UILayers } from '../utils/UILayers';
import { Card } from '../components/Card';

export class OrderSelectionPanel {
    private container: GameObjects.Container;
    private overlay: GameObjects.Rectangle;
    private cards: Card[] = [];

    constructor(scene: Scene, orders: any[], onSelect: (order: any) => void) {
        const { width, height } = scene.scale;

        // Overlay
        this.overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setDepth(UILayers.MODAL_BACKGROUND)
            .setInteractive();

        // Main Container
        this.container = scene.add.container(width / 2, height / 2)
            .setDepth(UILayers.MODAL_PANEL);

        // Title
        const titleText = scene.add.text(0, -320, 'SELECT AN ORDER', {
            fontFamily: 'Outfit, Arial Black, Arial',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        this.container.add(titleText);

        const subTitle = scene.add.text(0, -270, 'Choose a contract you can fulfill', {
            fontFamily: 'Outfit, Arial',
            fontSize: '24px',
            color: '#bdc3c7'
        }).setOrigin(0.5);
        this.container.add(subTitle);

        // Card Display Logic
        const scale = 1;
        const cardWidth = 190;
        const spacing = 20;
        const totalCards = orders.length;

        // Calculate rows and columns
        const cardsPerRow = 6;
        const startX = -((cardsPerRow - 1) * (cardWidth + spacing)) / 2;

        orders.slice(0, 12).forEach((data, i) => {
            const row = Math.floor(i / cardsPerRow);
            const col = i % cardsPerRow;

            const x = startX + (col * (cardWidth + spacing));
            const y = row * 320 - 150;

            const card = new Card(scene, x, y, data, true, true); // visualOnly = true, initiallyFlipped = true
            card.setRestingScale(scale);
            this.container.add(card);
            this.cards.push(card);

            // Click interaction for selection
            card.on('pointerdown', () => {
                onSelect(data);
                this.destroy();
            });
        });

        // Entrance Animation
        this.container.setScale(0);
        scene.tweens.add({
            targets: this.container,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
    }

    public destroy() {
        this.overlay.destroy();
        this.container.destroy();
    }
}
