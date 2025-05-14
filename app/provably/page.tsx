'use client';

import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

function FaqItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="mb-4 border border-white/5 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left flex justify-between items-center hover:bg-bg-panel/50 transition-colors"
      >
        <span className="font-medium">{title}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 pt-0 text-txt-dim bg-bg-panel/20"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

export default function ProvablyFairPage() {
  return (
    <div className="glass p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-sora mb-6 text-center text-mint-soft">Provably Fair System</h1>
      
      <p className="mb-6 text-center">
        BelieveBet uses a provably fair system to ensure all games are completely transparent and verifiable by our players.
      </p>
      
      <h2 className="text-xl font-sora mb-4 text-mint-soft">How It Works</h2>
      
      <div className="mb-8 space-y-6 text-txt-dim">
        <div className="glass p-4">
          <h3 className="text-lg font-sora mb-2">CoinFlip</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>When a game is created, we collect data from the Solana blockchain.</li>
            <li>The winning side (heads or tails) is determined using the hash of the most recent Solana block at the time the game is joined.</li>
            <li>Block hash serves as an immutable random seed that cannot be manipulated.</li>
            <li>The hash is converted to a number, and if it's even, the result is heads; if it's odd, the result is tails.</li>
            <li>All transaction details, including the block hash, are displayed after each game.</li>
          </ol>
        </div>
        
        <div className="glass p-4">
          <h3 className="text-lg font-sora mb-2">Jackpot</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Each jackpot round collects multiple tickets from different players.</li>
            <li>When the jackpot ends, we use the latest Solana block hash as a random seed.</li>
            <li>This hash is converted to a numerical value and used to select a winning ticket.</li>
            <li>The chance of winning is proportional to the amount of tickets purchased.</li>
            <li>The entire selection process is visible and verifiable on the blockchain.</li>
          </ol>
        </div>
      </div>
      
      <h2 className="text-xl font-sora mb-4 text-mint-soft">Verification</h2>
      <p className="mb-6 text-txt-dim">
        After each game, you can verify the fairness by:
      </p>
      
      <div className="glass p-6 mb-8">
        <ol className="list-decimal pl-5 space-y-3 text-txt-dim">
          <li>Checking the provided block hash and transaction hash</li>
          <li>Verifying these hashes on a Solana block explorer (e.g., Solscan or Solana Explorer)</li>
          <li>Confirming the timing of the block in relation to your game</li>
          <li>Comparing the result calculated from the hash with the displayed result</li>
        </ol>
      </div>
      
      <h2 className="text-xl font-sora mb-4 text-mint-soft">Frequently Asked Questions</h2>
      
      <div className="mb-8">
        <FaqItem title="Can BelieveBet manipulate the outcome of games?">
          <p className="mb-2">
            No. BelieveBet uses the Solana blockchain as a source of randomness, which is completely outside our control.
            The outcomes are determined by block hashes which are immutable and created by the network, not by us.
          </p>
          <p>
            All game results can be independently verified by any player by checking the block hash and transaction details.
          </p>
        </FaqItem>
        
        <FaqItem title="What is the house edge?">
          <p>
            BelieveBet takes a small fee of 3% from each game to maintain the platform. This fee is transparently displayed
            before you place any bet. The remaining 97% goes directly to the winner's pool.
          </p>
        </FaqItem>
        
        <FaqItem title="How do I know the game isn't delaying to choose favorable blocks?">
          <p>
            Game outcomes are always determined using the next block after all players have joined. This is verifiable
            through the timestamps of your transaction and the block used for the result. There's no way for us to
            predict future block hashes or delay the selection.
          </p>
        </FaqItem>
        
        <FaqItem title="Can I verify old games I've played?">
          <p>
            Yes! Every game's result page displays the block hash and transaction hash used to determine the outcome.
            These can be verified on any Solana block explorer at any time, creating a permanent record of fairness.
          </p>
        </FaqItem>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-txt-dim">
          If you have more questions about our provably fair system, please contact our support team.
        </p>
      </div>
    </div>
  );
} 