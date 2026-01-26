import { Scene } from 'phaser';
import { IconButton } from '../ui/IconButton';
import { PausePanel } from '../ui/PausePanel';
import { SettingsPanel } from '../ui/SettingsPanel';
import { UILayers } from '../utils/UILayers';
import { GameOverPanel } from '../ui/GameOverPanel';
import { DepositPanel } from '../ui/DepositPanel';
import { ProductionPanel } from '../ui/ProductionPanel';
import { OrderSelectionPanel } from '../ui/OrderSelectionPanel';
import { GameConfig } from '../utils/GameConfig';
import { Card } from '../components/Card';

export class UIScene extends Scene {
    private pauseButton: any;
    private settingsButton: any;
    private roundText: Phaser.GameObjects.Text;
    private stageText: Phaser.GameObjects.Text;
    private cashText: Phaser.GameObjects.Text;
    private playerNameText: Phaser.GameObjects.Text;
    private gameOverPanel: GameOverPanel | null = null;

    private gameScene: Scene;
    private gameEvents: Phaser.Events.EventEmitter;
    private cardOverlay: Phaser.GameObjects.Rectangle | null = null;
    private activeCard: Card | null = null;
    private isCardVisible: boolean = false;
    private deckContainer: Phaser.GameObjects.Container;
    private deckGlow: Phaser.GameObjects.Graphics;
    private currentPlayerColor: number = 0xff0000;

    constructor() {
        super({ key: 'UIScene' });
    }

    init(data: { gameScene: Scene }) {
        this.gameScene = data.gameScene;
        this.gameEvents = this.gameScene.events;
    }

    create() {
        this.input.setTopOnly(true);

        // Reset state
        this.setupButtons(50);
        this.setupDrawButton();
        this.setupHUD();

        this.gameEvents.on('show-gameover', (data: any) => this.showGameOver(data), this);
        this.gameEvents.on('update-hud', (data: any) => this.onUpdateHUD(data), this);

        this.gameEvents.on('show-deposit-panel', (data: { title: string, maxAmount: number }) => {
            new DepositPanel(this, data.title, data.maxAmount, (amount) => {
                this.gameEvents.emit('deposit-provided', amount);
            });
        });

        this.gameEvents.on('show-production-panel', (data: { costPerSlot: number, currentCash: number, maxSlots: number }) => {
            new ProductionPanel(this, data.costPerSlot, data.currentCash, data.maxSlots, (slots: number, totalCost: number) => {
                this.gameEvents.emit('production-provided', { slots, totalCost });
            });
        });

        this.gameEvents.on('show-order-selection', (data: { orders: any[] }) => {
            new OrderSelectionPanel(this, data.orders, (selectedOrder) => {
                this.gameEvents.emit('order-selected', selectedOrder);
            });
        });

        // Global Card Visual Management
        this.gameEvents.on('show-card-overlay', this.showCardOverlay, this);
        this.gameEvents.on('dismiss-card-overlay', this.dismissCardOverlay, this);

        // Listen for internal selection to tell the game scene
        this.gameEvents.on('select-coin-value', (val: number) => {
            this.gameEvents.emit('change-coin-selection', val);
        });

        this.events.on('shutdown', () => {
            if (this.gameEvents) {
                this.gameEvents.off('show-gameover');
                this.gameEvents.off('update-hud');
                this.gameEvents.off('select-coin-value');
                this.gameEvents.off('show-deposit-panel');
                this.gameEvents.off('show-production-panel');
                this.gameEvents.off('show-order-selection');
                this.gameEvents.off('show-card-overlay');
                this.gameEvents.off('dismiss-card-overlay');
            }
        });
    }

    private setupDrawButton() {
        const { width, height } = this.scale;
        const cardW = 225;
        const cardH = 335;

        const x = width - cardW / 2 - 40;
        const y = height - cardH / 2 - 40;

        // Container for the whole deck UI
        const drawContainer = this.add.container(x, y);
        drawContainer.setDepth(UILayers.UI_BUTTONS);
        this.deckContainer = drawContainer;

        // 1. GLOW LAYER (Placed first so it's behind the card)
        this.deckGlow = this.add.graphics();
        this.updateGlowGraphics(0xff0000);
        drawContainer.add(this.deckGlow);

        // Spread/Pulse animation for dramatic high/low intensity
        this.tweens.add({
            targets: this.deckGlow,
            alpha: { from: 1, to: 0.1 },
            duration: 800,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        // 2. ULTRA-CLEAN CARD BACK (No white spacing, no gaps)
        const bg = this.add.graphics();
        bg.fillStyle(0x1a2530, 1);
        bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 15);

        // Simple dark center design
        bg.fillStyle(0x2c3e50, 1);
        bg.fillCircle(0, 0, 50);

        drawContainer.add(bg);

        // Interaction
        drawContainer.setInteractive(new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);

        drawContainer.on('pointerover', () => {
            this.tweens.add({ targets: drawContainer, scale: 1.05, duration: 100 });
        });

        drawContainer.on('pointerout', () => {
            this.tweens.add({ targets: drawContainer, scale: 1, duration: 100 });
        });

        drawContainer.on('pointerdown', () => {
            if (this.isCardVisible || !(this.gameScene as any).isIdle) return;

            this.tweens.add({
                targets: drawContainer,
                scale: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    this.gameEvents.emit('draw-action-card');
                }
            });
        });
    }

