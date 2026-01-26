export interface RoomDefinition {
    id: string;
    name: string;
    points: number[];
    color: number;
}

export const GameConfig = {
    // Visual Settings
    visuals: {
        transitionDuration: 500,
        cardSlideDuration: 500,
        overlayFadeDuration: 500,
        coinGlideDuration: 500,
        panelPopDuration: 500,
        coinStaggerDelay: 80,
        cardEntranceY: 400, // Offset from bottom screen height
        overlayAlpha: 0.6
    },

    // Room Definitions
    rooms: [
        {
            id: 'cash',
            name: 'CASH',
            points: [604, 514, 929, 505, 916, 103, 659, 233, 572, 276],
            color: 0x4CAF50
        },
        {
            id: 'goods',
            name: 'GOODS',
            points: [945, 504, 1317, 505, 1337, 228, 1135, 138, 937, 173],
            color: 0x2196F3
        },
        {
            id: 'emergency',
            name: 'EMERGENCY',
            points: [583, 764, 963, 768, 925, 523, 595, 535, 548, 604],
            color: 0xFF9800
        },
        {
            id: 'investment',
            name: 'INVESTMENT',
            points: [978, 763, 1318, 755, 1320, 526, 937, 523],
            color: 0xE91E63
        },
        {
            id: 'storage',
            name: 'STORAGE',
            points: [622, 999, 1286, 992, 1265, 769, 580, 778],
            color: 0x9E9E9E
        },
        {
            id: 'basic',
            name: 'MAINTENANCE / LIVING',
            points: [438, 694, 590, 516, 540, 148, 322, 230, 295, 662],
            color: 0xFFEB3B
        },
        {
            id: 'active',
            name: 'ACTIVE',
            points: [1342, 644, 1601, 624, 1593, 257, 1347, 244],
            color: 0xCDDC39
        },
        {
            id: 'candy',
            name: 'CANDY',
            points: [300, 1007, 589, 1010, 554, 742, 290, 691],
            color: 0x795548
        },
        {
            id: 'demon',
            name: 'DEMON',
            points: [1343, 990, 1596, 998, 1597, 705, 1333, 717],
            color: 0x000000
        }
    ] as RoomDefinition[],

    // Production Slot Coordinates
    production: {
        maxSlots: 3,
        slots: [
            { x: 1069, y: 382 },
            { x: 1205, y: 386 },
            { x: 1198, y: 258 }
        ]
    },

    // Starting setup
    initialSetup: {
        spawnDelay: 100,
        initialDelay: 800
    },

    // Gameplay settings
    gameplay: {
        maxStages: 2,
        roundsPerStage: 3,
        totalPlayers: 2,
        initialCash: [10, 5, 5, 2, 2, 2, 1, 1, 1, 1],
        text: {
            stage: "STAGE",
            round: "ROUND",
            player: "PLAYER"
        }
    },

    // Coin Config
    coins: {
        radius: 40,
        margin: 45, // radius + safety
        values: [10, 5, 2, 1],
        configs: {
            1: { value: 1, color: 0x4CAF50, colorStr: 'green' },
            2: { value: 2, color: 0x9C27B0, colorStr: 'purple' },
            5: { value: 5, color: 0xFFEB3B, colorStr: 'yellow' },
            10: { value: 10, color: 0x03A9F4, colorStr: 'blue' }
        } as Record<number, { value: number, color: number, colorStr: string }>
    }
};
