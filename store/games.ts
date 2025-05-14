import { create } from 'zustand';
import { faker } from '@faker-js/faker';

export type GameResult = 'win' | 'lose' | null;

export interface Game {
  id: string;
  username: string;
  avatar: string;
  amount: number; // SOL
  createdAt: number;
  walletAddress?: string; // Wallet address of the player
  parentGameId?: string; // For linking self-play games
  side?: 'heads' | 'tails'; // Which side the player chose
  isSelfPlay?: boolean; // Flag for self-play games
  isHousePlay?: boolean; // Flag for house play games
  isHouse?: boolean; // Flag for house player
  completed?: boolean; // Whether the game is completed
  result?: GameResult; // The result of the game
  winningsClaimed?: boolean; // Whether winnings have been claimed
}

type SortOrder = 'high' | 'low' | 'newest';

interface GamesState {
  games: Game[];
  sort: SortOrder;
  setSort: (sort: SortOrder) => void;
  addGame: (g: Omit<Game, 'id' | 'createdAt'>) => string;
  updateGameResult: (id: string, result: GameResult) => void;
  updateGameClaimed: (id: string, claimed: boolean) => void;
}

// Only generate real games created by actual players
function generateMockGames(): Game[] {
  return [];
}

const persisted = typeof window !== 'undefined' && sessionStorage.getItem('believebet_games');

const useGames = create<GamesState>((set, get) => ({
  games: persisted ? (JSON.parse(persisted) as Game[]) : generateMockGames(),
  sort: 'newest',
  setSort: (sort) => set({ sort }),
  addGame: (g) => {
    const newGame: Game = { 
      ...g, 
      id: faker.string.uuid(), 
      createdAt: Date.now(),
      completed: false,
      result: null,
      winningsClaimed: false
    };
    const updated = [newGame, ...get().games];
    set({ games: updated });
    if (typeof window !== 'undefined') sessionStorage.setItem('believebet_games', JSON.stringify(updated));
    return newGame.id;
  },
  updateGameResult: (id, result) => {
    const games = get().games;
    const updated = games.map(game => 
      game.id === id ? { ...game, completed: true, result } : game
    );
    set({ games: updated });
    if (typeof window !== 'undefined') sessionStorage.setItem('believebet_games', JSON.stringify(updated));
  },
  updateGameClaimed: (id, claimed) => {
    const games = get().games;
    const updated = games.map(game => 
      game.id === id ? { ...game, winningsClaimed: claimed } : game
    );
    set({ games: updated });
    if (typeof window !== 'undefined') sessionStorage.setItem('believebet_games', JSON.stringify(updated));
  },
}));

export default useGames; 