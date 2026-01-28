import { DecksConfig, CardData } from '../utils/GameTypes';
import decksData from '../../decks.json';

export class DeckManager {
    private static instance: DeckManager;
    private config: DecksConfig;
    private decks: Map<string, CardData[]> = new Map();

    private constructor() {
        this.config = decksData as unknown as DecksConfig;
        this.initializeDecks();
    }

    public static getInstance(): DeckManager {
        if (!DeckManager.instance) {
            DeckManager.instance = new DeckManager();
        }
        return DeckManager.instance;
    }

    private initializeDecks() {
        Object.keys(this.config.decks).forEach(key => {
            const deck = this.config.decks[key];
            this.decks.set(deck.deckId, [...deck.cards]);
            this.shuffleDeck(deck.deckId);
        });
    }

    public resetDecks() {
        this.initializeDecks();
    }

    public shuffleDeck(deckId: string) {
        const deck = this.decks.get(deckId);
        if (deck) {
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
        }
    }

    public drawCard(deckId: string): CardData | undefined {
        let deck = this.decks.get(deckId);

        if (!deck || deck.length === 0) {
            // Find original cards for this deckId to reshuffle
            const deckKey = Object.keys(this.config.decks).find(k => this.config.decks[k].deckId === deckId);
            if (deckKey) {
                console.log(`Reshuffling deck: ${deckId}`);
                this.decks.set(deckId, [...this.config.decks[deckKey].cards]);
                this.shuffleDeck(deckId);
                deck = this.decks.get(deckId);
            }
        }

        if (deck && deck.length > 0) {
            return deck.pop();
        }
        return undefined;
    }

    public getGlobalRules() {
        return this.config.globalRules;
    }

    public getAllCardsFromDeck(deckId: string): CardData[] {
        return this.decks.get(deckId) || [];
    }
}
