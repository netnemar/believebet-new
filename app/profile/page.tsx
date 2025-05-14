'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSolanaWallet } from '../../lib/SolanaWalletProvider';
import { useInternalWallet } from '../../lib/InternalWalletProvider';
import { Copy, Check, Wallet, Clock, Trophy, ExternalLink, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useGames, { Game } from '../../store/games';
import { sendWinningsFromHouse } from '../../lib/AutomaticPayoutService';

export default function ProfilePage() {
  const { connected, publicKey } = useSolanaWallet();
  const { internalWalletConnected, internalPublicKey, internalWalletBalance } = useInternalWallet();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'history' | 'winnings'>('history');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [claimingGameId, setClaimingGameId] = useState<string | null>(null);
  
  // Get all games from the store
  const allGames = useGames((s) => s.games);
  
  // Get current wallet address
  const walletAddress = connected ? publicKey?.toString() : 
                       internalWalletConnected ? internalPublicKey?.toString() : 
                       null;
  
  // Filter games for the current user
  const userGames = allGames.filter(game => 
    game.walletAddress === walletAddress
  );
  
  // Filter games that are completed, won, and unclaimed
  const unclaimedWinnings = userGames.filter(game => 
    game.completed && game.result === 'win' && !game.winningsClaimed
  );
  
  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Copy wallet address to clipboard
  const copyToClipboard = () => {
    if (!walletAddress) return;
    
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Wallet address copied to clipboard');
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  // Handle claiming winnings
  const handleClaimWinnings = async (gameId: string) => {
    if (!connected && !internalWalletConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }
    
    if (!gameId) {
      toast.error('Game ID not found');
      return;
    }
    
    setClaimingGameId(gameId);
    setIsLoading(true);
    
    try {
      // Get the game
      const game = allGames.find(g => g.id === gameId);
      
      if (!game) {
        toast.error('Game not found');
        setIsLoading(false);
        setClaimingGameId(null);
        return;
      }
      
      // Get the winning amount
      const winAmount = game.amount ? game.amount * 1.97 : 0; // 3% fee
      
      // Show loading toast
      toast.loading('Processing claim...', {
        id: 'claim-transaction'
      });
      
      // Try automatic payout if we have a wallet address
      if (walletAddress) {
        try {
          const result = await sendWinningsFromHouse(winAmount, walletAddress);
          
          if (result.success) {
            toast.dismiss('claim-transaction');
            toast.success(`${winAmount.toFixed(3)} SOL has been automatically sent to your wallet!`, {
              duration: 5000,
              icon: '💸'
            });
            
            // Update game state
            useGames.getState().updateGameClaimed(gameId, true);
            
            setIsLoading(false);
            setClaimingGameId(null);
            return;
          }
        } catch (error) {
          console.error('Automatic payout failed, falling back to manual process:', error);
        }
      }
      
      // Fallback to manual claim process
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update game state
      useGames.getState().updateGameClaimed(gameId, true);
      
      // Show success message
      toast.dismiss('claim-transaction');
      toast.success(`${winAmount.toFixed(3)} SOL has been transferred to your wallet`, {
        duration: 4000,
        icon: '💰'
      });
      
      // Add notification at the bottom
      const notificationElement = document.createElement('div');
      notificationElement.classList.add('fixed', 'bottom-4', 'right-4', 'bg-mint/10', 'border', 'border-mint/30', 'p-3', 'rounded-lg', 'flex', 'items-center', 'gap-2', 'shadow-lg', 'max-w-xs');
      notificationElement.innerHTML = `
        <span>🪙</span>
        <div>
          <p class="text-mint font-medium">Winnings claimed!</p>
          <p class="text-xs text-mint/70">${winAmount.toFixed(3)} SOL has been transferred to your wallet</p>
        </div>
      `;
      document.body.appendChild(notificationElement);
      
      // Remove notification after a few seconds
      setTimeout(() => {
        if (document.body.contains(notificationElement)) {
          document.body.removeChild(notificationElement);
        }
      }, 6000);
    } catch (error: any) {
      console.error('Error claiming winnings:', error);
      toast.error(error.message || 'Failed to claim winnings');
      toast.dismiss('claim-transaction');
    } finally {
      setIsLoading(false);
      setClaimingGameId(null);
    }
  };
  
  // Open game details
  const goToGame = (gameId: string) => {
    router.push(`/coinflip/${gameId}`);
  };
  
  // If not connected, show message
  if (!connected && !internalWalletConnected) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="glass p-8 text-center">
          <h1 className="text-2xl font-sora mb-6">Profile</h1>
          <p className="text-txt-dim mb-4">Please connect your wallet to view your profile</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="btn-primary px-6 py-2"
          >
            Connect Wallet
          </motion.button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-sora mb-6">Your Profile</h1>
      
      {/* Wallet Info */}
      <div className="glass p-6 mb-8">
        <h2 className="text-xl font-sora text-mint mb-4 flex items-center gap-2">
          <Wallet size={18} />
          <span>Wallet Information</span>
        </h2>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="text-sm text-txt-dim mb-1">Wallet Address:</div>
            <div className="flex items-center">
              <span className="bg-bg-panel px-4 py-2 rounded border border-white/5 flex-1 font-mono text-sm truncate">
                {walletAddress}
              </span>
              <button 
                onClick={copyToClipboard} 
                className="ml-2 p-2 bg-bg-glass rounded-full hover:bg-bg-panel transition-colors"
              >
                {copied ? <Check size={16} className="text-mint" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          
          <div className="bg-bg-glass p-3 rounded-lg border border-mint/10">
            <div className="text-sm text-txt-dim mb-1">Connected with:</div>
            <div className="font-medium text-mint">
              {connected ? 'External Wallet' : 'Internal Wallet'}
            </div>
          </div>
        </div>
        
        {internalWalletConnected && (
          <div className="bg-mint/10 p-3 rounded border border-mint/20 flex items-center justify-between">
            <div>
              <div className="text-sm">Internal Wallet Balance:</div>
              <div className="text-lg font-semibold text-mint">{internalWalletBalance.toFixed(4)} SOL</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="btn-primary btn-sm px-3 py-1 text-sm"
            >
              Add Funds
            </motion.button>
          </div>
        )}
      </div>
      
      {/* Game History & Winnings Tabs */}
      <div className="glass p-6">
        <div className="flex border-b border-white/10 mb-6">
          <button
            className={`px-4 py-2 ${activeTab === 'history' ? 'text-mint border-b-2 border-mint' : 'text-txt-dim'}`}
            onClick={() => setActiveTab('history')}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Game History</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 relative ${activeTab === 'winnings' ? 'text-mint border-b-2 border-mint' : 'text-txt-dim'}`}
            onClick={() => setActiveTab('winnings')}
          >
            <div className="flex items-center gap-2">
              <Trophy size={16} />
              <span>Unclaimed Winnings</span>
            </div>
            {unclaimedWinnings.length > 0 && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-mint rounded-full"></div>
            )}
          </button>
        </div>
        
        {activeTab === 'history' && (
          <div>
            <h3 className="text-lg font-sora mb-4">Your Game History</h3>
            
            {userGames.length === 0 ? (
              <div className="text-center py-10 text-txt-dim">
                <p className="mb-4">You haven't played any games yet</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/coinflip')}
                  className="btn-primary px-6 py-2"
                >
                  Play Now
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                {userGames.sort((a, b) => b.createdAt - a.createdAt).map(game => (
                  <div key={game.id} className="p-4 bg-bg-glass rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-3 h-3 rounded-full ${
                          game.completed && game.result === 'win' ? 'bg-mint' : 
                          game.completed && game.result === 'lose' ? 'bg-red-500' : 
                          'bg-yellow-500'
                        }`}></span>
                        <span>
                          {game.isHousePlay ? 'House Game' : game.isSelfPlay ? 'Self-Play' : 'Public Game'}
                        </span>
                        <span className="text-txt-dim text-sm ml-auto">{formatDate(game.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{game.amount} SOL</span>
                        <span className="text-sm text-txt-dim">
                          {game.completed ? (
                            game.result === 'win' ? (
                              <span className="text-mint">Win</span>
                            ) : (
                              <span className="text-red-400">Loss</span>
                            )
                          ) : (
                            <span className="text-yellow-500">In Progress</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {game.completed && game.result === 'win' && !game.winningsClaimed && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleClaimWinnings(game.id)}
                          disabled={isLoading && claimingGameId === game.id}
                          className="btn-primary btn-sm px-4 py-1 text-sm"
                        >
                          {isLoading && claimingGameId === game.id ? 'Processing...' : 'Claim'}
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => goToGame(game.id)}
                        className="btn-secondary btn-sm px-4 py-1 text-sm"
                      >
                        View
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'winnings' && (
          <div>
            <h3 className="text-lg font-sora mb-4">Unclaimed Winnings</h3>
            
            {unclaimedWinnings.length === 0 ? (
              <div className="text-center py-10 text-txt-dim">
                <p>You don't have any unclaimed winnings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unclaimedWinnings.map(game => (
                  <div key={game.id} className="p-4 bg-mint/10 rounded-lg border border-mint/20 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-10 h-10 bg-mint rounded-full flex items-center justify-center text-bg-deep font-semibold">
                      {game.walletAddress ? game.walletAddress.slice(0, 2).toUpperCase() : 'XX'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {game.isHousePlay ? 'House Game' : game.isSelfPlay ? 'Self-Play' : 'Public Game'}
                        </span>
                        <span className="text-txt-dim text-sm ml-auto">{formatDate(game.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-sora text-lg text-mint">{(game.amount * 1.97).toFixed(3)} SOL</span>
                        <span className="text-sm text-mint/70">Ready to claim</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaimWinnings(game.id)}
                        disabled={isLoading && claimingGameId === game.id}
                        className="btn-primary px-4 py-2"
                      >
                        {isLoading && claimingGameId === game.id ? 'Processing...' : 'Claim Winnings'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => goToGame(game.id)}
                        className="btn-secondary p-2"
                      >
                        <ExternalLink size={16} />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 p-4 bg-bg-glass rounded-lg border border-white/5 flex items-start gap-3">
              <div className="p-2 rounded-full bg-mint/20 text-mint">
                <HelpCircle size={20} />
              </div>
              <div className="text-sm text-txt-dim">
                <p className="mb-2">
                  <strong className="text-white">How winnings work:</strong> When you win a game, your winnings are available to claim.
                  Unclaimed winnings will remain here until you claim them. Claiming transfers the winnings to your wallet.
                </p>
                <p>
                  If you encounter any issues with claiming, please contact support.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 