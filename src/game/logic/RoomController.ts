import { Scene } from 'phaser';
import { BoardRoom } from '../components/BoardRoom';
import { Coin } from '../components/Coin';

export abstract class RoomController {
    public id: string;
    public view: BoardRoom;
    protected scene: Scene;
    protected manager: any; // Type 'any' to avoid circular dependency in basic way or use forward ref

    constructor(scene: Scene, view: BoardRoom, manager: any) {
        this.scene = scene;
        this.view = view;
        this.manager = manager;
        this.id = view.getID();
    }

    public getBalance(coins: Coin[]): number {
        return this.getCoinsInRoom(coins)
            .reduce((sum, c) => sum + c.getValue(), 0);
    }

    public getCoinsInRoom(coins: Coin[]): Coin[] {
        return coins.filter(c => this.view.contains(c.x, c.y));
    }

    public abstract handleEffect(op: string, params: any, allCoins: Coin[]): void;
}
