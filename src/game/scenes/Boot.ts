import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        this.load.setPath('assets');
        this.load.spritesheet('chimpu_run', 'chimpu_run.png', { frameWidth: 170, frameHeight: 144 });
    }

    create() {
        this.cameras.main.setBackgroundColor('#231F20');
        this.scene.start('Preloader');
    }
}
