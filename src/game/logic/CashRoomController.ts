import { Scene } from 'phaser';
import { RoomController } from './RoomController';
import { BoardRoom } from '../components/BoardRoom';
import { Coin } from '../components/Coin';
import { GameConfig } from '../utils/GameConfig';

export class CashRoomController extends RoomController {
    constructor(scene: Scene, view: BoardRoom, manager: any) {
        super(scene, view, manager);
    }

    public handleEffect(op: string, params: any, allCoins: Coin[]): void {
        // Cash room specific global effects could go here
    }

    public selectCoinsForAmount(allCoins: Coin[], target: number): Coin[] {
        const roomCoins = this.getCoinsInRoom(allCoins);
        const sorted = [...roomCoins].sort((a, b) => b.getValue() - a.getValue());
        const selected: Coin[] = [];
        let current = 0;

        for (const c of sorted) {
            if (current + c.getValue() <= target) {
                selected.push(c);
                current += c.getValue();
            }
        }
        return selected;
    }

    public breakCoin(coin: Coin, coinsArray: Coin[], onComplete: (newCoins: Coin[]) => void) {
        const val = coin.getValue();
        const pos = { x: coin.x, y: coin.y };

        // Break animation: pulse and disappear
        this.scene.tweens.add({
            targets: coin,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.scene.events.emit('coin-destroyed', coin);

                let remaining = val;
                const breakdown: number[] = [];
                const possible = GameConfig.coins.values.filter(v => v < val);

                while (remaining > 0) {
                    const next = possible.find(v => v <= remaining) || 1;
                    breakdown.push(next);
                    remaining -= next;
                }

                let completedCount = 0;
                const newCoins: Coin[] = [];
                breakdown.forEach((v, i) => {
                    this.scene.time.delayedCall(i * 50, () => {
                        const newCoin = new Coin(this.scene, pos.x, pos.y, v);
                        if (this.manager.onCoinCreated) this.manager.onCoinCreated(newCoin);
                        newCoins.push(newCoin);

                        this.scene.tweens.add({
                            targets: newCoin,
                            x: newCoin.x + (Math.random() * 60 - 30),
                            y: newCoin.y + (Math.random() * 60 - 30),
                            duration: 400,
                            ease: 'Cubic.easeOut',
                            onComplete: () => {
                                completedCount++;
                                if (completedCount === breakdown.length) {
                                    onComplete(newCoins);
                                }
                            }
                        });
                    });
                });
            }
        });
    }
}
