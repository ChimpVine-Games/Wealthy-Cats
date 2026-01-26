import { GameObjects, Scene } from 'phaser';
import { CardData } from '../utils/GameTypes';

export class Card extends GameObjects.Container {
    private background: GameObjects.Graphics;
    private titleText: GameObjects.Text;
    private typeText: GameObjects.Text;
    private descriptionText: GameObjects.Text;
    private cardData: CardData;
    private visualOnly: boolean;
    private isFlipped: boolean = false;

    private frontContainer: GameObjects.Container;
    private backContainer: GameObjects.Container;
    private isAnimating: boolean = false;
    private restingScale: number = 1;

    private CARD_WIDTH = 420;
    private CARD_HEIGHT = 600;
    private CORNER_RADIUS = 30;
    private isSmallCard = false;

    constructor(scene: Scene, x: number, y: number, data: CardData, visualOnly: boolean = false, initiallyFlipped: boolean = false) {
        super(scene, x, y);
        this.cardData = data;
        this.visualOnly = visualOnly;
        this.isFlipped = initiallyFlipped;

        this.isSmallCard = data.type === 'ORDER';
        if (this.isSmallCard) {
            this.CARD_WIDTH = 190;
            this.CARD_HEIGHT = 270;
            this.CORNER_RADIUS = 15;
        }

        this.createCard();
        scene.add.existing(this);

        if (!this.isFlipped) {
            this.frontContainer.setVisible(false);
            this.backContainer.setVisible(true);
        } else {
            this.frontContainer.setVisible(true);
            this.backContainer.setVisible(false);
        }
    }

    private createCard() {
        const halfWidth = this.CARD_WIDTH / 2;
        const halfHeight = this.CARD_HEIGHT / 2;

        this.frontContainer = this.scene.add.container(0, 0);
        this.backContainer = this.scene.add.container(0, 0);
        this.add([this.backContainer, this.frontContainer]);

        // --- BACK SIDE ---
        const backBg = this.scene.add.graphics();
        backBg.fillStyle(0x2c3e50, 1);
        backBg.fillRoundedRect(-halfWidth, -halfHeight, this.CARD_WIDTH, this.CARD_HEIGHT, this.CORNER_RADIUS);
        backBg.lineStyle(6, 0xffffff, 0.9);
        backBg.strokeRoundedRect(-halfWidth, -halfHeight, this.CARD_WIDTH, this.CARD_HEIGHT, this.CORNER_RADIUS);

        // Back pattern
        backBg.lineStyle(4, 0x34495e, 1);
        backBg.strokeRoundedRect(-halfWidth + 30, -halfHeight + 30, this.CARD_WIDTH - 60, this.CARD_HEIGHT - 60, 20);
        backBg.fillStyle(0x34495e, 0.5);
        backBg.fillCircle(0, 0, 80);
        backBg.lineStyle(4, 0xffffff, 0.5);
        backBg.strokeCircle(0, 0, 80);

        this.backContainer.add(backBg);

        // --- FRONT SIDE ---
        // Base Shadow
        const shadow = this.scene.add.graphics();
        shadow.fillStyle(0x000000, 0.3);
        shadow.fillRoundedRect(-halfWidth + 5, -halfHeight + 5, this.CARD_WIDTH, this.CARD_HEIGHT, this.CORNER_RADIUS);
        this.frontContainer.add(shadow);

        // Main Background
        this.background = this.scene.add.graphics();
        this.drawBackground();
        this.frontContainer.add(this.background);

        // Border
        const border = this.scene.add.graphics();
        border.lineStyle(2, 0xffffff, 0.2);
        border.strokeRoundedRect(-halfWidth, -halfHeight, this.CARD_WIDTH, this.CARD_HEIGHT, this.CORNER_RADIUS);
        this.frontContainer.add(border);

        // Title
        const titleY = this.isSmallCard ? -halfHeight + 40 : -halfHeight + 85;
        const titleSize = this.isSmallCard ? '22px' : '38px';
        const titleWrap = this.isSmallCard ? this.CARD_WIDTH - 25 : this.CARD_WIDTH - 80;

        this.titleText = this.scene.add.text(0, titleY, this.cardData.title, {
            fontFamily: 'Arial Black, Arial',
            fontSize: titleSize,
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: titleWrap }
        }).setOrigin(0.5);
        this.frontContainer.add(this.titleText);

