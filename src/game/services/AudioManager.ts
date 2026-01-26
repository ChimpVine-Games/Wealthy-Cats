import { Scene, Sound } from 'phaser';

export class AudioManager {
    private static instance: AudioManager;
    private scene: Scene;
    private music: Sound.BaseSound | null = null;
    private musicVolume: number = 0.5;
    private sfxVolume: number = 0.5;
    private musicMuted: boolean = false;
    private sfxMuted: boolean = false;

    private constructor() {
        this.loadSettings();
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public init(scene: Scene) {
        this.scene = scene;
    }

    private loadSettings() {
        const musicVol = localStorage.getItem('wealthy-cats-music-volume');
        const sfxVol = localStorage.getItem('wealthy-cats-sfx-volume');
        const musicMute = localStorage.getItem('wealthy-cats-music-muted');
        const sfxMute = localStorage.getItem('wealthy-cats-sfx-muted');

        if (musicVol !== null) this.musicVolume = parseFloat(musicVol);
        if (sfxVol !== null) this.sfxVolume = parseFloat(sfxVol);
        if (musicMute !== null) this.musicMuted = musicMute === 'true';
        if (sfxMute !== null) this.sfxMuted = sfxMute === 'true';
    }

    private saveSettings() {
        localStorage.setItem('wealthy-cats-music-volume', this.musicVolume.toString());
        localStorage.setItem('wealthy-cats-sfx-volume', this.sfxVolume.toString());
        localStorage.setItem('wealthy-cats-music-muted', this.musicMuted.toString());
        localStorage.setItem('wealthy-cats-sfx-muted', this.sfxMuted.toString());
    }

    public setMusicVolume(volume: number) {
        this.musicVolume = volume;
        if (this.music && !this.musicMuted) {
            (this.music as Sound.WebAudioSound | Sound.HTML5AudioSound).setVolume(volume);
        }
        this.saveSettings();
    }

    public setSFXVolume(volume: number) {
        this.sfxVolume = volume;
        this.saveSettings();
    }

    public setMusicMuted(muted: boolean) {
        this.musicMuted = muted;
        if (this.music) {
            (this.music as Sound.WebAudioSound | Sound.HTML5AudioSound).setVolume(muted ? 0 : this.musicVolume);
        }
        this.saveSettings();
    }

    public setSFXMuted(muted: boolean) {
        this.sfxMuted = muted;
        this.saveSettings();
    }

    public playMusic(key: string, loop: boolean = true) {
        if (!this.scene) return;

        if (this.music) {
            this.music.stop();
            this.music.destroy();
        }

        this.music = this.scene.sound.add(key, { loop, volume: this.musicMuted ? 0 : this.musicVolume });
        this.music.play();
    }

    public stopMusic() {
        if (this.music) {
            this.music.stop();
        }
    }

    public playSFX(key: string) {
        if (!this.scene || this.sfxMuted) return;
        this.scene.sound.play(key, { volume: this.sfxVolume });
    }

    public getMusicVolume(): number {
        return this.musicVolume;
    }

    public getSFXVolume(): number {
        return this.sfxVolume;
    }

    public isMusicMuted(): boolean {
        return this.musicMuted;
    }

    public isSFXMuted(): boolean {
        return this.sfxMuted;
    }
}