    private setupHUD() {
        const { width } = this.scale;
        const boxW = 220;
        const boxH = 55;
        const boxRight = width - 20;
        const startY = 80; // Starting Y for the stack
        const spacing = 15;

        // --- CASH ---
        const cashBg = this.add.graphics();
        cashBg.fillStyle(0x000000, 0.7);
        cashBg.fillRoundedRect(boxRight - boxW, startY, boxW, boxH, 12);
        cashBg.lineStyle(3, 0xffffff, 0.9);
        cashBg.strokeRoundedRect(boxRight - boxW, startY, boxW, boxH, 12);
        cashBg.setDepth(UILayers.UI_TEXT - 1);

        this.cashText = this.add.text(boxRight - boxW / 2, startY + boxH / 2, '\u0E3F0', {
            fontFamily: 'Tahoma, Outfit, Arial Black',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(UILayers.UI_TEXT);

        // --- STAGE ---
        const nextY = startY + boxH + spacing;
        const stageBg = this.add.graphics();
        stageBg.fillStyle(0x000000, 0.7);
        stageBg.fillRoundedRect(boxRight - boxW, nextY, boxW, boxH, 12);
        stageBg.lineStyle(3, 0xffffff, 0.9);
        stageBg.strokeRoundedRect(boxRight - boxW, nextY, boxW, boxH, 12);
        stageBg.setDepth(UILayers.UI_TEXT - 1);

        this.stageText = this.add.text(boxRight - boxW / 2, nextY + boxH / 2, `${GameConfig.gameplay.text.stage}: 1 / ${GameConfig.gameplay.maxStages}`, {
            fontFamily: 'Outfit, Arial Black',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(UILayers.UI_TEXT);

        // --- ROUND ---
        const finalY = nextY + boxH + spacing;
        const roundBg = this.add.graphics();
        roundBg.fillStyle(0x000000, 0.7);
        roundBg.fillRoundedRect(boxRight - boxW, finalY, boxW, boxH, 12);
        roundBg.lineStyle(3, 0xffffff, 0.9);
        roundBg.strokeRoundedRect(boxRight - boxW, finalY, boxW, boxH, 12);
        roundBg.setDepth(UILayers.UI_TEXT - 1);

        this.roundText = this.add.text(boxRight - boxW / 2, finalY + boxH / 2, `${GameConfig.gameplay.text.round}: 1 / ${GameConfig.gameplay.roundsPerStage}`, {
            fontFamily: 'Outfit, Arial Black',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(UILayers.UI_TEXT);

        this.playerNameText = this.add.text(width / 2, 50, 'PLAYER 1', {
            fontFamily: 'Outfit, Arial Black, Arial',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(UILayers.UI_TEXT);
    }

    private showCardOverlay(cardData: any) {
        const { width, height } = this.scale;
        this.isCardVisible = true;

        if (!this.cardOverlay) {
            this.cardOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000)
                .setAlpha(0)
                .setDepth(UILayers.OVERLAY_BACKGROUND)
                .setInteractive();
        }

        this.tweens.add({
            targets: this.cardOverlay,
            alpha: GameConfig.visuals.overlayAlpha,
            duration: GameConfig.visuals.overlayFadeDuration
        });

        if (this.activeCard) this.activeCard.destroy();

        const startX = this.deckContainer.x;
        const startY = this.deckContainer.y;

        this.activeCard = new Card(this, startX, startY, cardData, false, false);
        this.activeCard.setDepth(UILayers.OVERLAY_PANEL);
        this.activeCard.setScale(0.2);

        this.activeCard.on('action-skip', () => this.gameEvents.emit('card-action-skip'));
        this.activeCard.on('action-confirm', () => this.gameEvents.emit('card-action-confirm'));
        this.activeCard.on('pointerdown', () => {
            if (cardData.mandatory) this.gameEvents.emit('card-action-confirm');
        });

        this.activeCard.setAnimating(true);

        const isOrder = cardData.type === 'ORDER';
        const targetScale = isOrder ? 2.2 : 1;

        this.tweens.add({
            targets: this.activeCard,
            x: width / 2,
            y: height / 2,
            scale: targetScale,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.time.delayedCall(200, () => {
                    this.activeCard?.flip(600);
                });
            }
        });
    }

    private dismissCardOverlay(onComplete?: () => void) {
        this.isCardVisible = false;
        this.tweens.add({ targets: this.cardOverlay, alpha: 0, duration: GameConfig.visuals.overlayFadeDuration });
        this.tweens.add({
            targets: this.activeCard,
            y: this.scale.height + GameConfig.visuals.cardEntranceY,
            scale: 0.5,
            duration: GameConfig.visuals.cardSlideDuration,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.activeCard?.destroy();
                this.activeCard = null;
                if (onComplete) onComplete();
            }
        });
    }

    private onUpdateHUD(data: { round?: number, stage?: number, playerName?: string, playerIndex?: number, cash?: number }) {
        if (data.cash !== undefined) {
            this.cashText.setText(`\u0E3F${data.cash}`);
            this.tweens.add({
                targets: this.cashText,
                scale: 1.1,
                duration: 100,
                yoyo: true
            });
        }

        if (data.playerName !== undefined) {
            this.playerNameText.setText(data.playerName.toUpperCase());
            this.tweens.add({
                targets: this.playerNameText,
                scale: 1.1,
                duration: 200,
                yoyo: true
            });
        }

        if (data.playerIndex !== undefined) {
            const color = data.playerIndex === 0 ? '#ff4d4d' : '#00aaff';
            this.playerNameText.setColor(color);
            this.currentPlayerColor = data.playerIndex === 0 ? 0xff0000 : 0x00aaff;
            this.updateGlowGraphics(this.currentPlayerColor);
        }

        if (data.stage !== undefined) {
            this.stageText.setText(`${GameConfig.gameplay.text.stage}: ${data.stage} / ${GameConfig.gameplay.maxStages}`);
            this.tweens.add({
                targets: this.stageText,
                scale: 1.2,
                duration: 200,
                yoyo: true
            });
        }

        if (data.round !== undefined) {
            this.roundText.setText(`${GameConfig.gameplay.text.round}: ${data.round} / ${GameConfig.gameplay.roundsPerStage}`);
            this.tweens.add({
                targets: this.roundText,
                scale: 1.2,
                duration: 200,
                yoyo: true
            });
        }
    }

    private showGameOver(data: { winnerName?: string; playerStats?: any[] }) {
        this.gameOverPanel?.destroy();
        this.handleGameOverUI();
        this.disableTopButtonsOnly();

        this.gameOverPanel = new GameOverPanel(
            this,
            true,
            0,
            () => {
                this.gameEvents.emit('restart-game');
                this.enableTopButtonsOnly();
                this.gameOverPanel?.destroy();
                this.gameOverPanel = null;
            },
            () => {
                this.gameEvents.emit('quit-game');
                this.enableTopButtonsOnly();
                this.gameOverPanel?.destroy();
                this.gameOverPanel = null;
            },
            undefined,
            data.winnerName,
            data.playerStats
        );
    }

    private setupButtons(margin: number) {
        this.pauseButton = new IconButton(
            this,
            margin + 50,
            50,
            'pause_icon',
            () => {
                this.gameEvents.emit('pause-game');
                new PausePanel(
                    this,
                    () => { this.gameEvents.emit('resume-game'); },
                    () => { this.gameEvents.emit('resume-game'); this.gameEvents.emit('restart-game'); },
                    () => { this.gameEvents.emit('resume-game'); this.gameEvents.emit('quit-game'); }
                );
            }
        );
        this.pauseButton.sprite.setOrigin(0.5, 0);
        this.pauseButton.setDepth(UILayers.UI_BUTTONS);
        this.pauseButton.setVisible(false);

        this.settingsButton = new IconButton(
            this,
            margin + 170,
            50,
            'settings_icon',
            () => {
                this.gameEvents.emit('pause-game');
                new SettingsPanel(this, () => {
                    this.gameEvents.emit('resume-game');
                });
            }
        );
        this.settingsButton.sprite.setOrigin(0.5, 0);
        this.settingsButton.setDepth(UILayers.UI_BUTTONS);
        this.settingsButton.setVisible(false);
    }

    private handleGameOverUI() { }

    private disableTopButtonsOnly() {
        this.pauseButton?.disable();
        this.settingsButton?.disable();
    }

    private enableTopButtonsOnly() {
        this.pauseButton?.enable();
        this.settingsButton?.enable();
    }

    private updateGlowGraphics(color: number) {
        this.deckGlow.clear();

        const cardW = 225;
        const cardH = 335;

        // Draw 36 layers starting from INSIDE the card to eliminate all gaps
        // We start with a negative expansion (-4) so the glow is flush under the card edges
        for (let i = 0; i < 36; i++) {
            const expand = -4 + (i * 2);
            // Stronger base alpha for much higher intensity
            const alpha = Math.pow(0.88, i) * 0.7;
            const thickness = 2 + (i * 1.5);

            this.deckGlow.lineStyle(thickness, color, alpha);
            this.deckGlow.strokeRoundedRect(
                -cardW / 2 - expand,
                -cardH / 2 - expand,
                cardW + (expand * 2),
                cardH + (expand * 2),
                15 + Math.max(0, expand)
            );
        }
    }

    update() {
        if (!this.gameScene || !this.deckContainer) return;

        const isIdle = (this.gameScene as any).isIdle;
        const canClick = isIdle && !this.isCardVisible;

        // Dim the container when not clickable, but keep it visible
        this.deckContainer.setAlpha(canClick ? 1 : 0.6);

        // Show/Hide glow based on whether navigation is possible
        this.deckGlow.setVisible(canClick);
    }
}