        // Type Badge
        const typeColor = this.getTypeColor();
        const typeBadge = this.scene.add.graphics();
        typeBadge.fillStyle(typeColor, 0.8);

        const badgeW = this.isSmallCard ? this.CARD_WIDTH - 50 : this.CARD_WIDTH - 120;
        const badgeH = this.isSmallCard ? 20 : 44;
        const badgeY = this.isSmallCard ? -halfHeight + 72 : -halfHeight + 160;
        const badgeR = this.isSmallCard ? 10 : 22;

        typeBadge.fillRoundedRect(-halfWidth + (this.isSmallCard ? 25 : 60), badgeY, badgeW, badgeH, badgeR);
        this.frontContainer.add(typeBadge);

        const typeSize = this.isSmallCard ? '11px' : '24px';
        const typeTextY = this.isSmallCard ? -halfHeight + 82 : -halfHeight + 182;

        this.typeText = this.scene.add.text(0, typeTextY, this.cardData.type, {
            fontFamily: 'Arial',
            fontSize: typeSize,
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.frontContainer.add(this.typeText);

        // Description/Effect Info
        const effectStr = this.getEffectDescription();
        const descY = this.isSmallCard ? 82 : 60;
        const descSize = this.isSmallCard ? '14px' : '28px';
        const descWrap = this.isSmallCard ? this.CARD_WIDTH - 30 : this.CARD_WIDTH - 80;

        this.descriptionText = this.scene.add.text(0, descY, effectStr, {
            fontFamily: 'Arial',
            fontSize: descSize,
            color: '#e0e0e0',
            align: 'center',
            wordWrap: { width: descWrap }
        }).setOrigin(0.5);
        this.frontContainer.add(this.descriptionText);

        // Action Buttons / Footer
        if (!this.visualOnly) {
            if (this.cardData.mandatory) {
                const mandY = this.isSmallCard ? halfHeight - 18 : halfHeight - 60;
                const mandSize = this.isSmallCard ? '12px' : '22px';

                const mandatoryText = this.scene.add.text(0, mandY, 'MANDATORY', {
                    fontFamily: 'Arial',
                    fontSize: mandSize,
                    fontStyle: 'bold',
                    color: '#ff4444'
                }).setOrigin(0.5);
                this.frontContainer.add(mandatoryText);
            } else {
                this.createDecisionButtons();
            }
        }

        // Cookie Jar Icons for ORDER cards
        if (this.cardData.type === 'ORDER') {
            const qty = this.cardData.effect.params.quantity;
            this.createCookieJarVisuals(qty);
        }

        // Dedicated interaction surface
        const hitArea = this.scene.add.rectangle(0, 0, this.CARD_WIDTH, this.CARD_HEIGHT, 0x000000, 0);
        hitArea.setInteractive();
        this.add(hitArea);

        hitArea.on('pointerover', () => {
            if (this.isAnimating) return;
            this.handleHover(true);
        });
        hitArea.on('pointerout', () => {
            if (this.isAnimating) return;
            this.handleHover(false);
        });
        hitArea.on('pointerdown', () => {
            if (this.isAnimating) return;
            this.emit('pointerdown');
        });
    }

    public flip(duration: number = 600) {
        this.isAnimating = true;
        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            duration: duration / 2,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.isFlipped = !this.isFlipped;
                this.frontContainer.setVisible(this.isFlipped);
                this.backContainer.setVisible(!this.isFlipped);

                this.scene.tweens.add({
                    targets: this,
                    scaleX: this.scaleY, // Return to uniform scale
                    duration: duration / 2,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        this.isAnimating = false;
                    }
                });
            }
        });
    }

    private createDecisionButtons() {
        const halfHeight = this.CARD_HEIGHT / 2;
        const btnY = this.isSmallCard ? halfHeight + 40 : halfHeight + 80;
        const btnWidth = this.isSmallCard ? 85 : 180;
        const btnHeight = this.isSmallCard ? 40 : 80;

        // Skip Button
        const skipX = this.isSmallCard ? -48 : -105;
        this.createButton(skipX, btnY, btnWidth, btnHeight, 'SKIP', 0xe74c3c, () => {
            this.emit('action-skip');
        });

        // Invest/Action Button
        const actionX = this.isSmallCard ? 48 : 105;
        const actionLabel = this.cardData.type.includes('DEPOSIT') ? 'INVEST' : 'ACCEPT';
        this.createButton(actionX, btnY, btnWidth, btnHeight, actionLabel, 0x27ae60, () => {
            this.emit('action-confirm');
        });
    }

    private createButton(x: number, y: number, w: number, h: number, label: string, color: number, callback: () => void) {
        const btn = this.scene.add.container(x, y);
        const bg = this.scene.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        bg.lineStyle(2, 0xffffff, 1);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
        btn.add(bg);

        const txt = this.scene.add.text(0, 0, label, {
            fontFamily: 'Arial',
            fontSize: this.isSmallCard ? '14px' : '28px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        btn.add(txt);

        btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerover', () => {
            this.scene.tweens.add({ targets: btn, scale: 1.1, duration: 100 });
        });
        btn.on('pointerout', () => {
            this.scene.tweens.add({ targets: btn, scale: 1, duration: 100 });
        });
        btn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            callback();
        });

        this.frontContainer.add(btn);
    }

    private handleHover(isOver: boolean) {
        this.scene.tweens.add({
            targets: this,
            scale: isOver ? this.restingScale * 1.05 : this.restingScale,
            duration: 200,
            ease: 'Power2'
        });
    }

    public setRestingScale(s: number) {
        this.restingScale = s;
        this.setScale(s);
    }

    public setAnimating(animating: boolean) {
        this.isAnimating = animating;
    }

    private drawBackground() {
        const graphics = this.background;
        graphics.clear();
        const halfWidth = this.CARD_WIDTH / 2;
        const halfHeight = this.CARD_HEIGHT / 2;
        const baseColor = this.getTypeColor();
        graphics.fillStyle(0x2a2a2a, 1);
        graphics.fillRoundedRect(-halfWidth, -halfHeight, this.CARD_WIDTH, this.CARD_HEIGHT, this.CORNER_RADIUS);
        graphics.fillStyle(baseColor, 0.2);
        const headerH = this.isSmallCard ? 55 : 120;
        graphics.fillRoundedRect(-halfWidth, -halfHeight, this.CARD_WIDTH, headerH, { tl: this.CORNER_RADIUS, tr: this.CORNER_RADIUS, bl: 0, br: 0 });
    }

    private getTypeColor(): number {
        switch (this.cardData.type) {
            case 'MAINTENANCE': return 0xff5555;
            case 'INDULGENCE': return 0xffaa00;
            case 'CASH_GAIN': return 0x44ff44;
            case 'PRODUCTION': return 0x44aaff;
            case 'SALES': return 0xaa44ff;
            case 'EMERGENCY_DEPOSIT': return 0xff44aa;
            case 'LONGTERM_DEPOSIT': return 0x00ccff;
            case 'WEALTHY_TRIGGER': return 0xffff00;
            case 'ORDER': return 0x9933ff;
            case 'LOAN': return 0xbbbbbb;
            case 'QUEST': return 0x33cc33;
            case 'LUCKY_GAIN': return 0xffd700;
            default: return 0x888888;
        }
    }

    private getEffectDescription(): string {
        const { op, params } = this.cardData.effect;
        switch (op) {
            case 'MOVE_CASH':
                return `Move ${params.amount} from ${params.from} to ${params.to}`;
            case 'CASH_DELTA':
                return `Gain ${params.amount} Cash`;
            case 'ADD_GOODS':
                return `Buy up to ${params.maxSets} sets at ${params.costPerSet} each`;
            case 'SELL_GOODS':
                return `Sell ${params.quantity} Units for \u0E3F${params.payout}`;
            case 'DRAW_FROM_DECK':
                return `Draw ${params.count} from ${params.deck} deck`;
            case 'TAKE_LOAN':
                return `Take ${params.principal} loan (Interest: ${params.interestPerRound}/rd)`;
            default:
                return JSON.stringify(params);
        }
    }

    private createCookieJarVisuals(qty: number) {
        const spacing = this.isSmallCard ? 55 : 110;
        const y = this.isSmallCard ? 35 : 160;
        const startX = -((qty - 1) * spacing) / 2;

        for (let i = 0; i < qty; i++) {
            const jar = this.scene.add.image(startX + (i * spacing), y, 'cookie_jar');
            jar.setScale(1);
            this.frontContainer.add(jar);
        }
    }

    public getCardData(): CardData {
        return this.cardData;
    }
}
