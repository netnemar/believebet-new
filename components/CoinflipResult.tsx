'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FC } from 'react';

interface CoinflipResultProps {
  winner: boolean;
  username: string;
  onClose: () => void;
  onClaim?: () => Promise<void>;
}

const CoinflipResult: FC<CoinflipResultProps> = ({ winner, username, onClose, onClaim }) => {
  const router = useRouter();

  // Get initials for avatar display
  const getInitials = (name: string) => {
    if (name === "You") return "YO";
    if (name === "House") return "HO";
    
    if (name.includes('...')) {
      // This is likely a formatted wallet address
      return name.split('...')[0].slice(-2).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Handle button click based on winner status
  const handleButtonClick = () => {
    // Just close the modal, don't automatically claim
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 bg-bg-deep/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-b from-bg-panel to-bg-deep p-10 rounded-2xl shadow-lg border border-mint/20 text-center max-w-md w-full"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <div className="mb-6">
          {winner ? (
            <>
              <motion.div
                className="w-24 h-24 bg-mint rounded-full mx-auto mb-6 flex items-center justify-center text-4xl text-bg-deep font-bold glow-effect"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              >
                {getInitials(username)}
              </motion.div>
              <h2 className="text-2xl font-sora font-semibold text-mint mb-4">
                Congratulations! You won the flip.
              </h2>
            </>
          ) : (
            <>
              <motion.div
                className="w-24 h-24 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl text-bg-deep font-bold"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getInitials(username)}
              </motion.div>
              <h2 className="text-2xl font-sora font-semibold text-red-400 mb-4">
                {username === "House" ? "House won the flip." : `${username} won the flip.`}
              </h2>
            </>
          )}
        </div>

        <div className="mb-6">
          <p className="text-sm text-txt-dim">
            {winner ? 
              "Your winnings are ready to be claimed!" : 
              "Better luck next time!"}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleButtonClick}
          className="btn-primary w-full py-3"
        >
          Close
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default CoinflipResult; 