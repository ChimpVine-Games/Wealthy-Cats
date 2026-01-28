import { Scene } from 'phaser';
import { Coin } from '../components/Coin';
import { BoardRoom } from '../components/BoardRoom';
import { GameConfig } from '../utils/GameConfig';
import { DeckManager } from '../services/DeckManager';
import { RoomManager } from '../logic/RoomManager';
import { EffectManager } from '../logic/EffectManager';
import { RoomBalanceDisplay } from '../components/RoomBalanceDisplay';

enum GameState {
    IDLE,
    CARD_SHOWN,
    OVERLAY_PENDING,
    ANIMATING
}

interface PlayerStats {
    startingCash: number;
    invested: number;
    returns: number;
    production: number;
    sales: number;
    indulgence: number;
    maintenance: number;
    fees: number;
}

interface Player {
    id: number;
    name: string;
    container: Phaser.GameObjects.Container;
    coins: Coin[];
    currentRound: number;
    currentStage: number;
    roomManager: RoomManager;
    balanceDisplays: Map<string, RoomBalanceDisplay>;
    stats: PlayerStats;
}

export class Game extends Scene {
    public deckManager: DeckManager;
    private players: Player[] = [];
    private currentPlayerIndex: number = 0;
    private effectManager: EffectManager;

    private currentCardData: any = null;
    private gameState: GameState = GameState.IDLE;
    private slotHandles: Phaser.GameObjects.Arc[] = [];
    private isSubDraw: boolean = false;

    constructor() {
        super({ key: 'Game' });
    }

    public get isIdle(): boolean {
        return this.gameState === GameState.IDLE;
    }

    public get isAnimating(): boolean {
        return this.gameState === GameState.ANIMATING;
    }

    init() {
        this.deckManager = DeckManager.getInstance();
    }

    create() {
        this.setupPlayers();
        this.setupEvents();

        this.events.on('show-order-selection', () => {
            this.isSubDraw = true;
        });

        this.events.on('order-selected', (selectedOrder: any) => {
            this.currentCardData = selectedOrder;
        });

        this.scene.launch('UIScene', { gameScene: this });

        // Update initial HUD for Player 1
        this.time.delayedCall(500, () => {
            const p = this.getCurrentPlayer();
            this.events.emit('update-hud', {
                stage: p.currentStage,
                round: 0,
                playerName: p.name,
                playerIndex: this.currentPlayerIndex,
                cash: p.roomManager.getRoomBalance('cash')
            });
        });

        // Trigger initial Stage Fee
        this.time.delayedCall(1000, () => this.triggerStageStart());
    }

    private setupPlayers() {
        const { width, height } = this.scale;

        for (let i = 0; i < GameConfig.gameplay.totalPlayers; i++) {
            const container = this.add.container(i === 0 ? 0 : width, 0);

            // Background for this player's board
            const bgKey = i === 0 ? 'boardBG' : 'boardBG_Blue';
            const bg = this.add.image(width / 2, height / 2, bgKey).setDisplaySize(width, height);
            container.add(bg);

            const player: Player = {
                id: i + 1,
                name: `Player ${i + 1}`,
                container: container,
                coins: [],
                currentRound: 0,
                currentStage: 1,
                roomManager: new RoomManager(this),
                balanceDisplays: new Map(),
                stats: {
                    startingCash: GameConfig.gameplay.initialCash.reduce((a, b) => a + b, 0),
                    invested: 0,
                    returns: 0,
                    production: 0,
                    sales: 0,
                    indulgence: 0,
                    maintenance: 0,
                    fees: 0
                }
            };

            // Setup Board for this player
            GameConfig.rooms.forEach(def => {
                const room = new BoardRoom(this, def);
                player.container.add(room);
                player.roomManager.addRoom(def.id, room);
            });

            player.roomManager.onCoinCreated = (coin: Coin) => {
                player.container.add(coin);
                this.setupCoinInteractions(player, coin);
                player.coins.push(coin);
                player.roomManager.updateCoins(player.coins);
                this.updatePlayerBalances(player);
            };

            // Setup Production Slot Edit Handles
            GameConfig.production.slots.forEach((slot, index) => {
                const handle = this.add.circle(slot.x, slot.y, 12, 0x3498db, 0.8)
                    .setStrokeStyle(2, 0xffffff)
                    .setVisible(false);

                handle.setInteractive({ draggable: true });
                player.container.add(handle);
                this.slotHandles.push(handle);

                handle.on('drag', (_pointer: any, dragX: number, dragY: number) => {
                    handle.x = dragX;
                    handle.y = dragY;
                    GameConfig.production.slots[index].x = Math.round(dragX);
                    GameConfig.production.slots[index].y = Math.round(dragY);
                });

                handle.on('dragend', () => {
                    console.log(`Updated Slot ${index}: { x: ${Math.round(handle.x)}, y: ${Math.round(handle.y)} }`);
                });
            });

            // Initial Coins
            GameConfig.gameplay.initialCash.forEach((val, index) => {
                this.time.delayedCall(index * GameConfig.initialSetup.spawnDelay, () => {
                    this.spawnCoinForPlayer(player, 'cash', val);
                });
            });

            this.players.push(player);
        }

        // Initialize Effect Manager with stat tracking
        this.effectManager = new EffectManager(this, this.players[0].roomManager, (stat: string, amount: number) => {
            const p = this.getCurrentPlayer();
            if (p.stats[stat as keyof PlayerStats] !== undefined) {
                p.stats[stat as keyof PlayerStats] += amount;
            }
        });
    }

