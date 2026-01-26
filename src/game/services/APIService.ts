import { Events } from 'phaser';
import { APIConfig } from '../utils/Constants';

export enum APIEvents {
    API_READY = 'API_READY',
    API_ERROR = 'API_ERROR'
}

export class APIService extends Events.EventEmitter {
    private static instance: APIService;

    // API Data
    private nonceValue: string = "";
    private domainName: string = "";
    private userInstance: number = 0;

    // State
    public level: number = 1;
    public isInitialized: boolean = false;
    public apiSuccess: boolean = false;
    public isFailed: boolean = false;
    private isSessionActive: boolean = false;

    private constructor() {
        super();
        this.init();
    }

    public static getInstance(): APIService {
        if (!APIService.instance) {
            APIService.instance = new APIService();
        }
        return APIService.instance;
    }

    private async init() {
        if (!APIConfig.USE_API) {
            this.isInitialized = true;
            this.apiSuccess = true;
            this.emit(APIEvents.API_READY);
            return;
        }

        try {
            if (APIConfig.IS_TESTING) {
                this.domainName = APIConfig.DOMAIN_TEST;
            } else {
                this.domainName = this.getIframeData() || "";
            }

            if (!this.domainName) {
                throw new Error("No domain name found");
            }

            await this.fetchNonce();
        } catch (e) {
            console.error("APIService: Initialization failed.", e);
            this.isFailed = true;
            this.emit(APIEvents.API_ERROR, e);
        }
    }

    private getIframeData(): string | null {
        try {
            const iframe = window.parent.document.getElementById(APIConfig.IFRAME_ID) as HTMLIFrameElement;
            if (iframe) {
                return iframe.getAttribute('data-game');
            }
            console.error(`APIService: Iframe with id '${APIConfig.IFRAME_ID}' not found.`);
        } catch (e) {
            console.error("APIService: Error accessing parent iframe.", e);
        }
        return null;
    }

    private async fetchNonce() {
        try {
            const response = await fetch(this.domainName + APIConfig.GATEWAY_1);
            const result = await response.json();

            if (result.success) {
                this.nonceValue = result.data;
                await this.fetchGameResult();
            } else {
                throw new Error("Nonce fetch failed");
            }
        } catch (e) {
            console.error("APIService: API_1 (Nonce) failed.", e);
            this.isFailed = true;
            this.emit(APIEvents.API_ERROR, e);
        }
    }

    private async fetchGameResult() {
        try {
            const url = `${this.domainName}${APIConfig.GATEWAY_2}?gameid=${APIConfig.GAME_ID}`;
            const response = await fetch(url, {
                headers: {
                    'X-WP-Nonce': this.nonceValue
                }
            });
            const result = await response.json();

            this.level = result.Level || 1;
            this.apiSuccess = true;
            this.isInitialized = true;
            this.emit(APIEvents.API_READY);
        } catch (e) {
            console.error("APIService: API_2 (Game Result) failed.", e);
            this.isFailed = true;
            this.emit(APIEvents.API_ERROR, e);
        }
    }

    public async postStart(level: number, sound: boolean, music: boolean) {
        if (!APIConfig.USE_API) return;
        if (this.isSessionActive) {
            console.warn("APIService: Session already active. Skipping duplicate postStart.");
            return;
        }
        this.isSessionActive = true;

        try {
            const url = this.domainName + APIConfig.GATEWAY_3;
            const data = {
                GameID: APIConfig.GAME_ID,
                Level: level,
                GameStartLocalDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                SoundOnOff: sound ? 1 : 0,
                MusicOnOff: music ? 1 : 0,
                LevelPassed: 0,
                islevelend: 0
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': this.nonceValue
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            this.userInstance = result.userinstance;
        } catch (e) {
            console.error("Failed:", e);
            this.isSessionActive = false; // Allow retry on failure
        }
    }

    public async postEnd(points: number, total: number, levelData: string, completed: boolean) {
        if (!APIConfig.USE_API) return;
        if (!this.isSessionActive) {
            console.warn("APIService: No active session to end. Skipping postEnd.");
            return;
        }
        this.isSessionActive = false; // Immediately clear

        try {
            const url = this.domainName + APIConfig.GATEWAY_4;
            const data = {
                userinstance: this.userInstance,
                PointsEarned: points,
                TotalPoints: total,
                GameEndLocalDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                LevelPassed: completed ? 1 : 0,
                islevelend: 1,
                LevelData: levelData
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': this.nonceValue
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            this.userInstance = result.userinstance;
        } catch (e) {
            console.error("Failed:", e);
        }
    }
}
