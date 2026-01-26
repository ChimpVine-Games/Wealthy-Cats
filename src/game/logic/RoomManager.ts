import { Scene } from 'phaser';
import { BoardRoom } from '../components/BoardRoom';
import { Coin } from '../components/Coin';
import { RoomController } from './RoomController';
import { CashRoomController } from './CashRoomController';
import { GoodsRoomController } from './GoodsRoomController';
import { GameConfig } from '../utils/GameConfig';

export class RoomManager {
    private scene: Scene;
    private controllers: Map<string, RoomController> = new Map();
    private coins: Coin[] = [];
    public onCoinCreated?: (coin: Coin) => void;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public addRoom(id: string, view: BoardRoom) {
        let controller: RoomController;

        switch (id) {
            case 'cash':
            case 'emergency':
            case 'investment':
                controller = new CashRoomController(this.scene, view, this);
                break;
            case 'goods':
                controller = new GoodsRoomController(this.scene, view, this);
                break;
            default:
                // For now, generic rooms use a basic controller
                controller = new (class extends RoomController {
                    handleEffect() { }
                })(this.scene, view, this);
        }

        this.controllers.set(id, controller);
    }

    public getController<T extends RoomController>(id: string): T | undefined {
        return this.controllers.get(id) as T;
    }

    public updateCoins(coins: Coin[]) {
        this.coins = coins;
    }

    public getRoomBalance(roomId: string): number {
        const controller = this.controllers.get(roomId);
        return controller ? controller.getBalance(this.coins) : 0;
    }

    public moveCash(fromId: string, toId: string, amount: number, onComplete?: () => void) {
        if (amount <= 0) {
            if (onComplete) onComplete();
            return;
        }

        const fromCtrl = this.getController<CashRoomController>(fromId);
        const toCtrl = this.controllers.get(toId);

        if (!fromCtrl || !toCtrl) {
            if (onComplete) onComplete();
            return;
        }

        const selected = fromCtrl.selectCoinsForAmount(this.coins, amount);
        const totalSelected = selected.reduce((sum, c) => sum + c.getValue(), 0);

        if (totalSelected === amount) {
            selected.forEach((coin, i) => {
                const targetPos = toCtrl.view.getRandomPoint();
                this.scene.tweens.add({
                    targets: coin,
                    x: targetPos.x,
                    y: targetPos.y,
                    delay: i * GameConfig.visuals.coinStaggerDelay,
                    duration: GameConfig.visuals.coinGlideDuration,
                    ease: 'Power2.easeInOut',
                    onComplete: () => {
                        if (i === selected.length - 1 && onComplete) onComplete();
                    }
                });
            });
        } else {
            // Need a break
            const availableCoins = fromCtrl.getCoinsInRoom(this.coins);
            const biggerCoin = availableCoins
                .filter(c => c.getValue() > amount)
                .sort((a, b) => a.getValue() - b.getValue())[0];

            if (biggerCoin) {
                fromCtrl.breakCoin(biggerCoin, this.coins, (_newCoins) => {
                    this.moveCash(fromId, toId, amount, onComplete);
                });
            } else {
                // Cannot move the requested amount and cannot break further
                if (onComplete) onComplete();
            }
        }
    }

    public handleProduction(slots: number, totalCost: number, onComplete?: () => void) {
        const cashCtrl = this.getController<CashRoomController>('cash');
        const goodsCtrl = this.getController<GoodsRoomController>('goods');

        if (!cashCtrl || !goodsCtrl) {
            if (onComplete) onComplete();
            return;
        }

        if (totalCost <= 0 || slots <= 0) {
            if (onComplete) onComplete();
            return;
        }

        const availableCoins = cashCtrl.getCoinsInRoom(this.coins);
        const selected = cashCtrl.selectCoinsForAmount(availableCoins, totalCost);
        const totalSelected = selected.reduce((sum, c) => sum + c.getValue(), 0);

        if (totalSelected === totalCost) {
            const costPerSlot = totalCost / slots;
            const buckets = goodsCtrl.partitionCoinsIntoBuckets(selected, slots, costPerSlot);
            goodsCtrl.animateToSlots(buckets, onComplete);
        } else {
            const biggerCoin = availableCoins
                .filter(c => c.getValue() > totalCost)
                .sort((a, b) => a.getValue() - b.getValue())[0];

            if (biggerCoin) {
                cashCtrl.breakCoin(biggerCoin, this.coins, () => {
                    this.handleProduction(slots, totalCost, onComplete);
                });
            } else {
                if (onComplete) onComplete();
            }
        }
    }

    public handleSale(quantity: number, onComplete?: () => void) {
        const goodsCtrl = this.getController<GoodsRoomController>('goods');
        const activeCtrl = this.controllers.get('active');
        if (!goodsCtrl || !activeCtrl) return;

        const roomCoins = goodsCtrl.getCoinsInRoom(this.coins);
        // 1 jar = 2 coins (cost per set)
        const coinsToRemove = quantity * 2;
        const toRemove = roomCoins.slice(0, coinsToRemove);

        if (toRemove.length > 0) {
            // Move to 'Active' room instead of 'Basic'
            toRemove.forEach((coin, i) => {
                const targetPos = activeCtrl.view.getRandomPoint();
                this.scene.tweens.add({
                    targets: coin,
                    x: targetPos.x,
                    y: targetPos.y,
                    duration: GameConfig.visuals.coinGlideDuration,
                    delay: i * GameConfig.visuals.coinStaggerDelay,
                    ease: 'Power2.easeInOut',
                    onComplete: () => {
                        if (i === toRemove.length - 1 && onComplete) onComplete();
                    }
                });
            });
        } else if (onComplete) {
            onComplete();
        }
    }
}