    private getCurrentPlayer(): Player {
        return this.players[this.currentPlayerIndex];
    }

    private spawnCoinForPlayer(player: Player, roomId: string, value: number) {
        const controller = player.roomManager.getController(roomId);
        if (!controller) return;

        const pos = controller.view.getRandomPoint();
        const coin = new Coin(this, pos.x, pos.y, value);
        player.container.add(coin);

        this.setupCoinInteractions(player, coin);

        player.coins.push(coin);
        coin.setScale(0);
        this.tweens.add({ targets: coin, scale: 1, duration: 300, ease: 'Back.easeOut' });
        player.roomManager.updateCoins(player.coins);
        this.updatePlayerBalances(player);
    }

    private setupCoinInteractions(player: Player, coin: Coin) {
        coin.on('coin-dropped', () => {
            player.roomManager.updateCoins(player.coins);
            this.updatePlayerBalances(player);
        });
    }

    private setupEvents() {
        this.events.on('draw-action-card', this.handleDrawSequence, this);
        this.events.on('spawn-coin', (data: { roomId: string, value: number }) => {
            this.spawnCoinInRoom(data.roomId, data.value);
        });

        // Card Interaction Events from UI
        this.events.on('card-action-confirm', this.handleCardConfirm, this);
        this.events.on('card-action-skip', this.handleCardSkip, this);
        this.events.on('request-sub-draw', (data: { deck: string, count: number }) => {
            this.time.delayedCall(800, () => this.handleDrawSequence(data.deck));
        });

        this.events.on('coin-destroyed', (coin: Coin) => {
            this.players.forEach(p => {
                if (p.coins.includes(coin)) {
                    p.coins = p.coins.filter(c => c !== coin);
                    p.roomManager.updateCoins(p.coins);
                    this.updatePlayerBalances(p);
                }
            });
            coin.destroy();
        });

        // Edit Mode
        this.input.keyboard?.on('keydown-E', () => this.toggleEditMode(true));
        this.input.keyboard?.on('keyup-E', () => this.toggleEditMode(false));

        // Dev Shortcuts
        this.input.keyboard?.on('keydown-L', () => {
            if (this.gameState !== GameState.IDLE) return;
            const wealthyMock = {
                id: 'dev_wealthy',
                type: 'WEALTHY_TRIGGER',
                title: 'Wealthy!',
                mandatory: true,
                effect: {
                    op: 'DRAW_FROM_DECK',
                    params: { deck: 'wealthyLucky', count: 1 }
                }
            };
            this.gameState = GameState.CARD_SHOWN;
            this.events.emit('show-card-overlay', wealthyMock);
        });

        this.input.keyboard?.on('keydown-P', () => {
            if (this.gameState !== GameState.IDLE) return;
            const productionMock = {
                id: 'dev_production',
                type: 'PRODUCTION',
                title: 'Production!',
                mandatory: false,
                effect: { op: 'ADD_GOODS', params: { maxSets: 3, costPerSet: 2 } }
            };
            this.currentCardData = productionMock;
            this.gameState = GameState.CARD_SHOWN;
            this.events.emit('show-card-overlay', productionMock);
        });

        this.input.keyboard?.on('keydown-S', () => {
            if (this.gameState !== GameState.IDLE) return;
            const saleMock = {
                id: 'dev_sale',
                type: 'SALES',
                title: 'Market Opportunity!',
                mandatory: false,
                effect: { op: 'DRAW_FROM_DECK', params: { deck: 'order', count: 1 } }
            };
            this.currentCardData = saleMock;
            this.gameState = GameState.CARD_SHOWN;
            this.events.emit('show-card-overlay', saleMock);
        });

        this.input.keyboard?.on('keydown-O', () => {
            if (this.gameState !== GameState.IDLE) return;
            const allOrders = this.deckManager.getAllCardsFromDeck('order');
            this.events.emit('show-order-selection', { orders: allOrders });
        });

        this.events.on('restart-game', () => {
            this.deckManager.resetDecks();
            this.currentPlayerIndex = 0;
            this.players = [];

            // Stop UI scene to ensure it also re-initializes
            if (this.scene.isActive('UIScene')) {
                this.scene.stop('UIScene');
            }

            this.scene.restart();
        });

        this.events.once('shutdown', () => {
            this.events.off('draw-action-card');
            this.events.off('spawn-coin');
            this.events.off('card-action-confirm');
            this.events.off('card-action-skip');
            this.events.off('request-sub-draw');
            this.events.off('coin-destroyed');
            this.events.off('restart-game');
            this.events.off('order-selected');
            this.events.off('show-order-selection');
        });
    }

