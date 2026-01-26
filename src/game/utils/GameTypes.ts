export interface CardEffect {
    op: string;
    params: any;
}

export interface CardData {
    id: string;
    type: string;
    title: string;
    mandatory: boolean;
    affects: string;
    timing: string;
    effect: CardEffect;
}

export interface DeckData {
    deckId: string;
    description: string;
    cards: CardData[];
}

export interface GameDecks {
    [key: string]: DeckData;
}

export interface GlobalRules {
    rounds: number;
    cardsPerPlayerPerRound: number;
    startingCash: number;
    roundStart: CardEffect[];
    endOfRound: CardEffect[];
}

export interface DecksConfig {
    meta: {
        game: string;
        version: string;
        notes: string;
    };
    decks: GameDecks;
    globalRules: GlobalRules;
}
