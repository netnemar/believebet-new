'use client';

import { useEffect, useMemo } from 'react';
import { useJackpot } from '../store/jackpot';
import { motion } from 'framer-motion';
import { Clock, Users, DollarSign, Percent } from 'lucide-react';
import { useSolanaWallet } from '../lib/SolanaWalletProvider';
import { useInternalWallet } from '../lib/InternalWalletProvider';

export default function JackpotPanel() {
  const pot = useJackpot((s) => s.pot);
  const timeLeft = useJackpot((s) => s.timeLeft);
  const tick = useJackpot((s) => s.tick);
  const tickets = useJackpot((s) => s.tickets);
  const spinning = useJackpot((s) => s.spinning);

  // Get wallet info
  const { connected, publicKey } = useSolanaWallet();
  const { internalPublicKey, internalWalletConnected } = useInternalWallet();

  // Tick the timer every second
  useEffect(() => {
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [tick]);

  // Format time as minutes:seconds
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  
  // Count unique participants (by wallet address)
  const uniqueParticipants = new Set(tickets.map(t => t.walletAddress)).size;

  // Calculate the current user's winning chance
  const currentWinningChance = useMemo(() => {
    // If no tickets or not connected, return 0
    if (tickets.length === 0 || (!connected && !internalWalletConnected)) return 0;

    const currentWalletAddress = internalWalletConnected && internalPublicKey 
      ? internalPublicKey.toString() 
      : (publicKey ? publicKey.toString() : null);

    if (!currentWalletAddress) return 0;

    // Sum the total bets
    const totalBets = tickets.reduce((sum, ticket) => sum + ticket.amount, 0);
    
    // Sum the current user's bets
    const userBets = tickets
      .filter(ticket => ticket.walletAddress === currentWalletAddress)
      .reduce((sum, ticket) => sum + ticket.amount, 0);
    
    // Calculate percentage (avoid division by zero)
    return totalBets > 0 ? (userBets / totalBets) * 100 : 0;
  }, [tickets, connected, internalWalletConnected, publicKey, internalPublicKey]);

  return (
    <div className="glass p-6 text-center mb-6 border border-mint/5 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-sora font-semibold mb-4 text-mint">Jackpot Game</h2>
        
        {/* Main pot value with animation */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ 
            scale: [0.98, 1.02, 0.98], 
            rotate: spinning ? [-1, 1, -1] : 0 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: spinning ? 0.3 : 2, 
            ease: "easeInOut" 
          }}
          className="mb-6"
        >
          <p className="text-xs text-txt-dim mb-1">Current Pot</p>
          <p className="text-5xl font-bold font-sora mb-1 text-white">
            {pot.toFixed(3)} <span className="text-mint">SOL</span>
          </p>
          
          {/* User's winning chance */}
          {currentWinningChance > 0 && (
            <div className="mt-2 bg-mint/10 py-1 px-3 rounded-full inline-flex items-center gap-1 border border-mint/20">
              <Percent size={14} className="text-mint" />
              <p className="text-sm font-medium text-mint">
                Your chance: {currentWinningChance.toFixed(2)}%
              </p>
            </div>
          )}
        </motion.div>
        
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-bg-deep p-3 rounded-lg border border-white/5 shadow-inner">
            <div className="flex justify-center mb-1">
              <Clock size={18} className="text-mint" />
            </div>
            <p className="text-xs text-txt-dim mb-1">Next Roll In</p>
            <p className="text-lg font-bold">{minutes}:{seconds}</p>
          </div>
          
          <div className="bg-bg-deep p-3 rounded-lg border border-white/5 shadow-inner">
            <div className="flex justify-center mb-1">
              <Users size={18} className="text-mint" />
            </div>
            <p className="text-xs text-txt-dim mb-1">Players</p>
            <p className="text-lg font-bold">{uniqueParticipants}</p>
          </div>
          
          <div className="bg-bg-deep p-3 rounded-lg border border-white/5 shadow-inner">
            <div className="flex justify-center mb-1">
              <DollarSign size={18} className="text-mint" />
            </div>
            <p className="text-xs text-txt-dim mb-1">Total Bets</p>
            <p className="text-lg font-bold">{tickets.length}</p>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className={`p-2 rounded-full ${spinning ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/20' : 'bg-green-600/30 text-green-400 border border-green-500/20'} shadow-sm`}>
          <p className="text-xs font-medium">
            {spinning ? 'Spinning - Good Luck!' : 'Accepting Bets'}
          </p>
        </div>
      </motion.div>
    </div>
  );
} 