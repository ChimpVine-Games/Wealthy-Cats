import { Scene } from 'phaser';
import { RoomController } from './RoomController';
import { BoardRoom } from '../components/BoardRoom';
import { Coin } from '../components/Coin';
import { GameConfig } from '../utils/GameConfig';

export class GoodsRoomController extends RoomController {
    constructor(scene: Scene, view: BoardRoom, manager: any) {
        super(scene, view, manager);
    }

    public handleEffect(_op: string, _params: any, _allCoins: Coin[]): void {
        // Logic for ADD_GOODS handled via specific method call from RoomManager
    }

    public partitionCoinsIntoBuckets(coins: Coin[], numBuckets: number, targetPerBucket: number): Coin[][] {
        const buckets: Coin[][] = Array.from({ length: numBuckets }, () => []);
        const sortedCoins = [...coins].sort((a, b) => b.getValue() - a.getValue());

        for (let i = 0; i < numBuckets; i++) {
            let currentSum = 0;
            for (let j = 0; j < sortedCoins.length; j++) {
                const coin = sortedCoins[j];
                if (coin && currentSum + coin.getValue() <= targetPerBucket) {
                    buckets[i].push(coin);
                    currentSum += coin.getValue();
                    sortedCoins.splice(j, 1);
                    j--;
                }
            }
        }

        if (sortedCoins.length > 0) {
            buckets[0].push(...sortedCoins);
        }

        return buckets;
    }

    public animateToSlots(buckets: Coin[][], onComplete?: () => void) {
        const slotCoords = GameConfig.production.slots;
        let totalCoins = 0;
        buckets.forEach(b => totalCoins += b.length);

        if (totalCoins === 0) {
            if (onComplete) onComplete();
            return;
        }

        let completedCount = 0;
        buckets.forEach((bucket, slotIndex) => {
            const target = slotCoords[slotIndex];
            bucket.forEach((coin, coinIndex) => {
                this.scene.tweens.add({
                    targets: coin,
                    x: target.x + (Math.random() * 8 - 4),
                    y: target.y + (Math.random() * 8 - 4) - (coinIndex * 4),
                    delay: (slotIndex * 100) + (coinIndex * 50),
                    duration: GameConfig.visuals.coinGlideDuration,
                    ease: 'Power2.easeInOut',
                    onComplete: () => {
                        completedCount++;
                        if (completedCount === totalCoins && onComplete) onComplete();
                    }
                });
            });
        });
    }
}
