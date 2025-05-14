'use client';

import Image from 'next/image';
import { useJackpot, HOUSE_WALLET_ADDRESS } from '../store/jackpot';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Check, Copy, ArrowDown, Wallet, Clock, Medal } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSolanaWallet } from '../lib/SolanaWalletProvider';
import { useInternalWallet } from '../lib/InternalWalletProvider';
import { useSolanaTransaction } from '../lib/useSolanaTransaction';
import { getAssetUrl } from '../lib/utils';
import { sendWinningsFromHouse } from '../lib/AutomaticPayoutService';

export default function WinnerCard() {
  const winners = useJackpot((s) => s.lastWinners);
  const [isCopied, setIsCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  
  // Get the most recent winner
  const winner = winners.length > 0 ? winners[0] : null;
  
  // Get wallet info
  const { connected, publicKey } = useSolanaWallet();
  const { 
    internalPublicKey, 
    internalWalletConnected, 
    transferFromInternal,
    internalWalletBalance
  } = useInternalWallet();
  const { getConnection } = useSolanaTransaction();

  // Check if current user is the winner
  const isWinner = winner && (
    (connected && publicKey && winner.walletAddress === publicKey.toString()) || 
    (internalWalletConnected && internalPublicKey && winner.walletAddress === internalPublicKey.toString())
  );

  // Format timestamp to readable date
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Format wallet address for display
  const formatWalletAddress = (address: string | undefined) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Handle copy address
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setIsCopied(true);
    toast.success('Address copied to clipboard');
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle claiming rewards
  const handleClaimReward = async () => {
    if (!winner || !isWinner) {
      toast.error('You are not the winner of this round');
      return;
    }

    setIsClaimingReward(true);
    
    try {
      // Try automatic payout first if winner wallet address exists
      if (winner.walletAddress) {
        toast.loading('Processing automatic payout...', {
          id: 'jackpot-payout'
        });
        
        const result = await sendWinningsFromHouse(winner.amount, winner.walletAddress);
        
        if (result.success) {
          toast.dismiss('jackpot-payout');
          toast.success(`${winner.amount.toFixed(3)} SOL has been automatically sent to your wallet!`, {
            duration: 5000,
            icon: '💸'
          });
          
          setHasClaimedReward(true);
          
          // Add notification at the bottom
          const notificationElement = document.createElement('div');
          notificationElement.classList.add('fixed', 'bottom-4', 'right-4', 'bg-mint/10', 'border', 'border-mint/30', 'p-3', 'rounded-lg', 'flex', 'items-center', 'gap-2', 'shadow-lg', 'max-w-xs');
          notificationElement.innerHTML = `
            <span>🪙</span>
            <div>
              <p class="text-mint font-medium">Jackpot winnings sent!</p>
              <p class="text-xs text-mint/70">${winner.amount.toFixed(3)} SOL has been transferred to your wallet</p>
            </div>
          `;
          document.body.appendChild(notificationElement);
          
          // Remove notification after a few seconds
          setTimeout(() => {
            if (document.body.contains(notificationElement)) {
              document.body.removeChild(notificationElement);
            }
          }, 6000);
          
          setIsClaimingReward(false);
          return;
        }
        
        toast.dismiss('jackpot-payout');
        // Fallthrough to legacy methods if automatic payout fails
      }

      // Check if winner is using internal or external wallet
      if (winner.isInternal && internalWalletConnected && internalPublicKey) {
        // If user is playing with internal wallet, transfer winnings to their wallet directly
        toast.success(`Winnings (${winner.amount.toFixed(3)} SOL) are already in your site wallet`);
        setHasClaimedReward(true);
      } else if (connected && publicKey) {
        // If using external wallet, show transaction info
        toast.success(`Your SOL is already in your wallet address: ${formatWalletAddress(publicKey.toString())}`);
        
        // Show the reward claimed message
        setHasClaimedReward(true);
        
        // Add notification at the bottom
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('fixed', 'bottom-4', 'right-4', 'bg-mint/10', 'border', 'border-mint/30', 'p-3', 'rounded-lg', 'flex', 'items-center', 'gap-2', 'shadow-lg', 'max-w-xs');
        notificationElement.innerHTML = `
          <span>🪙</span>
          <div>
            <p class="text-mint font-medium">Jackpot winnings claimed!</p>
            <p class="text-xs text-mint/70">${winner.amount.toFixed(3)} SOL has been transferred to your wallet</p>
          </div>
        `;
        document.body.appendChild(notificationElement);
        
        // Remove notification after a few seconds
        setTimeout(() => {
          if (document.body.contains(notificationElement)) {
            document.body.removeChild(notificationElement);
          }
        }, 6000);
      } else {
        toast.error('Connect the wallet you used to play to claim rewards');
      }
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast.error(error.message || 'Failed to claim reward');
    } finally {
      setIsClaimingReward(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Last Winner */}
      <div className="glass p-4 w-full md:w-64 border border-mint/5 rounded-xl shadow-lg">
        <p className="text-xs font-medium text-mint-soft mb-3">Last Winner</p>
        {winner ? (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 bg-mint rounded-full flex items-center justify-center text-bg-deep font-semibold text-xl ${isWinner ? 'ring-2 ring-white' : ''}`}>
              {winner.walletAddress ? winner.walletAddress.slice(0, 2).toUpperCase() : '??'}
            </div>
            <p className="text-sm">{formatWalletAddress(winner.walletAddress)}</p>
            <p className="font-semibold text-mint">+{winner.amount.toFixed(3)} SOL</p>
            <p className="text-xs text-txt-dim">Chance: {winner.chance.toFixed(2)}%</p>
            
            <div className="flex items-center gap-1 text-xs text-txt-dim">
              <Clock size={12} />
              <span>{formatTime(winner.timestamp)}</span>
            </div>
            
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-mint/80 hover:text-mint transition-colors mt-1"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
              <ArrowDown 
                size={14} 
                className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
              />
            </button>
            
            {showDetails && winner.walletAddress && (
              <div className="w-full mt-2 bg-bg-panel rounded-lg p-3 text-xs border border-mint/10">
                <div className="flex justify-between items-center mb-1 text-txt-dim">
                  <span>Wallet:</span>
                  <button
                    onClick={() => handleCopyAddress(winner.walletAddress!)}
                    className="p-1 hover:text-mint transition-colors"
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <p className="font-mono text-xs truncate text-mint/70 mb-2">
                  {winner.walletAddress.slice(0, 12)}...{winner.walletAddress.slice(-6)}
                </p>
                
                <div className="text-txt-dim text-xs">
                  <div className="flex items-center gap-1">
                    <Wallet size={12} />
                    <span>{winner.isInternal ? 'Site Wallet' : 'External Wallet'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {isWinner && !hasClaimedReward && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-3 p-3 bg-mint/10 border border-mint/30 rounded-lg"
              >
                <p className="text-mint text-sm mb-2">You won this round! 🎉</p>
                <p className="text-xs text-mint/70 mb-3">
                  Claim your winnings by clicking the button below
                </p>
                
                <button
                  onClick={handleClaimReward}
                  disabled={isClaimingReward}
                  className="w-full py-2 bg-mint text-bg-deep text-sm font-medium rounded-lg hover:bg-mint-soft transition-colors"
                >
                  {isClaimingReward ? 'Processing...' : 'Claim Winnings'}
                </button>
              </motion.div>
            )}
            
            {isWinner && hasClaimedReward && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-3 p-3 bg-mint/10 border border-mint/30 rounded-lg"
              >
                <p className="text-mint text-sm mb-2">Winnings claimed! 🎉</p>
                <p className="text-xs text-mint/70 mb-3">
                  {winner.amount.toFixed(3)} SOL has been transferred to your wallet
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          <p className="text-txt-dim text-sm text-center py-4">No winner yet</p>
        )}
      </div>

      {/* House address information */}
      <div className="glass p-4 w-full md:w-64 border border-mint/5 rounded-xl shadow-lg">
        <p className="text-xs font-medium text-mint-soft mb-3">House Address</p>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-mint/70">Contract:</span>
          <button
            onClick={() => handleCopyAddress(HOUSE_WALLET_ADDRESS)}
            className="p-1 text-txt-dim hover:text-mint transition-colors"
          >
            {isCopied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
        <p className="font-mono text-xs truncate">
          {HOUSE_WALLET_ADDRESS.slice(0, 10)}...{HOUSE_WALLET_ADDRESS.slice(-6)}
        </p>
        <p className="text-txt-dim text-xs mt-2">
          All jackpot fees go to this address
        </p>
      </div>
      
      {/* Winner history */}
      {winners.length > 1 && (
        <div className="glass p-4 w-full md:w-64">
          <div className="flex items-center gap-2 mb-3">
            <Medal size={14} className="text-mint" />
            <p className="text-xs text-txt-dim">Winners History</p>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {winners.slice(1).map((pastWinner, index) => (
              <div key={index} className="flex items-center gap-2 p-1 hover:bg-bg-panel rounded">
                <div className="w-6 h-6 bg-mint rounded-full flex items-center justify-center text-bg-deep font-medium text-xs flex-shrink-0">
                  {pastWinner.walletAddress ? pastWinner.walletAddress.slice(0, 2).toUpperCase() : '??'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs truncate">{formatWalletAddress(pastWinner.walletAddress)}</p>
                  <p className="text-xs text-mint">{pastWinner.amount.toFixed(3)} SOL</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 