    private handleDrawSequence(deckId: string = 'draw') {
        const isMainDraw = deckId === 'draw';
        if (isMainDraw && this.gameState !== GameState.IDLE) return;

        const cardData = this.deckManager.drawCard(deckId);
        if (!cardData) return;

        const p = this.getCurrentPlayer();
        this.isSubDraw = !isMainDraw;

        if (isMainDraw) {
            p.currentRound++;
            this.events.emit('update-hud', {
                stage: p.currentStage,
                round: p.currentRound,
                playerName: p.name,
                playerIndex: this.currentPlayerIndex,
                cash: p.roomManager.getRoomBalance('cash')
            });
        }

        this.currentCardData = cardData;
        this.gameState = GameState.CARD_SHOWN;
        this.events.emit('show-card-overlay', cardData);
    }

    private handleCardConfirm() {
        if (this.gameState !== GameState.CARD_SHOWN) return;
        const p = this.getCurrentPlayer();
        this.gameState = GameState.ANIMATING;

        const finalize = (subDrawStarted?: boolean) => {
            this.updatePlayerBalances(p);
            const isEntryFee = this.currentCardData.type === 'ENTRY_FEE';

            if (subDrawStarted) return;

            if (this.isSubDraw && isEntryFee) {
                this.gameState = GameState.IDLE;
                this.isSubDraw = false;
            } else {
                this.switchTurn();
            }
        };

        this.events.emit('dismiss-card-overlay', () => {
            p.roomManager.updateCoins(p.coins);
            this.updatePlayerBalances(p);
            this.effectManager.execute(this.currentCardData, finalize);
        });
    }

    private handleCardSkip() {
        if (this.gameState !== GameState.CARD_SHOWN) return;
        const p = this.getCurrentPlayer();
        const isEntryFee = this.currentCardData.type === 'ENTRY_FEE';
        this.gameState = GameState.ANIMATING;

        this.events.emit('dismiss-card-overlay', () => {
            this.updatePlayerBalances(p);
            if (this.isSubDraw && isEntryFee) {
                this.gameState = GameState.IDLE;
                this.isSubDraw = false;
            } else {
                this.switchTurn();
                this.isSubDraw = false;
            }
        });
    }

    private switchTurn() {
        this.gameState = GameState.ANIMATING;

        this.time.delayedCall(500, () => {
            const oldPlayer = this.getCurrentPlayer();

            // Process stage returns (interests) if rounds are complete
            if (oldPlayer.currentRound >= GameConfig.gameplay.roundsPerStage) {
                this.processStageReturns(oldPlayer, () => {
                    if (oldPlayer.currentStage >= GameConfig.gameplay.maxStages) {
                        if (this.currentPlayerIndex === GameConfig.gameplay.totalPlayers - 1) {
                            this.handleGameOver();
                            return;
                        }
                    }

                    oldPlayer.currentRound = 0;
                    oldPlayer.currentStage++;
                    this.proceedWithTurnSwitch(oldPlayer);
                });
            } else {
                this.proceedWithTurnSwitch(oldPlayer);
            }
        });
    }

