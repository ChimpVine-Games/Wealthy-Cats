import { GameObjects, Scene } from 'phaser';
import { IconButton } from './IconButton';
import { UILayers } from '../utils/UILayers';

export class GameOverPanel {
    private scene: Scene;
    private bgLayer: GameObjects.Container;
    private contentLayer: GameObjects.Container;
    private buttons: IconButton[] = [];

    constructor(
        scene: Scene,
        win: boolean,
        level: number | string,
        onRetry: () => void,
        onHome: () => void,
        onNext?: () => void,
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

            // Replay and Home Buttons
            const buttonY = height / 2 - 100;
            this.addLabeledButton(scene, -150, buttonY - (height / 2), 'retry_icon', 'REPLAY', () => {
                this.destroy();
                onRetry();
            });
            this.addLabeledButton(scene, 150, buttonY - (height / 2), 'home_icon', 'HOME', () => {
                this.destroy();
                onHome();
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

    private addLabeledButton(scene: Scene, x: number, y: number, texture: string, labelText: string, callback: () => void) {
        const btn = new IconButton(scene, x, y, texture, callback);
        const label = scene.add.text(x, y + 70, labelText, {
            fontFamily: 'Arial Black',
            fontSize: '22px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.buttons.push(btn);
        this.contentLayer.add([btn.sprite, label]);
    }

    public destroy() {
        this.buttons.forEach(btn => btn.destroy());
        this.bgLayer.destroy();
        this.contentLayer.destroy();
    }
}
