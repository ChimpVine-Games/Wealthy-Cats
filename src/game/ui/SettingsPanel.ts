import { GameObjects, Scene } from 'phaser';
import { Slider } from './Slider';
import { IconButton } from './IconButton';
import { AudioManager } from '../services/AudioManager';
import { UILayers } from '../utils/UILayers';

export class SettingsPanel {
    private container: GameObjects.Container;
    private overlay: GameObjects.Rectangle;
    private panel: GameObjects.Image;
    private closeButton: IconButton;
    private musicSlider: Slider;
    private sfxSlider: Slider;
    private musicToggle: IconButton;
    private sfxToggle: IconButton;
    private audioManager: AudioManager;

    constructor(scene: Scene, onClose: () => void) {
        this.audioManager = AudioManager.getInstance();
        const { width, height } = scene.scale;
        // Semi-transparent overlay (high depth to block all input)
        this.overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
            .setInteractive()
            .setDepth(UILayers.MODAL_BACKGROUND)
            .setScrollFactor(0);

        // Main container
        this.container = scene.add.container(width / 2, height / 2)
            .setDepth(UILayers.MODAL_PANEL)
            .setScrollFactor(0);
        // Panel background
        this.panel = scene.add.image(0, 0, 'settings_bg');

        // Music Section
        const musicIsMuted = this.audioManager.isMusicMuted();
        this.musicToggle = new IconButton(
            scene,
            -140,
            -40,
            musicIsMuted ? 'musicoff' : 'musicon',
            () => {
                const isMuted = !this.audioManager.isMusicMuted();
                this.audioManager.setMusicMuted(isMuted);
                this.musicToggle.sprite.setTexture(isMuted ? 'musicoff' : 'musicon');

                // If muted, set slider to 0, otherwise restore volume
                const volume = isMuted ? 0 : this.audioManager.getMusicVolume();
                this.musicSlider.setValue(volume, false);
            }
        );

        this.musicSlider = new Slider(
            scene,
            -80,
            -40,
            260,
            (value: number) => {
                this.audioManager.setMusicVolume(value);
                // Dynamic responsive update
                const shouldMute = value === 0;
                if (shouldMute !== this.audioManager.isMusicMuted()) {
                    this.audioManager.setMusicMuted(shouldMute);
                }
                this.musicToggle.sprite.setTexture(this.audioManager.isMusicMuted() ? 'musicoff' : 'musicon');
            },
            this.audioManager.getMusicVolume()
        );

        // SFX Section
        const sfxIsMuted = this.audioManager.isSFXMuted();
        this.sfxToggle = new IconButton(
            scene,
            -140,
            80,
            sfxIsMuted ? 'sfxoff' : 'sfxon',
            () => {
                const isMuted = !this.audioManager.isSFXMuted();
                this.audioManager.setSFXMuted(isMuted);
                this.sfxToggle.sprite.setTexture(isMuted ? 'sfxoff' : 'sfxon');

                // If muted, set slider to 0, otherwise restore volume
                const volume = isMuted ? 0 : this.audioManager.getSFXVolume();
                this.sfxSlider.setValue(volume, false);
            }
        );

        this.sfxSlider = new Slider(
            scene,
            -80,
            80,
            260,
            (value: number) => {
                this.audioManager.setSFXVolume(value);
                // Dynamic responsive update
                const shouldMute = value === 0;
                if (shouldMute !== this.audioManager.isSFXMuted()) {
                    this.audioManager.setSFXMuted(shouldMute);
                }
                this.sfxToggle.sprite.setTexture(this.audioManager.isSFXMuted() ? 'sfxoff' : 'sfxon');
            },
            this.audioManager.getSFXVolume()
        );

        // Close button (Bottom Right Corner)
        this.closeButton = new IconButton(
            scene,
            210,
            185,
            'close_icon',
            () => {
                this.destroy();
                onClose();
            }
        );

        this.container.add([this.panel]);
        this.container.add(this.musicSlider.container);
        this.container.add(this.sfxSlider.container);
        this.container.add(this.musicToggle.sprite);
        this.container.add(this.sfxToggle.sprite);
        this.container.add(this.closeButton.sprite);

        this.container.bringToTop(this.musicSlider.container);
        this.container.bringToTop(this.sfxSlider.container);
    }



    public destroy() {
        this.overlay.destroy();
        this.musicSlider.destroy();
        this.sfxSlider.destroy();
        this.musicToggle.destroy();
        this.sfxToggle.destroy();
        this.closeButton.destroy();
        this.container.destroy();
    }
}