    private proceedWithTurnSwitch(oldPlayer: Player) {
        const { width } = this.scale;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        const newPlayer = this.getCurrentPlayer();

        const direction = this.currentPlayerIndex === 1 ? -1 : 1;

        this.tweens.add({
            targets: oldPlayer.container,
            x: direction === -1 ? -width : width,
            duration: 800,
            ease: 'Cubic.easeInOut'
        });

        newPlayer.container.x = direction === -1 ? width : -width;
        this.tweens.add({
            targets: newPlayer.container,
            x: 0,
            duration: 800,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                this.isSubDraw = false;
                this.effectManager.updateRoomManager(newPlayer.roomManager);

                this.events.emit('update-hud', {
                    stage: newPlayer.currentStage,
                    round: newPlayer.currentRound,
                    playerName: newPlayer.name,
                    playerIndex: this.currentPlayerIndex,
                    cash: newPlayer.roomManager.getRoomBalance('cash')
                });

                if (newPlayer.currentRound === 0) {
                    this.gameState = GameState.ANIMATING;
                    this.time.delayedCall(500, () => this.triggerStageStart());
                } else {
                    this.gameState = GameState.IDLE;
                }
            }
        });
    }

    private triggerStageStart() {
        const rules = this.deckManager.getGlobalRules();
        const p = this.getCurrentPlayer();

        if (rules.roundStart && rules.roundStart.length > 0) {
            const feeEffect = rules.roundStart[0];
            const roundStartCard = {
                id: 'stage_start_rule',
                type: 'ENTRY_FEE',
                title: `Stage ${p.currentStage}: Entry Fee`,
                mandatory: true,
                effect: feeEffect
            };

            this.currentCardData = roundStartCard;
            this.gameState = GameState.CARD_SHOWN;
            this.isSubDraw = true;
            this.events.emit('show-card-overlay', roundStartCard);
        } else {
            this.gameState = GameState.IDLE;
        }
    }

    private processStageReturns(player: Player, onComplete: () => void) {
        const emergencyBal = player.roomManager.getRoomBalance('emergency');
        const investmentBal = player.roomManager.getRoomBalance('investment');

        const emergencyReturn = Math.floor(emergencyBal / 10) * 1;
        const investmentReturn = Math.floor(investmentBal / 10) * 2;
        const totalInterest = emergencyReturn + investmentReturn;

        // Sequence: Move Emergency -> Move Investment -> Spawn Interest -> Complete
        player.roomManager.moveCash('emergency', 'cash', emergencyBal, () => {
            player.roomManager.moveCash('investment', 'cash', investmentBal, () => {
                if (totalInterest > 0) {
                    player.stats.returns += totalInterest;

                    let remaining = totalInterest;
                    const values = GameConfig.coins.values;
                    const toSpawn: number[] = [];
                    while (remaining > 0) {
                        const val = values.find(v => v <= remaining) || 1;
                        toSpawn.push(val);
                        remaining -= val;
                    }

                    toSpawn.forEach((v, i) => {
                        this.time.delayedCall(i * 100, () => {
                            this.spawnCoinForPlayer(player, 'cash', v);
                            if (i === toSpawn.length - 1) {
                                this.time.delayedCall(1000, onComplete);
                            }
                        });
                    });
                } else {
                    onComplete();
                }
            });
        });
    }

    private handleGameOver() {
        this.gameState = GameState.ANIMATING;

        let winner: Player | null = null;
        let maxWealth = -1;
        let isDraw = false;

        const getPlayerTotalWealth = (p: Player) => {
            const cash = p.roomManager.getRoomBalance('cash');
            const emergency = p.roomManager.getRoomBalance('emergency');
            const investment = p.roomManager.getRoomBalance('investment');
            return cash + emergency + investment;
        };

        this.players.forEach(p => {
            const totalWealth = getPlayerTotalWealth(p);
            if (totalWealth > maxWealth) {
                maxWealth = totalWealth;
                winner = p;
                isDraw = false;
            } else if (totalWealth === maxWealth) {
                isDraw = true;
            }
        });

        const resultText = isDraw ? "IT'S A DRAW!" : `${(winner as Player | null)?.name} WINS!`;

        this.time.delayedCall(1000, () => {
            this.events.emit('show-gameover', {
                winnerName: resultText,
                playerStats: this.players.map((p: Player) => ({
                    name: p.name,
                    finalCash: getPlayerTotalWealth(p),
                    ...p.stats
                }))
            });
        });
    }

    private spawnCoinInRoom(roomId: string, value: number) {
        this.spawnCoinForPlayer(this.getCurrentPlayer(), roomId, value);
    }

    private updatePlayerBalances(player: Player) {
        if (player === this.getCurrentPlayer()) {
            this.events.emit('update-hud', { cash: player.roomManager.getRoomBalance('cash') });
        }
    }

    private toggleEditMode(enabled: boolean) {
        const p = this.getCurrentPlayer();
        GameConfig.rooms.forEach(def => p.roomManager.getController(def.id)?.view.setEditMode(enabled));
        this.slotHandles.forEach(h => {
            h.setVisible(enabled);
            if (enabled) h.setInteractive({ draggable: true });
            else h.disableInteractive();
        });
    }
}
