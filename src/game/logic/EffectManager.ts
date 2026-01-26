import { Scene } from 'phaser';
import { RoomManager } from './RoomManager';
import { GameConfig } from '../utils/GameConfig';

export class EffectManager {
    private scene: Scene;
    private roomManager: RoomManager;
    private onStatUpdate?: (stat: string, amount: number) => void;

    constructor(scene: Scene, roomManager: RoomManager, onStatUpdate?: (stat: string, amount: number) => void) {
        this.scene = scene;
        this.roomManager = roomManager;
        this.onStatUpdate = onStatUpdate;
    }

    public updateRoomManager(rm: RoomManager) {
        this.roomManager = rm;
    }

    public execute(data: any, onComplete: (subDrawStarted?: boolean) => void) {
        const { op, params } = data.effect;
        const roomMapping: Record<string, string> = {
            'maintenance': 'basic',
            'indulgence': 'candy',
            'cash': 'cash',
            'emergency': 'emergency',
            'longTerm': 'investment',
            'production': 'goods'
        };

        switch (op) {
            case 'MOVE_CASH':
                const fromId = roomMapping[params.from] || params.from;
                const toId = roomMapping[params.to] || params.to;

                if (params.amount === 'USER_INPUT') {
                    this.handleUserInput(data.title, fromId, toId, onComplete);
                } else {
                    this.roomManager.moveCash(fromId, toId, params.amount, onComplete);

                    // Track Stats
                    if (this.onStatUpdate) {
                        const isEntryFee = data.type === 'ENTRY_FEE';
                        if (isEntryFee) {
                            this.onStatUpdate('fees', params.amount);
                        } else if (toId === 'emergency' || toId === 'investment') {
                            this.onStatUpdate('invested', params.amount);
                        } else if (toId === 'candy') {
                            this.onStatUpdate('indulgence', params.amount);
                        } else if (toId === 'basic') {
                            this.onStatUpdate('maintenance', params.amount);
                        }
                    }
                }
                break;

            case 'ADD_GOODS':
                this.handleProduction(params.costPerSet, onComplete);
                break;

            case 'CASH_DELTA':
                if (params.amount > 0) {
                    this.handleGainCash(params.amount, onComplete);
                    if (this.onStatUpdate) this.onStatUpdate('returns', params.amount);
                } else {
                    onComplete();
                }
                break;

            case 'DRAW_FROM_DECK':
                if (params.deck === 'order') {
                    const goodsBalance = this.roomManager.getRoomBalance('goods');
                    const availableJars = Math.floor(goodsBalance / 2); // 2 coins per jar

                    if (availableJars <= 0) {
                        console.log("No goods in stock to satisfy any order!");
                        onComplete();
                        return;
                    }

                    // Get ALL orders and filter by what the player can handle
                    // We need DeckManager instance here or pass it in
                    const deckManager = (this.scene as any).deckManager; // Accessible in Game scene
                    if (!deckManager) {
                        onComplete();
                        return;
                    }

                    const allOrders = deckManager.getAllCardsFromDeck('order');
                    const validOrders = allOrders.filter((card: any) => card.effect.params.quantity <= availableJars);

                    if (validOrders.length === 0) {
                        console.log("No orders satisfy current stock!");
                        onComplete();
                        return;
                    }

                    this.scene.events.emit('show-order-selection', { orders: validOrders });

                    // Wait for selection to proceed
                    this.scene.events.once('order-selected', (selectedOrder: any) => {
                        this.execute(selectedOrder, onComplete);
                    });

                    onComplete(true); // subDrawStarted = true
                } else {
                    this.scene.events.emit('request-sub-draw', {
                        deck: params.deck,
                        count: params.count || 1
                    });
                    onComplete(true); // subDrawStarted = true
                }
                break;

            case 'SELL_GOODS':
                // logic: remove 'quantity' coins from goods, then gain 'payout' cash
                this.handleSale(params.quantity, params.payout, onComplete);
                break;

            default:
                console.log(`Effect ${op} not yet automated.`);
                onComplete();
                break;
        }
    }

    private handleUserInput(title: string, fromId: string, toId: string, onComplete: () => void) {
        const balance = this.roomManager.getRoomBalance(fromId);

        this.scene.events.emit('show-deposit-panel', {
            title: title,
            maxAmount: balance
        });

        this.scene.events.once('deposit-provided', (amount: number) => {
            this.roomManager.moveCash(fromId, toId, amount, onComplete);
            if (this.onStatUpdate) {
                if (toId === 'emergency' || toId === 'investment') {
                    this.onStatUpdate('invested', amount);
                } else if (toId === 'candy') {
                    this.onStatUpdate('indulgence', amount);
                }
            }
        });
    }

    private handleProduction(costPerSlot: number, onComplete: () => void) {
        const balance = this.roomManager.getRoomBalance('cash');

        this.scene.events.emit('show-production-panel', {
            costPerSlot,
            currentCash: balance,
            maxSlots: GameConfig.production.maxSlots
        });

        this.scene.events.once('production-provided', (data: { slots: number, totalCost: number }) => {
            this.roomManager.handleProduction(data.slots, data.totalCost, onComplete);
            if (this.onStatUpdate) this.onStatUpdate('production', data.totalCost);
        });
    }

    private handleGainCash(amount: number, onComplete: () => void) {
        if (amount <= 0) {
            onComplete();
            return;
        }

        let remaining = amount;
        const values = GameConfig.coins.values;
        const toSpawn: number[] = [];

        while (remaining > 0) {
            const val = values.find(v => v <= remaining) || 1;
            toSpawn.push(val);
            remaining -= val;
        }

        toSpawn.forEach((val, i) => {
            this.scene.time.delayedCall(i * GameConfig.initialSetup.spawnDelay, () => {
                this.scene.events.emit('spawn-coin', { roomId: 'cash', value: val });
                if (i === toSpawn.length - 1) onComplete();
            });
        });
    }

    private handleSale(quantity: number, payout: number, onComplete: () => void) {
        this.roomManager.handleSale(quantity, () => {
            this.handleGainCash(payout, onComplete);
            if (this.onStatUpdate) this.onStatUpdate('sales', payout);
        });
    }
}
