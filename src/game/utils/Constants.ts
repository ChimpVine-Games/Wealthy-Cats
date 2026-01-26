export class APIConfig {
    static readonly GAME_ID = 1213; // Update with actual game ID
    static readonly GATEWAY_1 = "/wp-admin/admin-ajax.php?action=get_rest_nonce";
    static readonly GATEWAY_2 = "/wp-json/chimpvine/v1/get-game-result";
    static readonly GATEWAY_3 = "/wp-json/chimpvine/v1/submit-game-result";
    static readonly GATEWAY_4 = "/wp-json/chimpvine/v1/update-game-result";

    static readonly IS_TESTING = true; // Set to true only for local development (local wordpress)
    static readonly USE_API = false; // If false, game works offline immediately
    static readonly IS_IN_DEVELOPMENT = true; // Use localStorage for progress if true, else use API
    static readonly DOMAIN_TEST = "http://localhost/wordpress";
    static readonly IFRAME_ID = "cvgame";
}
