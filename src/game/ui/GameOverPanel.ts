import { GameObjects, Scene } from 'phaser';
import { UILayers } from '../utils/UILayers';
import { AudioManager } from '../services/AudioManager';

export class GameOverPanel {
    private scene: Scene;
    private bgLayer: GameObjects.Container;
    private contentLayer: GameObjects.Container;

    constructor(
        scene: Scene,
        onRetry: () => void,
        winnerName?: string,
        playerStats?: any[]
    ) {
        this.scene = scene;
        const { width, height } = scene.scale;

        // Master container
        this.bgLayer = scene.add.container(0, 0)
            .setDepth(UILayers.MODAL_BACKGROUND)
            .setScrollFactor(0);

        // Content layer
        this.contentLayer = scene.add.container(width / 2, height / 2)
            .setDepth(UILayers.MODAL_PANEL)
            .setScrollFactor(0);

        // Dark Overlay
        const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
            .setInteractive();
        this.bgLayer.add(overlay);

        // --- TITLE ---
        const titleText = scene.add.text(0, -height / 2 + 60, 'PLAYER STATS', {
            fontFamily: 'Outfit, Arial Black',
            fontSize: '56px',
            color: '#f1c40f',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        this.contentLayer.add(titleText);

        // --- STATS COLUMN LAYOUT ---
        const panelWidth = width * 0.9;
        const panelHeight = height * 0.6;
        const colWidth = panelWidth / 2;

        // Vertical Divider
        const divider = scene.add.graphics();
        divider.lineStyle(4, 0xffffff, 0.3);
        divider.lineBetween(0, -panelHeight / 2 + 50, 0, panelHeight / 2 - 50);
        this.contentLayer.add(divider);

        if (playerStats && playerStats.length >= 2) {
            this.renderPlayerColumn(-colWidth / 2, playerStats[0], '#ff4d4d');
            this.renderPlayerColumn(colWidth / 2, playerStats[1], '#00aaff');
        }

        // --- WINNER TITLE AT BOTTOM ---
        if (winnerName) {
            const winTitle = scene.add.text(0, panelHeight / 2 + 20, winnerName.toUpperCase(), {
                fontFamily: 'Outfit, Arial Black',
                fontSize: '72px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#e67e22',
                strokeThickness: 10,
                align: 'center'
            }).setOrigin(0.5);
            this.contentLayer.add(winTitle);

            // Play Again Button (Centered below Winner Title)
            const buttonY = (panelHeight / 2) + 140;
            this.createPlayAgainButton(scene, 0, buttonY, () => {
                this.destroy();
                onRetry();
            });
        }
    }

    private renderPlayerColumn(x: number, stats: any, nameColor: string) {
        const startY = -180;
        const spacing = 45;

        // Player Name
        const nameTxt = this.scene.add.text(x, startY - 60, stats.name.toUpperCase(), {
            fontFamily: 'Outfit, Arial Black, Arial',
            fontSize: '42px',
            fontStyle: 'bold',
            color: nameColor
        }).setOrigin(0.5);
        this.contentLayer.add(nameTxt);

        const statEntries = [
            { label: 'Starting Cash', value: `\u0E3F${stats.startingCash}`, color: '#bdc3c7' },
            { label: 'Investments', value: `-\u0E3F${stats.invested}`, color: '#e74c3c' },
            { label: 'Returns', value: `+\u0E3F${stats.returns}`, color: '#2ecc71' },
            { label: 'Production', value: `-\u0E3F${stats.production}`, color: '#e67e22' },
            { label: 'Sales Revenue', value: `+\u0E3F${stats.sales}`, color: '#2ecc71' },
            { label: 'Candy Exp.', value: `-\u0E3F${stats.indulgence}`, color: '#9b59b6' },
            { label: 'Maintenance', value: `-\u0E3F${stats.maintenance}`, color: '#95a5a6' },
            { label: 'Entry Fees', value: `-\u0E3F${stats.fees}`, color: '#e74c3c' },
            { label: 'FINAL BALANCE', value: `\u0E3F${stats.finalCash}`, color: '#f1c40f', isTotal: true }
        ];

        statEntries.forEach((entry, i) => {
            const y = startY + (i * spacing);

            // Label
            const label = this.scene.add.text(x - 180, y, entry.label, {
                fontFamily: 'Outfit, Arial',
                fontSize: entry.isTotal ? '28px' : '22px',
                fontStyle: entry.isTotal ? 'bold' : 'normal',
                color: '#ecf0f1'
            }).setOrigin(0, 0.5);

            // Value
            const val = this.scene.add.text(x + 180, y, entry.value, {
                fontFamily: 'Outfit, Arial',
                fontSize: entry.isTotal ? '28px' : '22px',
                fontStyle: 'bold',
                color: entry.color
            }).setOrigin(1, 0.5);

            this.contentLayer.add([label, val]);
        });
    }

    private createPlayAgainButton(scene: Scene, x: number, y: number, callback: () => void) {
        const btn = scene.add.container(x, y);
        const width = 360;
        const height = 90;

        // Outer Border/Stroke (Cream/Light Yellow)
        const outer = scene.add.graphics();
        outer.fillStyle(0xFFFBE4, 1);
        outer.fillRoundedRect(-width / 2, -height / 2, width, height, 45);
        btn.add(outer);

        // Inner Fill (Gold/Yellow)
        const inner = scene.add.graphics();
        inner.fillStyle(0xFFC300, 1);
        inner.fillRoundedRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 37);
        btn.add(inner);

        // Glossy Highlight (Subtle top overlay)
        const gloss = scene.add.graphics();
        gloss.fillStyle(0xffffff, 0.2);
        gloss.fillRoundedRect(-width / 2 + 8, -height / 2 + 8, width - 16, (height - 16) / 2, { tl: 37, tr: 37, bl: 0, br: 0 });
        btn.add(gloss);

        const txt = scene.add.text(0, 0, 'PLAY AGAIN', {
            fontFamily: 'Outfit, Arial Black',
            fontSize: '40px',
            fontStyle: 'bold',
            color: '#FFFFFF',
            stroke: '#E67E22',
            strokeThickness: 2
        }).setOrigin(0.5);
        btn.add(txt);

        // Interaction
        const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
        btn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, true);

        btn.on('pointerover', () => {
            scene.tweens.add({ targets: btn, scale: 1.05, duration: 100 });
        });
        btn.on('pointerout', () => {
            scene.tweens.add({ targets: btn, scale: 1, duration: 100 });
        });
        btn.on('pointerdown', () => {
            scene.tweens.add({
                targets: btn,
                scale: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    AudioManager.getInstance().playSFX('click');
                    callback();
                }
            });
        });

        this.contentLayer.add(btn);
    }

    public destroy() {
        this.bgLayer.destroy();
        this.contentLayer.destroy();
    }
}
