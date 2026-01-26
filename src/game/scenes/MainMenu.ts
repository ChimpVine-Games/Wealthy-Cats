import { Scene, GameObjects } from 'phaser';
import { IconButton } from '../ui/IconButton';
import { SettingsPanel } from '../ui/SettingsPanel';
import { UILayers } from '../utils/UILayers';
import { SpriteButton } from '../ui/SpriteButton';
import { AudioManager } from '../services/AudioManager';

export class MainMenu extends Scene {
    background: GameObjects.Rectangle;
    gradientBg: GameObjects.Rectangle[];
    title: GameObjects.Text;
    titleShadow: GameObjects.Text;
    particles: Phaser.GameObjects.Particles.ParticleEmitter[];

    constructor() {
        super('MainMenu');
    }

    create() {

        const { width, height } = this.scale;

        // Background Image
        this.add.image(width / 2, height / 2, 'bg')
            .setDisplaySize(width, height)
            .setDepth(UILayers.GAME_BACKGROUND);

        let isStarting = false;
        new SpriteButton(
            this,
            width / 2,
            height / 2 + 300,
            'playButton',
            () => {
                if (isStarting) return;
                isStarting = true;
                this.scene.start('Game');
            }
        ).setDepth(UILayers.UI_BUTTONS).setScale(0.5);

        // Settings button (top right)
        this.addSettingsButton(width, 50);

        // Play BGM
        try {
            AudioManager.getInstance().playMusic('bg_music');
        } catch (e) {
            // Error playing music
        }
    }

    private addSettingsButton(_width: number, margin: number) {
        const settingsBtn = new IconButton(
            this,
            margin + 50,
            margin + 50,
            'settings_icon',
            () => {
                new SettingsPanel(this, () => { });
            }
        );
        settingsBtn.setDepth(UILayers.UI_BUTTONS);
        settingsBtn.setVisible(false);
    }
}
