import { Scene } from 'phaser';

export class GlobalUI extends Scene {

    constructor() {
        super({ key: 'GlobalUI' });
    }

    create() {
        // Keep this scene above others
        this.scene.bringToTop();
    }
}
