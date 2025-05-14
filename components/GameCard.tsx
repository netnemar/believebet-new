'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { Game } from '../store/games';
import { useSolanaWallet } from '../lib/SolanaWalletProvider';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  game: Game;
}

export default function GameCard({ game }: Props) {
  const router = useRouter();
  const { connected } = useSolanaWallet();
  const [isHovered, setIsHovered] = useState(false);
  
  // Get wallet initials
  const walletInitials = game.walletAddress ? game.walletAddress.slice(0, 2).toUpperCase() : 'XX';
  
  const onJoin = () => {
    if (!connected) {
      toast.error('Please connect your wallet first!');
      return;
    }
    router.push(`/coinflip/${game.id}`);
  };

  // Format date
  const gameDate = new Date(game.createdAt);
  const formattedDate = gameDate.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`glass ${isHovered ? 'shadow-mint/40' : ''} p-4 flex items-center gap-4 transition-all`}
    >
      <div className="relative">
        <div className="w-10 h-10 bg-mint rounded-full flex items-center justify-center text-bg-deep font-semibold">
          {walletInitials}
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-mint rounded-full border border-bg-panel"></div>
      </div>
      
      <div className="flex-1">
        <span className="font-medium text-sm block">{game.walletAddress ? game.walletAddress.slice(0, 6) + '...' + game.walletAddress.slice(-4) : game.username}</span>
        <span className="text-xs text-txt-dim">{formattedDate}</span>
      </div>
      
      <div className="flex flex-col items-end mr-2">
        <span className="font-sora font-semibold text-mint">{game.amount} SOL</span>
        <span className="text-xs text-txt-dim">≈ ${(game.amount * 150).toFixed(2)}</span>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onJoin}
        className="btn-primary px-3 py-1 text-xs"
      >
        Join Game
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push(`/coinflip/${game.id}`)}
        className="p-2 rounded-full bg-bg-panel border border-white/5 hover:border-white/20 transition-all"
      >
        <Eye size={16} className="text-txt-dim" />
      </motion.button>
    </motion.div>
  );
} 