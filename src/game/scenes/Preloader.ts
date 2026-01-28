import { Scene } from 'phaser';
import { AssetManager } from '../utils/AssetManager';
import { APIService, APIEvents } from '../services/APIService';
import { GameDataManager } from '../services/GameDataManager';
import { APIConfig } from '../utils/Constants';
import { AudioManager } from '../services/AudioManager';

export class Preloader extends Scene {
    private apiReady: boolean = false;
    private assetsLoaded: boolean = false;

    constructor() {
        super('Preloader');
    }

    init() {
        // API Status Handling
        const api = APIService.getInstance();

        const onApiReady = () => {
            GameDataManager.getInstance().syncFromAPI(api.level);
            this.apiReady = true;
            this.checkReady();
        };

        const onApiError = (_err: any) => {

            // If USE_API is true, we stay here.
            // We could optionally retry or just let the user see the failed state.
            // Following user request to stay on page until status is OK.
            if (!APIConfig.USE_API) {
                // If not using API, we treat errors as "OK" for offline play
                this.apiReady = true;
                this.checkReady();
            }
        };

        if (api.isInitialized) {
            onApiReady();
        } else if (api.isFailed) {
            onApiError("API Failed during initialization");
        } else {
            api.once(APIEvents.API_READY, onApiReady);
            api.once(APIEvents.API_ERROR, onApiError);

            // Only add safety timeout if USE_API is false (offline mode allowed)
            if (!APIConfig.USE_API) {
                this.time.delayedCall(3000, () => {
                    if (!this.apiReady) {
                        onApiError("Timeout");
                    }
                });
            }
        }
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('logo', 'CV_Logo.png');
        this.load.image('boardBG', 'Player1/WC-Fixed-Yellow board.png');
        this.load.image('boardBG_Blue', 'Player1/WC-Fixed-Blue board.png');
        this.load.image('pipe_vertical', 'First_Game/VerticlePipe.png');

        this.load.image('balance_arm', 'ClawGame/balance_arm.png');
        this.load.image('balance_base', 'ClawGame/balance_base.png');
        this.load.image('claw', 'ClawGame/Claw.png');
        this.load.spritesheet('chimpu_run', 'chimpu_run.png', { frameWidth: 170, frameHeight: 144 });
        this.load.spritesheet('heart', 'heartSpriteSheet.png', { frameWidth: 97, frameHeight: 76 });
        this.load.spritesheet('heart', 'heartSpriteSheet.png', { frameWidth: 97, frameHeight: 76 });

        this.load.image('back_icon', 'globalUI/backBtn.png');
        this.load.image('settings_icon', 'globalUI/settingsBtn.png');
        this.load.image('pause_icon', 'globalUI/pauseBtn.png');

        this.load.image('settings_bg', 'globalUI/settingsBG.png');
        this.load.image('paused_bg', 'globalUI/pausedBG.png');
        this.load.image('musicon', 'globalUI/musicon.png');
        this.load.image('musicoff', 'globalUI/musicoff.png');
        this.load.image('sfxon', 'globalUI/sfxon.png');
        this.load.image('sfxoff', 'globalUI/sfxoff.png');
        this.load.image('pause_panel_btn', 'globalUI/pausePanelButtons.png');
        this.load.image('close_icon', 'globalUI/closeBtn.png');


        this.load.image('next_icon', 'globalUI/nextBtn.png');
        this.load.image('retry_icon', 'globalUI/retryBtn.png');
        this.load.image('home_icon', 'globalUI/homeBtn.png');
        this.load.image('cookie_jar', 'cookie_jar.png');

        this.load.setPath('assets/loading');
        this.load.image('cv_logo_text', 'Text_CV_Logo.png');

        /*
        this.load.setPath('assets/audio');
        this.load.audio('bg_music', 'bg_music.mp3');
        this.load.audio('success', 'success.mp3');
        this.load.audio('click', 'click.mp3');
        this.load.audio('level_win', 'level_win.mp3');
        this.load.audio('game_over', 'game_over.mp3');
        this.load.audio('fail', 'failure.mp3');
        */

        this.load.once('complete', () => {
            this.assetsLoaded = true;
            this.checkReady();
        });
    }

    create() {
        AssetManager.generateTextures(this);
        this.sound.pauseOnBlur = false;

        const audio = AudioManager.getInstance();
        audio.init(this);

        if (!this.scene.isActive('GlobalUI')) {
            this.scene.launch('GlobalUI');
        }
        this.scene.bringToTop('GlobalUI');
    }

    private checkReady() {
        if (this.apiReady && this.assetsLoaded) {
            this.scene.start('Game');
        }
    }
}
